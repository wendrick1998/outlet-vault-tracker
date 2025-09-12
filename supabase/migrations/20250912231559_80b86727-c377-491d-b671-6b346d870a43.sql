-- Fase 4: Correções Finais de Segurança

-- 1. Corrigir search_path em todas as funções que ainda não têm
CREATE OR REPLACE FUNCTION public.get_seller_safe(seller_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 2. Trigger para validação de dados de conferência
CREATE OR REPLACE FUNCTION public.validate_inventory_audit_scan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar que ao menos um dos códigos está presente
  IF NEW.imei IS NULL AND NEW.serial IS NULL THEN
    RAISE EXCEPTION 'Scan deve conter pelo menos um código (IMEI ou Serial)';
  END IF;
  
  -- Validar formato do IMEI se presente
  IF NEW.imei IS NOT NULL AND NOT public.validate_imei(NEW.imei) THEN
    RAISE EXCEPTION 'IMEI inválido: %', NEW.imei;
  END IF;
  
  -- Validar resultado do scan
  IF NEW.scan_result NOT IN ('found_expected', 'unexpected_present', 'duplicate', 'status_incongruent', 'not_found') THEN
    RAISE EXCEPTION 'Resultado de scan inválido: %', NEW.scan_result;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS validate_audit_scan_trigger ON public.inventory_audit_scans;
CREATE TRIGGER validate_audit_scan_trigger
BEFORE INSERT OR UPDATE ON public.inventory_audit_scans
FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_audit_scan();

-- 3. Função para métricas de performance da conferência
CREATE OR REPLACE FUNCTION public.get_audit_performance_metrics(audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  metrics jsonb;
  audit_duration interval;
  avg_scan_time numeric;
  efficiency_score numeric;
BEGIN
  SELECT 
    CASE 
      WHEN finished_at IS NOT NULL THEN finished_at - started_at
      ELSE NOW() - started_at
    END,
    CASE 
      WHEN snapshot_count > 0 THEN ROUND((found_count::numeric / snapshot_count::numeric) * 100, 2)
      ELSE 0
    END
  INTO audit_duration, efficiency_score
  FROM public.inventory_audits 
  WHERE id = audit_id;
  
  -- Calcular tempo médio entre scans
  SELECT 
    CASE 
      WHEN COUNT(*) > 1 THEN 
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / (COUNT(*) - 1)
      ELSE 0
    END
  INTO avg_scan_time
  FROM public.inventory_audit_scans 
  WHERE audit_id = audit_id;
  
  metrics := jsonb_build_object(
    'duration_minutes', EXTRACT(EPOCH FROM audit_duration) / 60,
    'efficiency_score', efficiency_score,
    'avg_scan_interval_seconds', COALESCE(avg_scan_time, 0),
    'scan_rate_per_minute', 
      CASE 
        WHEN audit_duration > INTERVAL '0' THEN 
          (SELECT COUNT(*) FROM public.inventory_audit_scans WHERE audit_id = audit_id) * 60.0 / EXTRACT(EPOCH FROM audit_duration)
        ELSE 0
      END
  );
  
  RETURN metrics;
END;
$function$;

-- 4. Mover extensão pg_trgm para schema extensions (mais seguro)
DROP EXTENSION IF EXISTS pg_trgm;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- 5. Adicionar políticas RLS mais específicas para maior segurança
-- Política mais restritiva para inventory_audits
DROP POLICY IF EXISTS "Authenticated users can view audits" ON public.inventory_audits;
CREATE POLICY "Users can view own audits and managers can view all" 
ON public.inventory_audits 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

-- 6. Política de segurança para scans de auditoria
DROP POLICY IF EXISTS "Users can view scans from their audits" ON public.inventory_audit_scans;
CREATE POLICY "Users can view scans from accessible audits" 
ON public.inventory_audit_scans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_audits ia 
    WHERE ia.id = inventory_audit_scans.audit_id 
    AND (
      ia.user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
    )
  )
);

-- 7. Função para verificar status de segurança do sistema
CREATE OR REPLACE FUNCTION public.get_security_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  status jsonb;
  active_sessions_count integer;
  failed_logins_count integer;
  recent_audits_count integer;
BEGIN
  -- Contar sessões ativas
  SELECT COUNT(*) INTO active_sessions_count
  FROM public.active_sessions
  WHERE expires_at > NOW();
  
  -- Contar tentativas de login falhadas nas últimas 24h
  SELECT COUNT(*) INTO failed_logins_count
  FROM public.audit_logs
  WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Contar auditorias recentes
  SELECT COUNT(*) INTO recent_audits_count
  FROM public.inventory_audits
  WHERE created_at > NOW() - INTERVAL '7 days';
  
  status := jsonb_build_object(
    'active_sessions', active_sessions_count,
    'failed_logins_24h', failed_logins_count,
    'recent_audits_7d', recent_audits_count,
    'security_check_time', NOW(),
    'system_health', CASE 
      WHEN failed_logins_count > 50 THEN 'ALERT'
      WHEN failed_logins_count > 20 THEN 'WARNING' 
      ELSE 'OK'
    END
  );
  
  RETURN status;
END;
$function$;