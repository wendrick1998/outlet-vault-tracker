-- Phase F3: Structured Reasons System (simplified without IF NOT EXISTS)

-- Create reason categories enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reason_category') THEN
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
    END IF;
END $$;

-- Create reason priority enum  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reason_priority') THEN
        CREATE TYPE public.reason_priority AS ENUM (
            'low',
            'medium', 
            'high',
            'urgent'
        );
    END IF;
END $$;

-- Enhance reasons table with structured data
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS category reason_category;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS priority reason_priority DEFAULT 'medium';
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS max_duration_hours INTEGER;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS notification_template TEXT;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS workflow_config JSONB;

-- Create reason workflows table (no updated_at to avoid trigger issues)
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

-- Create RLS Policies (with unique names to avoid conflicts)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "reason_workflows_admin_manage" ON public.reason_workflows;
    DROP POLICY IF EXISTS "reason_workflows_view" ON public.reason_workflows;
    DROP POLICY IF EXISTS "sla_tracking_view" ON public.sla_tracking;
    DROP POLICY IF EXISTS "sla_tracking_manage" ON public.sla_tracking;
    DROP POLICY IF EXISTS "movement_approvals_view" ON public.movement_approvals;
    DROP POLICY IF EXISTS "movement_approvals_manage" ON public.movement_approvals;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "reason_workflows_admin_manage"
    ON public.reason_workflows FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "reason_workflows_view"
    ON public.reason_workflows FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "sla_tracking_view"
    ON public.sla_tracking FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "sla_tracking_manage"
    ON public.sla_tracking FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "movement_approvals_view"
    ON public.movement_approvals FOR SELECT
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND (
            approved_by = auth.uid() OR
            user_has_permission(auth.uid(), 'movements.approve'::permission) OR
            get_user_role(auth.uid()) = 'admin'::app_role
        )
    );

CREATE POLICY "movement_approvals_manage"
    ON public.movement_approvals FOR ALL
    TO authenticated
    USING (
        user_has_permission(auth.uid(), 'movements.approve'::permission) OR
        get_user_role(auth.uid()) = 'admin'::app_role
    );

-- Insert default reason categories and workflows
UPDATE public.reasons 
SET category = 'loan'::reason_category, 
    priority = 'medium'::reason_priority,
    estimated_duration_hours = 24
WHERE category IS NULL;