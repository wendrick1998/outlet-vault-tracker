-- Fix function search path for security
DROP FUNCTION IF EXISTS public.ensure_profile_exists(UUID);

CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    SELECT 
        user_id,
        COALESCE(auth.email(), 'unknown@example.com'),
        COALESCE(auth.email(), 'User'),
        'user'::app_role
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id
    );
END;
$$;