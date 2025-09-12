-- Create inventory audit tables for physical inventory conference system

-- Main audit sessions table
CREATE TABLE public.inventory_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  filters JSONB DEFAULT '{}',
  snapshot_count INTEGER NOT NULL DEFAULT 0,
  found_count INTEGER NOT NULL DEFAULT 0,
  missing_count INTEGER NOT NULL DEFAULT 0,
  unexpected_count INTEGER NOT NULL DEFAULT 0,
  incongruent_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual scans during audit
CREATE TABLE public.inventory_audit_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  raw_code TEXT NOT NULL,
  imei TEXT,
  serial TEXT,
  item_id UUID REFERENCES public.inventory(id),
  scan_result TEXT NOT NULL CHECK (scan_result IN ('found_expected', 'unexpected_present', 'duplicate', 'status_incongruent')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Missing items (expected but not found)
CREATE TABLE public.inventory_audit_missing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory(id),
  reason TEXT DEFAULT 'not_scanned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pending tasks for regularization
CREATE TABLE public.inventory_audit_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory(id),
  imei TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('unexpected_present', 'missing_item', 'status_incongruent', 'duplicate_scan')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID,
  description TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_missing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_audits
CREATE POLICY "Authenticated users can view audits" 
ON public.inventory_audits FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create audits" 
ON public.inventory_audits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Audit creator can update" 
ON public.inventory_audits FOR UPDATE 
USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins and managers can manage all audits" 
ON public.inventory_audits FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- RLS Policies for inventory_audit_scans
CREATE POLICY "Users can view scans from their audits" 
ON public.inventory_audit_scans FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = audit_id 
    AND (ia.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
  )
);

CREATE POLICY "Users can insert scans to their audits" 
ON public.inventory_audit_scans FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = audit_id 
    AND (ia.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
  )
);

-- RLS Policies for inventory_audit_missing
CREATE POLICY "Users can view missing items from their audits" 
ON public.inventory_audit_missing FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = audit_id 
    AND (ia.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
  )
);

CREATE POLICY "Users can insert missing items to their audits" 
ON public.inventory_audit_missing FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = audit_id 
    AND (ia.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
  )
);

-- RLS Policies for inventory_audit_tasks
CREATE POLICY "Authenticated users can view tasks" 
ON public.inventory_audit_tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create tasks from their audits" 
ON public.inventory_audit_tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = audit_id 
    AND (ia.user_id = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
  )
);

CREATE POLICY "Admins and managers can manage all tasks" 
ON public.inventory_audit_tasks FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Add indexes for performance
CREATE INDEX idx_inventory_audits_user_id ON public.inventory_audits(user_id);
CREATE INDEX idx_inventory_audits_status ON public.inventory_audits(status);
CREATE INDEX idx_inventory_audit_scans_audit_id ON public.inventory_audit_scans(audit_id);
CREATE INDEX idx_inventory_audit_scans_imei ON public.inventory_audit_scans(imei);
CREATE INDEX idx_inventory_audit_missing_audit_id ON public.inventory_audit_missing(audit_id);
CREATE INDEX idx_inventory_audit_tasks_audit_id ON public.inventory_audit_tasks(audit_id);
CREATE INDEX idx_inventory_audit_tasks_status ON public.inventory_audit_tasks(status);

-- Add triggers for updated_at
CREATE TRIGGER update_inventory_audits_updated_at
  BEFORE UPDATE ON public.inventory_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_audit_tasks_updated_at
  BEFORE UPDATE ON public.inventory_audit_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate IMEI using Luhn algorithm
CREATE OR REPLACE FUNCTION public.validate_imei(imei_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cleaned_imei TEXT;
    digit_sum INTEGER := 0;
    digit_value INTEGER;
    i INTEGER;
BEGIN
    -- Clean and validate input
    cleaned_imei := regexp_replace(imei_code, '[^0-9]', '', 'g');
    
    IF length(cleaned_imei) NOT IN (14, 15) THEN
        RETURN FALSE;
    END IF;
    
    -- Luhn algorithm validation
    FOR i IN 1..length(cleaned_imei) LOOP
        digit_value := substr(cleaned_imei, length(cleaned_imei) - i + 1, 1)::INTEGER;
        
        IF i % 2 = 0 THEN
            digit_value := digit_value * 2;
            IF digit_value > 9 THEN
                digit_value := digit_value - 9;
            END IF;
        END IF;
        
        digit_sum := digit_sum + digit_value;
    END LOOP;
    
    RETURN digit_sum % 10 = 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;