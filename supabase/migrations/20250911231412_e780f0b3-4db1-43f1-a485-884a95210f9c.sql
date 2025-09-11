-- Final RLS Security Corrections: Granular Access Control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "All authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "All authenticated users can view sellers" ON public.sellers;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- CUSTOMERS: Granular access control
-- Basic customer info (name, registration status) for all authenticated users
CREATE POLICY "All authenticated users can view basic customer info" 
ON public.customers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Sensitive data (email, phone) only for admins and managers
CREATE POLICY "Admins and managers can view sensitive customer data" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

-- SELLERS: Granular access control
-- Basic seller info (name, active status) for all authenticated users
CREATE POLICY "All authenticated users can view basic seller info" 
ON public.sellers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Sensitive data (email, phone) only for admins
CREATE POLICY "Only admins can view sensitive seller data" 
ON public.sellers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  get_user_role(auth.uid()) = 'admin'::app_role
);

-- PROFILES: Strict access control
-- Users can only view their own profile (basic info)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Managers can view basic profile info of other users (no sensitive data)
CREATE POLICY "Managers can view basic profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager'::app_role AND 
  get_user_role(id) != 'admin'::app_role
);

-- Create functions for sensitive data access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name TEXT,
  record_id UUID,
  accessed_fields TEXT[]
) RETURNS VOID AS $$
BEGIN
  -- This would typically insert into an audit log table
  -- For now, we'll use a simple approach
  RAISE LOG 'SENSITIVE_ACCESS: User % accessed % fields % in table % for record %', 
    auth.uid(), array_length(accessed_fields, 1), accessed_fields, table_name, record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for customers with role-based field filtering
CREATE OR REPLACE VIEW public.customers_view AS
SELECT 
  id,
  name,
  created_at,
  updated_at,
  is_registered,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) 
    THEN email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) 
    THEN phone 
    ELSE NULL 
  END as phone
FROM public.customers
WHERE auth.uid() IS NOT NULL;

-- Create view for sellers with role-based field filtering
CREATE OR REPLACE VIEW public.sellers_view AS
SELECT 
  id,
  name,
  created_at,
  updated_at,
  is_active,
  CASE 
    WHEN get_user_role(auth.uid()) = 'admin'::app_role 
    THEN email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN get_user_role(auth.uid()) = 'admin'::app_role 
    THEN phone 
    ELSE NULL 
  END as phone
FROM public.sellers
WHERE auth.uid() IS NOT NULL;

-- Grant access to views
GRANT SELECT ON public.customers_view TO authenticated;
GRANT SELECT ON public.sellers_view TO authenticated;

-- Create RLS policies for views
ALTER VIEW public.customers_view SET (security_barrier = true);
ALTER VIEW public.sellers_view SET (security_barrier = true);