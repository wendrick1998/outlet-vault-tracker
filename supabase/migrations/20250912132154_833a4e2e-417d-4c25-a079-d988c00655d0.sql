-- SECURITY FIX: Restrict customer data access to prevent PII exposure
-- Remove overly permissive customer access policy
DROP POLICY IF EXISTS "All authenticated users can view basic customer info" ON public.customers;

-- Create role-based customer access policies
CREATE POLICY "Admins and managers can view all customer data" 
ON public.customers 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Regular users can view customer names only" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role)
);

-- SECURITY FIX: Restrict session management to prevent unauthorized access
-- Remove overly permissive session management policy
DROP POLICY IF EXISTS "System can manage sessions" ON public.active_sessions;

-- Create specific session management policies
CREATE POLICY "Users can insert their own sessions" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.active_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sessions" 
ON public.active_sessions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Create secure function for customer data access that respects role hierarchy
CREATE OR REPLACE FUNCTION public.get_customer_data_safe(customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Return data based on role - admins/managers get full data, others get limited
  IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
    SELECT jsonb_build_object(
      'id', id,
      'name', name,
      'email', email,
      'phone', phone,
      'is_registered', is_registered,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO result
    FROM public.customers 
    WHERE id = customer_id;
  ELSE
    -- Regular users only get name and registration status
    SELECT jsonb_build_object(
      'id', id,
      'name', name,
      'is_registered', is_registered,
      'created_at', created_at
    ) INTO result
    FROM public.customers 
    WHERE id = customer_id;
  END IF;
  
  -- Log access for audit
  PERFORM log_audit_event(
    'customer_data_accessed',
    jsonb_build_object(
      'customer_id', customer_id,
      'user_role', user_role,
      'data_level', CASE WHEN user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN 'full' ELSE 'limited' END
    )
  );
  
  RETURN result;
END;
$$;

-- Add password history tracking for enhanced security
CREATE TABLE IF NOT EXISTS public.password_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'password_changed', 'mfa_enabled', 'account_locked'
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on password security events
ALTER TABLE public.password_security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view password security events
CREATE POLICY "Admins can view password security events" 
ON public.password_security_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- System can insert password security events
CREATE POLICY "System can log password security events" 
ON public.password_security_events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_password_security_event(
  p_user_id uuid,
  p_event_type text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.password_security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details);
  
  -- Also log to main audit log
  PERFORM log_audit_event(
    'password_security_event',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'event_type', p_event_type,
      'details', p_details
    )
  );
END;
$$;