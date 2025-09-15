-- Create enhanced RLS policies for customers table with stricter access control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Regular users can view customer names only" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers can view sensitive customer data" ON public.customers;

-- Create new restrictive policies

-- Only allow admins and managers to see full customer data
CREATE POLICY "Admins and managers full access to customers" 
ON public.customers 
FOR ALL
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

-- Regular users can only see limited customer data (name and registration status)
CREATE POLICY "Regular users limited customer access" 
ON public.customers 
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role)
);

-- Create function to safely get customer data with field-level access control
CREATE OR REPLACE FUNCTION public.get_masked_customer_data(customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  user_role app_role;
  customer_data customers%ROWTYPE;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Get customer data
  SELECT * INTO customer_data FROM public.customers WHERE id = customer_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Return data based on role
  IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
    -- Full access for admins and managers
    result := jsonb_build_object(
      'id', customer_data.id,
      'name', customer_data.name,
      'email', customer_data.email,
      'phone', customer_data.phone,
      'cpf', customer_data.cpf,
      'address', customer_data.address,
      'notes', customer_data.notes,
      'is_registered', customer_data.is_registered,
      'loan_limit', customer_data.loan_limit,
      'created_at', customer_data.created_at,
      'updated_at', customer_data.updated_at
    );
    
    -- Log sensitive data access
    PERFORM log_audit_event(
      'sensitive_customer_data_access',
      jsonb_build_object(
        'customer_id', customer_id,
        'fields_accessed', ARRAY['email', 'phone', 'cpf', 'address', 'notes'],
        'user_role', user_role
      )
    );
  ELSE
    -- Limited access for regular users - only name and registration status
    result := jsonb_build_object(
      'id', customer_data.id,
      'name', customer_data.name,
      'is_registered', customer_data.is_registered,
      'created_at', customer_data.created_at
    );
    
    -- Log limited data access
    PERFORM log_audit_event(
      'limited_customer_data_access',
      jsonb_build_object(
        'customer_id', customer_id,
        'fields_accessed', ARRAY['name', 'is_registered'],
        'user_role', user_role
      )
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create trigger to log all customer data modifications
CREATE OR REPLACE FUNCTION public.audit_customer_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all customer data changes
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'customer_created',
      jsonb_build_object(
        'customer_id', NEW.id,
        'customer_name', NEW.name,
        'has_sensitive_data', (NEW.email IS NOT NULL OR NEW.phone IS NOT NULL OR NEW.cpf IS NOT NULL)
      ),
      'customers',
      NEW.id
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'customer_updated',
      jsonb_build_object(
        'customer_id', NEW.id,
        'customer_name', NEW.name,
        'changed_fields', jsonb_build_object(
          'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
          'phone_changed', (OLD.phone IS DISTINCT FROM NEW.phone),
          'cpf_changed', (OLD.cpf IS DISTINCT FROM NEW.cpf),
          'address_changed', (OLD.address IS DISTINCT FROM NEW.address)
        )
      ),
      'customers',
      NEW.id
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'customer_deleted',
      jsonb_build_object(
        'customer_id', OLD.id,
        'customer_name', OLD.name,
        'had_sensitive_data', (OLD.email IS NOT NULL OR OLD.phone IS NOT NULL OR OLD.cpf IS NOT NULL)
      ),
      'customers',
      OLD.id
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for customer audit logging
DROP TRIGGER IF EXISTS audit_customer_changes_trigger ON public.customers;
CREATE TRIGGER audit_customer_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.audit_customer_changes();