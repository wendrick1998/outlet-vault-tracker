-- Corrigir o search path da função de auditoria para resolver o warning de segurança
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.log_audit_event(
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

-- Agora atualizar o usuário wendrick.1761998@gmail.com para administrador
-- User ID: fdbdee69-46c2-4e99-af8c-be74670d3cb2

-- 1. Atualizar a tabela profiles para role admin
UPDATE public.profiles 
SET 
  role = 'admin'::app_role,
  is_active = true
WHERE email = 'wendrick.1761998@gmail.com';

-- 2. Desativar a atribuição atual de operator em user_role_assignments
UPDATE public.user_role_assignments 
SET 
  is_active = false
WHERE user_id = 'fdbdee69-46c2-4e99-af8c-be74670d3cb2'
  AND role = 'operator'::granular_role;

-- 3. Adicionar nova atribuição de admin em user_role_assignments
INSERT INTO public.user_role_assignments (
  user_id, 
  role, 
  assigned_by, 
  notes,
  is_active
) VALUES (
  'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  'admin'::granular_role,
  'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  'Upgraded to admin via SQL migration',
  true
) ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  assigned_by = 'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  notes = 'Upgraded to admin via SQL migration';