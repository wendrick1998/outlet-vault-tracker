-- Fix Security Linter Issues: Remove Security Definer Views and Fix Function

-- Drop the problematic security definer views
DROP VIEW IF EXISTS public.customers_view;
DROP VIEW IF EXISTS public.sellers_view;

-- Fix the function search path
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name TEXT,
  record_id UUID,
  accessed_fields TEXT[]
) RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This would typically insert into an audit log table
  -- For now, we'll use a simple approach
  RAISE LOG 'SENSITIVE_ACCESS: User % accessed % fields % in table % for record %', 
    auth.uid(), array_length(accessed_fields, 1), accessed_fields, table_name, record_id;
END;
$$;

-- Instead of security definer views, create functions that handle role-based filtering
CREATE OR REPLACE FUNCTION public.get_customer_safe(customer_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Return data based on role
  IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
    SELECT json_build_object(
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
    SELECT json_build_object(
      'id', id,
      'name', name,
      'email', NULL,
      'phone', NULL,
      'is_registered', is_registered,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO result
    FROM public.customers 
    WHERE id = customer_id;
  END IF;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seller_safe(seller_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Return data based on role
  IF user_role = 'admin'::app_role THEN
    SELECT json_build_object(
      'id', id,
      'name', name,
      'email', email,
      'phone', phone,
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO result
    FROM public.sellers 
    WHERE id = seller_id;
  ELSE
    SELECT json_build_object(
      'id', id,
      'name', name,
      'email', NULL,
      'phone', NULL,
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO result
    FROM public.sellers 
    WHERE id = seller_id;
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permissions on the safe functions
GRANT EXECUTE ON FUNCTION public.get_customer_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_safe(UUID) TO authenticated;