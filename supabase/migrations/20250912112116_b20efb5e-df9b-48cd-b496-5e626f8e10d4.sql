-- Phase F2: Enhanced Granular Permissions System

-- Create new granular app roles enum
CREATE TYPE public.granular_role AS ENUM (
    'admin',           -- Full system access
    'manager',         -- Department/regional management
    'supervisor',      -- Team supervision
    'operator',        -- Standard operations
    'auditor',         -- Read-only audit access
    'viewer'          -- View-only access
);

-- Create permissions enum for granular control
CREATE TYPE public.permission AS ENUM (
    -- Inventory permissions
    'inventory.view',
    'inventory.create', 
    'inventory.update',
    'inventory.delete',
    'inventory.bulk_operations',
    
    -- Movement permissions
    'movements.view',
    'movements.create',
    'movements.approve',
    'movements.cancel',
    
    -- User management permissions
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.manage_roles',
    
    -- Audit permissions
    'audit.view',
    'audit.export',
    
    -- System permissions
    'system.config',
    'system.backup',
    'system.features'
);

-- Create role permissions mapping table
CREATE TABLE public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role granular_role NOT NULL,
    permission permission NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(role, permission)
);

-- Create user role assignments table (for multiple roles per user)
CREATE TABLE public.user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role granular_role NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_permissions
CREATE POLICY "Admins can manage role permissions"
    ON public.role_permissions FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::app_role)
    WITH CHECK (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "All authenticated users can view role permissions"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_role_assignments  
CREATE POLICY "Admins can manage all role assignments"
    ON public.user_role_assignments FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "Users can view their own role assignments"
    ON public.user_role_assignments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Managers can view non-admin role assignments"
    ON public.user_role_assignments FOR SELECT  
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'manager'::app_role 
        AND role != 'admin'::granular_role
    );

-- Create updated_at trigger for user_role_assignments
CREATE TRIGGER update_user_role_assignments_updated_at
    BEFORE UPDATE ON public.user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
    -- Admin permissions (all)
    ('admin', 'inventory.view'),
    ('admin', 'inventory.create'),
    ('admin', 'inventory.update'), 
    ('admin', 'inventory.delete'),
    ('admin', 'inventory.bulk_operations'),
    ('admin', 'movements.view'),
    ('admin', 'movements.create'),
    ('admin', 'movements.approve'),
    ('admin', 'movements.cancel'),
    ('admin', 'users.view'),
    ('admin', 'users.create'),
    ('admin', 'users.update'),
    ('admin', 'users.delete'), 
    ('admin', 'users.manage_roles'),
    ('admin', 'audit.view'),
    ('admin', 'audit.export'),
    ('admin', 'system.config'),
    ('admin', 'system.backup'),
    ('admin', 'system.features'),
    
    -- Manager permissions
    ('manager', 'inventory.view'),
    ('manager', 'inventory.create'),
    ('manager', 'inventory.update'),
    ('manager', 'inventory.bulk_operations'),
    ('manager', 'movements.view'),
    ('manager', 'movements.create'),
    ('manager', 'movements.approve'),
    ('manager', 'users.view'),
    ('manager', 'audit.view'),
    
    -- Supervisor permissions  
    ('supervisor', 'inventory.view'),
    ('supervisor', 'inventory.update'),
    ('supervisor', 'movements.view'),
    ('supervisor', 'movements.create'),
    ('supervisor', 'users.view'),
    
    -- Operator permissions
    ('operator', 'inventory.view'),
    ('operator', 'movements.view'),
    ('operator', 'movements.create'),
    
    -- Auditor permissions (read-only)
    ('auditor', 'inventory.view'),
    ('auditor', 'movements.view'), 
    ('auditor', 'users.view'),
    ('auditor', 'audit.view'),
    ('auditor', 'audit.export'),
    
    -- Viewer permissions (minimal read-only)
    ('viewer', 'inventory.view'),
    ('viewer', 'movements.view');

-- Create enhanced permission checking functions
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id UUID,
    required_permission permission
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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
SET search_path = public
AS $$
    SELECT public.user_has_permission(auth.uid(), $1);
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS permission[]
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $$
    SELECT ARRAY_AGG(DISTINCT rp.permission)
    FROM public.user_role_assignments ura
    JOIN public.role_permissions rp ON ura.role = rp.role
    WHERE ura.user_id = $1
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now());
$$;

-- Migration function to map existing roles to new system
CREATE OR REPLACE FUNCTION public.migrate_existing_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Execute migration
SELECT public.migrate_existing_roles();