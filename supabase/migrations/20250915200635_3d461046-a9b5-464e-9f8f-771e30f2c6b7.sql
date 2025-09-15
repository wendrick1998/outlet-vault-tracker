-- Fix search_path security issues in functions

-- Update all customer-related functions to have immutable search_path
ALTER FUNCTION public.get_customer_data_safe(uuid) SET search_path = public;
ALTER FUNCTION public.get_customer_safe(uuid) SET search_path = public;
ALTER FUNCTION public.get_masked_customer_data(uuid) SET search_path = public;
ALTER FUNCTION public.audit_customer_changes() SET search_path = public;

-- Update other functions that might have mutable search_path
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.log_audit_event(text, jsonb, text, uuid) SET search_path = public;
ALTER FUNCTION public.get_security_status() SET search_path = public;
ALTER FUNCTION public.set_operation_pin(uuid, text) SET search_path = public;
ALTER FUNCTION public.validate_operation_pin(uuid, text) SET search_path = public;
ALTER FUNCTION public.check_password_leaked_status(text) SET search_path = public;
ALTER FUNCTION public.validate_password_security(text) SET search_path = public;
ALTER FUNCTION public.check_account_security_status(text) SET search_path = public;

-- Create security-hardened function for customer data access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_customer_access(
  customer_id uuid,
  access_type text,
  fields_accessed text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_email text;
BEGIN
  -- Get current user info
  SELECT get_user_role(auth.uid()) INTO user_role;
  SELECT email FROM profiles WHERE id = auth.uid() INTO user_email;
  
  -- Log the sensitive access with enhanced details
  PERFORM log_audit_event(
    'sensitive_customer_data_access',
    jsonb_build_object(
      'customer_id', customer_id,
      'access_type', access_type,
      'fields_accessed', fields_accessed,
      'user_role', user_role,
      'user_email', user_email,
      'timestamp', now(),
      'ip_address', inet_client_addr(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    ),
    'customers',
    customer_id
  );
END;
$$;