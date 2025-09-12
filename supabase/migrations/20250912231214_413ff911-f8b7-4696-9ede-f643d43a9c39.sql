-- Fase 4: Correções de Segurança e Polimento

-- 1. Corrigir search_path em funções existentes para segurança
CREATE OR REPLACE FUNCTION public.get_customer_safe(customer_id uuid)
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
$function$;

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

-- 2. Melhorar políticas RLS da tabela device_models (proteger catálogo)
DROP POLICY IF EXISTS "Anyone can view active device models" ON public.device_models;

CREATE POLICY "Authenticated users can view device models" 
ON public.device_models 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_imei_gin ON public.inventory USING gin(imei gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_suffix_gin ON public.inventory USING gin(suffix gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_model_gin ON public.inventory USING gin(model gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_brand_gin ON public.inventory USING gin(brand gin_trgm_ops);

-- Adicionar extensão trigram se não existir
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Índices para audit tables para melhor performance
CREATE INDEX IF NOT EXISTS idx_inventory_audits_user_id ON public.inventory_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_status ON public.inventory_audits(status);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_started_at ON public.inventory_audits(started_at);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_audit_id ON public.inventory_audit_scans(audit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_timestamp ON public.inventory_audit_scans(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_imei ON public.inventory_audit_scans(imei);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_audit_id ON public.inventory_audit_tasks(audit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_status ON public.inventory_audit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_priority ON public.inventory_audit_tasks(priority);

-- 5. Função de limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Limpar auditorias antigas (mais de 1 ano)
  DELETE FROM public.inventory_audits 
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status = 'completed';
  
  -- Limpar logs de auditoria muito antigos (mais de 6 meses)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND action NOT IN ('user_login', 'user_logout', 'security_violation');
  
  -- Limpar sessões expiradas
  DELETE FROM public.active_sessions 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$function$;

-- 6. Trigger para validação de dados de conferência
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

CREATE TRIGGER validate_audit_scan_trigger
BEFORE INSERT OR UPDATE ON public.inventory_audit_scans
FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_audit_scan();

-- 7. Função para métricas de performance da conferência
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