-- Fix Phase F3: Structured Reasons System (corrected)

-- Create reason categories enum
CREATE TYPE public.reason_category AS ENUM (
    'maintenance',      -- Manutenção
    'loan',            -- Empréstimo 
    'sale',            -- Venda
    'warranty',        -- Garantia
    'demonstration',   -- Demonstração
    'internal_use',    -- Uso interno
    'transfer',        -- Transferência
    'return',          -- Devolução
    'disposal'         -- Descarte
);

-- Create reason priority enum  
CREATE TYPE public.reason_priority AS ENUM (
    'low',
    'medium', 
    'high',
    'urgent'
);

-- Enhance reasons table with structured data
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS category reason_category;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS priority reason_priority DEFAULT 'medium';
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS max_duration_hours INTEGER;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS notification_template TEXT;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS workflow_config JSONB;

-- Create reason workflows table
CREATE TABLE IF NOT EXISTS public.reason_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reason_id UUID NOT NULL REFERENCES public.reasons(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN ('approval', 'notification', 'auto_action')),
    assigned_role granular_role,
    conditions JSONB,
    actions JSONB,
    timeout_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(reason_id, step_order)
);

-- Create SLA tracking table
CREATE TABLE IF NOT EXISTS public.sla_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    reason_id UUID NOT NULL REFERENCES public.reasons(id),
    sla_start_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    sla_end_time TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ NOT NULL,
    actual_completion TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
    overdue_notified_at TIMESTAMPTZ,
    escalation_level INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create movement approvals table
CREATE TABLE IF NOT EXISTS public.movement_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    workflow_step_id UUID REFERENCES public.reason_workflows(id),
    required_role granular_role NOT NULL,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.reason_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reason_workflows
CREATE POLICY "Admins can manage reason workflows"
    ON public.reason_workflows FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "All authenticated users can view reason workflows"
    ON public.reason_workflows FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for sla_tracking
CREATE POLICY "All authenticated users can view SLA tracking"
    ON public.sla_tracking FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage SLA tracking"
    ON public.sla_tracking FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for movement_approvals
CREATE POLICY "Users can view their assigned approvals"
    ON public.movement_approvals FOR SELECT
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND (
            approved_by = auth.uid() OR
            user_has_permission(auth.uid(), 'movements.approve'::permission) OR
            get_user_role(auth.uid()) = 'admin'::app_role
        )
    );

CREATE POLICY "Authorized users can manage approvals"
    ON public.movement_approvals FOR ALL
    TO authenticated
    USING (
        user_has_permission(auth.uid(), 'movements.approve'::permission) OR
        get_user_role(auth.uid()) = 'admin'::app_role
    );

-- Create updated_at triggers (only for tables that have updated_at column)
CREATE TRIGGER update_sla_tracking_updated_at
    BEFORE UPDATE ON public.sla_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movement_approvals_updated_at
    BEFORE UPDATE ON public.movement_approvals  
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create SLA monitoring functions
CREATE OR REPLACE FUNCTION public.check_sla_overdue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Mark overdue SLAs
    UPDATE public.sla_tracking
    SET 
        status = 'overdue',
        escalation_level = escalation_level + 1,
        updated_at = now()
    WHERE status = 'active'
    AND estimated_completion < now()
    AND actual_completion IS NULL;

    -- Log overdue notifications
    PERFORM public.log_audit_event(
        'sla_overdue_check',
        jsonb_build_object(
            'overdue_count', (SELECT COUNT(*) FROM public.sla_tracking WHERE status = 'overdue'),
            'checked_at', now()
        )
    );
END;
$$;

-- Create workflow execution function
CREATE OR REPLACE FUNCTION public.execute_reason_workflow(
    p_loan_id UUID,
    p_reason_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    workflow_record RECORD;
    result jsonb := '{"success": true, "steps_executed": 0, "approvals_required": []}'::jsonb;
    steps_count integer := 0;
BEGIN
    -- Execute workflow steps in order
    FOR workflow_record IN
        SELECT * FROM public.reason_workflows
        WHERE reason_id = p_reason_id
        ORDER BY step_order
    LOOP
        steps_count := steps_count + 1;
        
        -- Handle different step types
        CASE workflow_record.step_type
            WHEN 'approval' THEN
                -- Create approval requirement
                INSERT INTO public.movement_approvals (
                    loan_id,
                    workflow_step_id,
                    required_role,
                    expires_at
                ) VALUES (
                    p_loan_id,
                    workflow_record.id,
                    workflow_record.assigned_role,
                    CASE 
                        WHEN workflow_record.timeout_hours IS NOT NULL 
                        THEN now() + (workflow_record.timeout_hours || ' hours')::INTERVAL
                        ELSE NULL
                    END
                );
                
                -- Add to result
                result := jsonb_set(
                    result,
                    '{approvals_required}',
                    result->'approvals_required' || jsonb_build_array(workflow_record.assigned_role)
                );
                
            WHEN 'notification' THEN
                -- Log notification
                PERFORM public.log_audit_event(
                    'workflow_notification',
                    jsonb_build_object(
                        'loan_id', p_loan_id,
                        'step_name', workflow_record.step_name,
                        'assigned_role', workflow_record.assigned_role
                    )
                );
                
            WHEN 'auto_action' THEN
                -- Log auto action
                PERFORM public.log_audit_event(
                    'workflow_auto_action',
                    jsonb_build_object(
                        'loan_id', p_loan_id,
                        'step_name', workflow_record.step_name,
                        'actions', workflow_record.actions
                    )
                );
        END CASE;
    END LOOP;

    -- Update result with steps executed
    result := jsonb_set(result, '{steps_executed}', to_jsonb(steps_count));
    
    RETURN result;
END;
$$;

-- Insert default reason categories and workflows
UPDATE public.reasons 
SET category = 'loan'::reason_category, 
    priority = 'medium'::reason_priority,
    estimated_duration_hours = 24
WHERE category IS NULL;

-- Insert sample workflow for high-priority reasons (only if reasons exist)
INSERT INTO public.reason_workflows (reason_id, step_order, step_name, step_type, assigned_role, timeout_hours)
SELECT 
    r.id,
    1,
    'Approval Required',
    'approval',
    'manager'::granular_role,
    4
FROM public.reasons r
WHERE r.priority = 'high'::reason_priority
ON CONFLICT (reason_id, step_order) DO NOTHING;