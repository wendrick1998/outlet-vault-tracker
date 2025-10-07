-- ============================================
-- CORREÇÃO COMPLETA: Integridade e Segurança
-- ============================================

-- 1. CORRIGIR INCONSISTÊNCIAS HISTÓRICAS
DO $$
DECLARE
  v_corrected_count INTEGER := 0;
BEGIN
  UPDATE public.loans
  SET status = 'sold'::loan_status, updated_at = NOW()
  WHERE status = 'returned'::loan_status
    AND item_id IN (SELECT id FROM public.inventory WHERE status = 'sold'::inventory_status);
  
  GET DIAGNOSTICS v_corrected_count = ROW_COUNT;
  
  PERFORM public.log_audit_event(
    'historical_loan_status_corrected',
    jsonb_build_object('corrected_count', v_corrected_count, 'reason', 'Auto-correction')
  );
END $$;

-- 2. DROP funções antigas
DROP FUNCTION IF EXISTS public.request_sensitive_data_access(uuid, text[], text);
DROP FUNCTION IF EXISTS public.get_customer_with_session_validation(uuid, uuid);
DROP FUNCTION IF EXISTS public.cleanup_expired_access_sessions();

-- 3. CRIAR funções de acesso temporário
CREATE FUNCTION public.request_sensitive_data_access(
  p_customer_id UUID, p_requested_fields TEXT[], p_business_reason TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID; v_user_role app_role; v_session_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Não autenticado'); END IF;
  
  SELECT get_user_role(v_user_id) INTO v_user_role;
  IF v_user_role NOT IN ('admin'::app_role, 'manager'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão insuficiente');
  END IF;
  
  IF NOT p_requested_fields <@ ARRAY['email', 'phone', 'cpf', 'address', 'notes'] THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campos inválidos');
  END IF;
  
  INSERT INTO public.sensitive_data_access_sessions (user_id, customer_id, approved_fields, access_reason, expires_at)
  VALUES (v_user_id, p_customer_id, p_requested_fields, p_business_reason, NOW() + INTERVAL '15 minutes')
  RETURNING id INTO v_session_id;
  
  PERFORM public.log_audit_event('sensitive_data_access_requested', 
    jsonb_build_object('customer_id', p_customer_id, 'session_id', v_session_id, 'fields', p_requested_fields));
  
  RETURN jsonb_build_object('success', true, 'session_id', v_session_id, 'expires_at', NOW() + INTERVAL '15 minutes');
END; $$;

CREATE FUNCTION public.get_customer_with_session_validation(p_customer_id UUID, p_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session sensitive_data_access_sessions%ROWTYPE;
  v_customer customers%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_session FROM public.sensitive_data_access_sessions
  WHERE id = p_session_id AND user_id = auth.uid() AND customer_id = p_customer_id 
    AND is_active = true AND expires_at > NOW();
  
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Sessão inválida'); END IF;
  
  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado'); END IF;
  
  UPDATE public.sensitive_data_access_sessions SET used_at = NOW() WHERE id = p_session_id;
  
  v_result := jsonb_build_object('success', true, 'id', v_customer.id, 'name', v_customer.name);
  
  IF 'email' = ANY(v_session.approved_fields) THEN v_result := v_result || jsonb_build_object('email', v_customer.email); END IF;
  IF 'phone' = ANY(v_session.approved_fields) THEN v_result := v_result || jsonb_build_object('phone', v_customer.phone); END IF;
  IF 'cpf' = ANY(v_session.approved_fields) THEN v_result := v_result || jsonb_build_object('cpf', v_customer.cpf); END IF;
  IF 'address' = ANY(v_session.approved_fields) THEN v_result := v_result || jsonb_build_object('address', v_customer.address); END IF;
  IF 'notes' = ANY(v_session.approved_fields) THEN v_result := v_result || jsonb_build_object('notes', v_customer.notes); END IF;
  
  PERFORM public.log_audit_event('sensitive_data_session_used', 
    jsonb_build_object('customer_id', p_customer_id, 'session_id', p_session_id));
  
  RETURN v_result;
END; $$;

CREATE FUNCTION public.cleanup_expired_access_sessions() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  UPDATE public.sensitive_data_access_sessions SET is_active = false WHERE is_active = true AND expires_at <= NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 THEN
    PERFORM public.log_audit_event('sensitive_data_sessions_cleaned', jsonb_build_object('deactivated_count', v_deleted_count));
  END IF;
  RETURN v_deleted_count;
END; $$;

-- 4. RLS: customers
DROP POLICY IF EXISTS "Admins and managers can view all customer data" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers with valid session can access sensitive data" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers can view customers" ON public.customers;

CREATE POLICY "Admins and managers can view customers" ON public.customers FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role));

CREATE POLICY "Admins and managers can manage customers" ON public.customers FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role))
WITH CHECK (get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role));

-- 5. RLS: audit_logs
DROP POLICY IF EXISTS "Auditors and admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins and auditors can view recent audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can access historical audit logs" ON public.audit_logs;

CREATE POLICY "Admins and auditors can view recent audit logs" ON public.audit_logs FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('admin'::app_role, 'auditor'::app_role) AND created_at >= NOW() - INTERVAL '90 days');

CREATE POLICY "Admins can access historical audit logs" ON public.audit_logs FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::app_role AND created_at < NOW() - INTERVAL '90 days');

-- 6. ÍNDICES DE PERFORMANCE (sem NOW() em índices parciais)
CREATE INDEX IF NOT EXISTS idx_sensitive_sessions_active 
ON public.sensitive_data_access_sessions(user_id, customer_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_date_action 
ON public.audit_logs(created_at DESC, action);

CREATE INDEX IF NOT EXISTS idx_loans_inventory_status
ON public.loans(status, item_id);

-- 7. LOG FINAL
DO $$ BEGIN
  PERFORM public.log_audit_event('security_hardening_completed',
    jsonb_build_object('corrections', ARRAY[
      'historical_loan_inconsistencies_fixed',
      'sensitive_data_access_sessions_implemented',
      'customer_rls_policies_restricted',
      'audit_logs_temporal_access_enforced',
      'performance_indexes_created'
    ], 'timestamp', NOW())
  );
END $$;