-- Fix security warning: Function search_path mutable
-- Update functions to have proper search_path settings

CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id UUID,
    required_permission permission
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_role_assignments ura
        JOIN public.role_permissions rp ON ura.role = rp.role
        WHERE ura.user_id = $1
        AND rp.permission = $2
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(
    required_permission permission
) RETURNS boolean  
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT public.user_has_permission(auth.uid(), $1);
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS permission[]
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $$
    SELECT ARRAY_AGG(DISTINCT rp.permission)
    FROM public.user_role_assignments ura
    JOIN public.role_permissions rp ON ura.role = rp.role
    WHERE ura.user_id = $1
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now());
$$;