-- Continuar corrigindo funções com search_path mutável
-- Fixar função cleanup_expired_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM public.active_sessions 
    WHERE expires_at < now() OR last_activity < now() - INTERVAL '24 hours';
END;
$$;

-- Fixar função current_user_has_permission
CREATE OR REPLACE FUNCTION public.current_user_has_permission(required_permission permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT public.user_has_permission(auth.uid(), $1);
$$;

-- Fixar função ensure_profile_exists
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fixar função get_customer_safe
CREATE OR REPLACE FUNCTION public.get_customer_safe(customer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSON;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT public.get_user_role(auth.uid()) INTO user_role;
  
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