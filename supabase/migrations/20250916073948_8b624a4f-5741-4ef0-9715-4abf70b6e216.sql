-- Remove the insecure policy that allows regular users to access sensitive customer data
DROP POLICY IF EXISTS "Regular users limited customer access" ON public.customers;

-- Create a secure view that automatically masks customer data based on user role
CREATE OR REPLACE VIEW public.customers_secure AS
SELECT 
  id,
  name,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN cpf
    ELSE NULL
  END as cpf,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN address
    ELSE NULL
  END as address,
  CASE 
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN notes
    ELSE NULL
  END as notes,
  is_registered,
  loan_limit,
  created_at,
  updated_at,
  pending_data
FROM public.customers;

-- Enable RLS on the secure view
ALTER VIEW public.customers_secure ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view the secure view (data is already masked by role)
CREATE POLICY "Authenticated users can view secure customer data" 
ON public.customers_secure 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create a secure function for getting customer data with proper role-based access
CREATE OR REPLACE FUNCTION public.get_customers_secure()
RETURNS SETOF public.customers_secure
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.customers_secure ORDER BY name ASC;
$$;