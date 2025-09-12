-- Corrigir o trigger de auditoria que está causando problemas
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Usar to_jsonb em vez de row_to_json para evitar problemas com operador JSON
        PERFORM log_audit_event(
            'profile_updated',
            jsonb_build_object(
                'user_id', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'updated_fields', jsonb_build_object(
                    'role_changed', (OLD.role IS DISTINCT FROM NEW.role),
                    'is_active_changed', (OLD.is_active IS DISTINCT FROM NEW.is_active)
                )
            ),
            'profiles',
            NEW.id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;