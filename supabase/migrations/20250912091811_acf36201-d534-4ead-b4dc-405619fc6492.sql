-- Create security function with immutable search_path
CREATE OR REPLACE FUNCTION public.secure_get_system_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_items', (SELECT COUNT(*) FROM inventory),
    'active_loans', (SELECT COUNT(*) FROM loans WHERE status = 'active'),
    'total_customers', (SELECT COUNT(*) FROM customers),
    'total_sellers', (SELECT COUNT(*) FROM sellers),
    'last_updated', NOW()
  );
$$;

-- Update existing function to use secure search path
DROP FUNCTION IF EXISTS public.get_system_stats();

-- Create alias for backward compatibility
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.secure_get_system_stats();
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.secure_get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;