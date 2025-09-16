-- Remove the insecure policy that allows regular users to access sensitive customer data
DROP POLICY IF EXISTS "Regular users limited customer access" ON public.customers;

-- Create a secure function for getting all customers with role-based data masking
CREATE OR REPLACE FUNCTION public.get_customers_secure()
RETURNS jsonb[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  result jsonb[] := ARRAY[]::jsonb[];
  customer_record customers%ROWTYPE;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Loop through all customers and build secure result
  FOR customer_record IN 
    SELECT * FROM public.customers ORDER BY name ASC
  LOOP
    IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
      -- Full access for admins and managers
      result := result || jsonb_build_object(
        'id', customer_record.id,
        'name', customer_record.name,
        'email', customer_record.email,
        'phone', customer_record.phone,
        'cpf', customer_record.cpf,
        'address', customer_record.address,
        'notes', customer_record.notes,
        'is_registered', customer_record.is_registered,
        'loan_limit', customer_record.loan_limit,
        'created_at', customer_record.created_at,
        'updated_at', customer_record.updated_at,
        'pending_data', customer_record.pending_data
      );
    ELSE
      -- Limited access for regular users - only name and registration status
      result := result || jsonb_build_object(
        'id', customer_record.id,
        'name', customer_record.name,
        'email', null,
        'phone', null,
        'cpf', null,
        'address', null,
        'notes', null,
        'is_registered', customer_record.is_registered,
        'loan_limit', customer_record.loan_limit,
        'created_at', customer_record.created_at,
        'updated_at', customer_record.updated_at,
        'pending_data', null
      );
    END IF;
  END LOOP;
  
  -- Log access for audit
  PERFORM log_audit_event(
    'customers_list_accessed',
    jsonb_build_object(
      'user_role', user_role,
      'total_customers', array_length(result, 1),
      'data_level', CASE WHEN user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN 'full' ELSE 'limited' END
    )
  );
  
  RETURN result;
END;
$$;