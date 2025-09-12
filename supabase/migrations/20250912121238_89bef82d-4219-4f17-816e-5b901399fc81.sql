-- Finalizar correção de TODAS as funções restantes com search_path mutável
-- Fixar função migrate_existing_roles
CREATE OR REPLACE FUNCTION public.migrate_existing_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Map existing admin users
    INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
    SELECT id, 'admin'::granular_role, id, 'Migrated from existing role system'
    FROM public.profiles 
    WHERE role = 'admin'::app_role
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Map existing manager users  
    INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
    SELECT id, 'manager'::granular_role, id, 'Migrated from existing role system'
    FROM public.profiles
    WHERE role = 'manager'::app_role
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Map existing regular users to operator role
    INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
    SELECT id, 'operator'::granular_role, id, 'Migrated from existing role system'
    FROM public.profiles
    WHERE role = 'user'::app_role
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Fixar função secure_get_system_stats
CREATE OR REPLACE FUNCTION public.secure_get_system_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'total_items', (SELECT COUNT(*) FROM public.inventory),
    'active_loans', (SELECT COUNT(*) FROM public.loans WHERE status = 'active'),
    'total_customers', (SELECT COUNT(*) FROM public.customers),
    'total_sellers', (SELECT COUNT(*) FROM public.sellers),
    'last_updated', NOW()
  );
$$;

-- Fixar função update_inventory_status_on_loan_change
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_loan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- If loan is being created as active
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.inventory SET status = 'loaned' WHERE id = NEW.item_id;
    END IF;
    
    -- If loan status is being changed to returned
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = NEW.item_id;
        NEW.returned_at = now();
    END IF;
    
    -- If loan is being deleted (return item to available)
    IF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fixar função user_has_permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id uuid, required_permission permission)
RETURNS boolean
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

-- Fixar função validate_password_security
CREATE OR REPLACE FUNCTION public.validate_password_security(password_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb := '{"valid": true, "errors": [], "score": 0}'::jsonb;
    errors text[] := ARRAY[]::text[];
    score integer := 0;
BEGIN
    -- Length validation (minimum 12 characters recommended)
    IF length(password_text) < 8 THEN
        errors := array_append(errors, 'Senha deve ter pelo menos 8 caracteres');
    ELSIF length(password_text) >= 12 THEN
        score := score + 2;
    ELSE
        score := score + 1;
    END IF;
    
    -- Character diversity checks
    IF password_text ~ '[a-z]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra minúscula');
    END IF;
    
    IF password_text ~ '[A-Z]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra maiúscula');
    END IF;
    
    IF password_text ~ '[0-9]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos um número');
    END IF;
    
    IF password_text ~ '[^A-Za-z0-9]' THEN
        score := score + 2;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos um caractere especial');
    END IF;
    
    -- Check for repeated characters (security issue)
    IF password_text ~ '(.)\1{2,}' THEN
        errors := array_append(errors, 'Evite sequências de caracteres repetidos');
        score := score - 1;
    END IF;
    
    -- Check for common patterns (basic validation)
    IF lower(password_text) ~ '(123|abc|qwe|password|admin|user)' THEN
        errors := array_append(errors, 'Evite padrões comuns ou palavras óbvias');
        score := score - 2;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL AND score >= 5,
        'errors', errors,
        'score', GREATEST(0, score),
        'strength', CASE 
            WHEN score >= 8 THEN 'muito_forte'
            WHEN score >= 6 THEN 'forte'
            WHEN score >= 4 THEN 'medio'
            ELSE 'fraco'
        END
    );
    
    RETURN result;
END;
$$;