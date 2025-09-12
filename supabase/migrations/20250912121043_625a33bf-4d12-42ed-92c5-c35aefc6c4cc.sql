-- Corrigir as funções restantes com search_path mutável
-- Fixar função get_seller_safe
CREATE OR REPLACE FUNCTION public.get_seller_safe(seller_id uuid)
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

-- Fixar função get_system_stats
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.secure_get_system_stats();
$$;

-- Fixar função get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
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

-- Fixar função get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Fixar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user'::app_role
  );
  RETURN new;
END;
$$;