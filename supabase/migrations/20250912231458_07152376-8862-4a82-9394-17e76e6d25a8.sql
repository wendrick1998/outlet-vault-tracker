-- Fase 4: Correções de Segurança e Polimento (Parte 2)

-- 1. Primeiro, criar a extensão pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Corrigir search_path em funções existentes para segurança
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

-- 3. Melhorar políticas RLS da tabela device_models (proteger catálogo)
DROP POLICY IF EXISTS "Anyone can view active device models" ON public.device_models;

CREATE POLICY "Authenticated users can view device models" 
ON public.device_models 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Adicionar índices BTREE para performance (mais seguros que GIN trigram)
CREATE INDEX IF NOT EXISTS idx_inventory_imei_btree ON public.inventory(imei);
CREATE INDEX IF NOT EXISTS idx_inventory_suffix_btree ON public.inventory(suffix);
CREATE INDEX IF NOT EXISTS idx_inventory_model_btree ON public.inventory(model);
CREATE INDEX IF NOT EXISTS idx_inventory_brand_btree ON public.inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON public.inventory(created_at);

-- 5. Índices para audit tables para melhor performance
CREATE INDEX IF NOT EXISTS idx_inventory_audits_user_id ON public.inventory_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_status ON public.inventory_audits(status);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_started_at ON public.inventory_audits(started_at);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_audit_id ON public.inventory_audit_scans(audit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_timestamp ON public.inventory_audit_scans(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_imei ON public.inventory_audit_scans(imei);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_audit_id ON public.inventory_audit_tasks(audit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_status ON public.inventory_audit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_tasks_priority ON public.inventory_audit_tasks(priority);

-- 6. Função de limpeza automática de dados antigos
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