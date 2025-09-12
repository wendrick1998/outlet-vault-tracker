-- Fix permission system: ensure admins always have access and sync app_role with granular roles

-- 1. Add admin permissions if they don't exist
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'movements.create'),
  ('admin', 'movements.view'), 
  ('admin', 'inventory.view'),
  ('admin', 'inventory.create'),
  ('admin', 'inventory.update'),
  ('admin', 'inventory.delete'),
  ('admin', 'inventory.bulk_operations'),
  ('admin', 'users.view'),
  ('admin', 'users.create'),
  ('admin', 'users.manage_roles'),
  ('admin', 'system.config'),
  ('admin', 'system.features'),
  ('admin', 'audit.view')
ON CONFLICT (role, permission) DO NOTHING;

-- 2. Ensure all active admin profiles have granular admin role assignment
INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
SELECT 
  p.id,
  'admin'::granular_role,
  p.id,
  'Sincronização automática: perfil admin'
FROM public.profiles p
WHERE p.role = 'admin'::app_role 
  AND p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role = 'admin'::granular_role AND ura.is_active = true
  );

-- 3. Ensure all active manager profiles have granular manager role assignment  
INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
SELECT 
  p.id,
  'manager'::granular_role,
  p.id,
  'Sincronização automática: perfil manager'
FROM public.profiles p
WHERE p.role = 'manager'::app_role 
  AND p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role = 'manager'::granular_role AND ura.is_active = true
  );

-- 4. Update the permission check function to always allow admins
CREATE OR REPLACE FUNCTION public.current_user_has_permission(required_permission permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    -- Admins always have all permissions
    SELECT CASE 
        WHEN public.get_user_role(auth.uid()) = 'admin'::app_role THEN true
        ELSE public.user_has_permission(auth.uid(), $1)
    END;
$function$;

-- 5. Create function to sync app_role changes with granular roles
CREATE OR REPLACE FUNCTION public.sync_app_role_to_granular()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    target_granular_role granular_role;
BEGIN
    -- Map app_role to granular_role
    target_granular_role := CASE NEW.role
        WHEN 'admin'::app_role THEN 'admin'::granular_role
        WHEN 'manager'::app_role THEN 'manager'::granular_role  
        WHEN 'user'::app_role THEN 'operator'::granular_role
        ELSE NULL
    END;
    
    -- Only sync if user is active and we have a target role
    IF NEW.is_active = true AND target_granular_role IS NOT NULL THEN
        -- Deactivate any existing role assignments
        UPDATE public.user_role_assignments 
        SET is_active = false, updated_at = now()
        WHERE user_id = NEW.id AND is_active = true;
        
        -- Insert new role assignment
        INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
        VALUES (
            NEW.id, 
            target_granular_role, 
            COALESCE(auth.uid(), NEW.id),
            'Sincronização automática de app_role: ' || NEW.role::text
        )
        ON CONFLICT (user_id, role) DO UPDATE SET
            is_active = true,
            updated_at = now(),
            assigned_by = COALESCE(auth.uid(), NEW.id),
            notes = 'Reativado por sincronização: ' || NEW.role::text;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 6. Create trigger to automatically sync role changes
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.profiles;
CREATE TRIGGER sync_profile_role_trigger
    AFTER INSERT OR UPDATE OF role, is_active ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_app_role_to_granular();

-- 7. Log the migration
INSERT INTO public.audit_logs (user_id, action, details)
VALUES (
    NULL,
    'permission_system_fix',
    jsonb_build_object(
        'admin_users_synced', (
            SELECT COUNT(*) FROM public.profiles 
            WHERE role = 'admin'::app_role AND is_active = true
        ),
        'manager_users_synced', (
            SELECT COUNT(*) FROM public.profiles 
            WHERE role = 'manager'::app_role AND is_active = true
        ),
        'timestamp', now(),
        'description', 'Fixed permission system to ensure admins always have access'
    )
);