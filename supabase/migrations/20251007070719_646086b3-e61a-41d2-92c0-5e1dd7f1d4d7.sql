-- ============================================
-- FASE 1: CORREÇÃO CRÍTICA - SISTEMA DE ROLES
-- Mantendo assinaturas originais
-- ============================================

-- PASSO 1: Popular user_role_assignments com dados existentes de profiles
SELECT public.migrate_existing_roles();

-- PASSO 2: Atualizar get_user_role() mantendo nome do parâmetro
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_granular_roles granular_role[];
BEGIN
  -- Buscar todos os roles granulares ativos
  SELECT ARRAY_AGG(ura.role) INTO v_granular_roles
  FROM public.user_role_assignments ura
  WHERE ura.user_id = get_user_role.user_id
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now());
  
  -- Mapear granular_roles para app_role (hierarquia)
  IF 'admin'::granular_role = ANY(v_granular_roles) THEN
    v_role := 'admin'::app_role;
  ELSIF 'manager'::granular_role = ANY(v_granular_roles) THEN
    v_role := 'manager'::app_role;
  ELSIF 'operator'::granular_role = ANY(v_granular_roles) OR 'auditor'::granular_role = ANY(v_granular_roles) THEN
    v_role := 'user'::app_role;
  ELSIF 'viewer'::granular_role = ANY(v_granular_roles) THEN
    v_role := 'user'::app_role;
  END IF;
  
  -- Se não encontrou role assignment, usar profile.role como fallback
  IF v_role IS NULL THEN
    SELECT p.role INTO v_role
    FROM public.profiles p
    WHERE p.id = get_user_role.user_id;
  END IF;
  
  -- Default para 'user' se ainda não encontrou
  RETURN COALESCE(v_role, 'user'::app_role);
END;
$$;

-- PASSO 3: Criar trigger para sincronizar user_role_assignments → profiles.role
CREATE OR REPLACE FUNCTION public.sync_role_assignments_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_highest_role app_role;
  v_granular_roles granular_role[];
BEGIN
  -- Buscar todos os roles granulares ativos
  SELECT ARRAY_AGG(ura.role) INTO v_granular_roles
  FROM public.user_role_assignments ura
  WHERE ura.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now());
  
  -- Mapear para app_role
  IF 'admin'::granular_role = ANY(v_granular_roles) THEN
    v_highest_role := 'admin'::app_role;
  ELSIF 'manager'::granular_role = ANY(v_granular_roles) THEN
    v_highest_role := 'manager'::app_role;
  ELSE
    v_highest_role := 'user'::app_role;
  END IF;
  
  -- Atualizar profiles.role (cache)
  UPDATE public.profiles
  SET 
    role = COALESCE(v_highest_role, 'user'::app_role),
    updated_at = now()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS sync_role_to_profile ON public.user_role_assignments;
CREATE TRIGGER sync_role_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_assignments_to_profile();

-- PASSO 4: Atualizar is_admin() mantendo assinatura
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário tem role 'admin' em user_role_assignments
  RETURN EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    WHERE ura.user_id = is_admin.user_id
      AND ura.role = 'admin'::granular_role
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
END;
$$;

-- PASSO 5: Log da migração
SELECT public.log_audit_event(
  'role_system_migration_completed',
  jsonb_build_object(
    'migration_type', 'unified_role_system',
    'migrated_users', (SELECT COUNT(*) FROM public.user_role_assignments),
    'timestamp', now()
  )
);

-- VERIFICAÇÃO: Confirmar dados migrados
SELECT 
  'Total Assignments' as metric,
  COUNT(*)::text as value
FROM public.user_role_assignments
WHERE is_active = true
UNION ALL
SELECT 
  'Unique Users',
  COUNT(DISTINCT user_id)::text
FROM public.user_role_assignments
WHERE is_active = true
UNION ALL
SELECT 
  'Admin Roles',
  COUNT(*)::text
FROM public.user_role_assignments
WHERE is_active = true AND role = 'admin'
UNION ALL
SELECT 
  'Manager Roles',
  COUNT(*)::text
FROM public.user_role_assignments
WHERE is_active = true AND role = 'manager';