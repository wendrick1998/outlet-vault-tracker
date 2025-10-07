-- =====================================================
-- SISTEMA DE CORREÇÃO DE EMPRÉSTIMOS COM AUDITORIA
-- =====================================================

-- 1. Tabela para histórico de correções
CREATE TABLE IF NOT EXISTS public.loan_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  corrected_by UUID NOT NULL REFERENCES public.profiles(id),
  previous_status loan_status NOT NULL,
  new_status loan_status NOT NULL,
  correction_reason TEXT NOT NULL CHECK (LENGTH(TRIM(correction_reason)) >= 10),
  pin_validated BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  manager_notified BOOLEAN NOT NULL DEFAULT false,
  corrected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index para buscar correções por empréstimo
CREATE INDEX idx_loan_corrections_loan_id ON public.loan_corrections(loan_id);
CREATE INDEX idx_loan_corrections_corrected_by ON public.loan_corrections(corrected_by);
CREATE INDEX idx_loan_corrections_critical ON public.loan_corrections(is_critical) WHERE is_critical = true;

-- RLS para loan_corrections
ALTER TABLE public.loan_corrections ENABLE ROW LEVEL SECURITY;

-- Admins e managers podem ver todas as correções
CREATE POLICY "Admins and managers can view all corrections"
ON public.loan_corrections FOR SELECT
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'manager'::app_role]));

-- Usuários podem ver suas próprias correções
CREATE POLICY "Users can view own corrections"
ON public.loan_corrections FOR SELECT
USING (corrected_by = auth.uid());

-- Sistema pode inserir correções (via RPC)
CREATE POLICY "System can insert corrections"
ON public.loan_corrections FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Tabela para controle de limites de correção
CREATE TABLE IF NOT EXISTS public.correction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  correction_count INTEGER NOT NULL DEFAULT 0,
  last_correction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS para correction_limits
ALTER TABLE public.correction_limits ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios limites
CREATE POLICY "Users can view own limits"
ON public.correction_limits FOR SELECT
USING (user_id = auth.uid());

-- Admins podem ver todos os limites
CREATE POLICY "Admins can view all limits"
ON public.correction_limits FOR SELECT
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Sistema pode gerenciar limites
CREATE POLICY "System can manage limits"
ON public.correction_limits FOR ALL
USING (auth.uid() IS NOT NULL);

-- 3. Função RPC completa para corrigir empréstimos
CREATE OR REPLACE FUNCTION public.correct_loan_with_audit(
  p_loan_id UUID,
  p_new_status loan_status,
  p_correction_reason TEXT,
  p_pin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role app_role;
  v_current_loan loans%ROWTYPE;
  v_correction_id UUID;
  v_is_critical BOOLEAN := false;
  v_pin_valid JSONB;
  v_correction_count INTEGER := 0;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_new_inventory_status inventory_status;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Obter role do usuário
  SELECT get_user_role(v_user_id) INTO v_user_role;

  -- 1. VALIDAR PERMISSÕES
  IF v_user_role NOT IN ('admin'::app_role, 'manager'::app_role) THEN
    -- Usuários normais precisam de can_withdraw = true
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = v_user_id 
      AND is_active = true 
      AND can_withdraw = true
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Sem permissão para realizar correções'
      );
    END IF;
  END IF;

  -- 2. VALIDAR PIN (obrigatório exceto para admins)
  IF v_user_role != 'admin'::app_role THEN
    IF p_pin IS NULL OR LENGTH(TRIM(p_pin)) = 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'PIN obrigatório para correções'
      );
    END IF;

    -- Validar PIN
    SELECT validate_operation_pin(v_user_id, p_pin) INTO v_pin_valid;
    
    IF NOT (v_pin_valid->>'valid')::boolean THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', COALESCE(v_pin_valid->>'message', 'PIN inválido'),
        'blocked', COALESCE((v_pin_valid->>'blocked')::boolean, false)
      );
    END IF;
  END IF;

  -- 3. VALIDAR JUSTIFICATIVA
  IF LENGTH(TRIM(p_correction_reason)) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Justificativa deve ter no mínimo 10 caracteres'
    );
  END IF;

  -- 4. VERIFICAR LIMITE DE CORREÇÕES (apenas para não-admins)
  IF v_user_role != 'admin'::app_role THEN
    -- Buscar ou criar registro de limite
    INSERT INTO correction_limits (user_id, correction_count, window_start)
    VALUES (v_user_id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    SELECT correction_count, window_start 
    INTO v_correction_count, v_window_start
    FROM correction_limits
    WHERE user_id = v_user_id;

    -- Resetar contador se passou 24h
    IF v_window_start < NOW() - INTERVAL '24 hours' THEN
      UPDATE correction_limits
      SET correction_count = 0,
          window_start = NOW(),
          updated_at = NOW()
      WHERE user_id = v_user_id;
      v_correction_count := 0;
    END IF;

    -- Verificar limite (5 correções por dia)
    IF v_correction_count >= 5 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Limite diário de correções atingido (5/dia)',
        'limit_exceeded', true,
        'reset_time', v_window_start + INTERVAL '24 hours'
      );
    END IF;
  END IF;

  -- 5. BUSCAR DADOS ATUAIS DO EMPRÉSTIMO
  SELECT * INTO v_current_loan
  FROM loans
  WHERE id = p_loan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Empréstimo não encontrado'
    );
  END IF;

  -- Verificar se já está no status desejado
  IF v_current_loan.status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Empréstimo já está no status: ' || p_new_status
    );
  END IF;

  -- 6. DETERMINAR SE É CORREÇÃO CRÍTICA
  -- Crítico: sold -> active/returned, ou qualquer mudança envolvendo sold
  IF (v_current_loan.status = 'sold' AND p_new_status IN ('active', 'returned'))
     OR (v_current_loan.status IN ('active', 'returned') AND p_new_status = 'sold') THEN
    v_is_critical := true;
  END IF;

  -- 7. REGISTRAR CORREÇÃO
  INSERT INTO loan_corrections (
    loan_id,
    corrected_by,
    previous_status,
    new_status,
    correction_reason,
    pin_validated,
    ip_address,
    user_agent,
    is_critical
  ) VALUES (
    p_loan_id,
    v_user_id,
    v_current_loan.status,
    p_new_status,
    p_correction_reason,
    (v_user_role != 'admin'::app_role),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    v_is_critical
  ) RETURNING id INTO v_correction_id;

  -- 8. ATUALIZAR STATUS DO EMPRÉSTIMO
  UPDATE loans
  SET status = p_new_status,
      updated_at = NOW(),
      returned_at = CASE 
        WHEN p_new_status IN ('returned', 'sold') THEN COALESCE(returned_at, NOW())
        ELSE returned_at
      END
  WHERE id = p_loan_id;

  -- 9. SINCRONIZAR STATUS DO INVENTÁRIO
  -- Mapear loan_status -> inventory_status
  v_new_inventory_status := CASE p_new_status
    WHEN 'active' THEN 'loaned'::inventory_status
    WHEN 'returned' THEN 'available'::inventory_status
    WHEN 'sold' THEN 'sold'::inventory_status
    WHEN 'overdue' THEN 'loaned'::inventory_status
    ELSE 'available'::inventory_status
  END;

  UPDATE inventory
  SET status = v_new_inventory_status,
      updated_at = NOW()
  WHERE id = v_current_loan.item_id;

  -- 10. ATUALIZAR LIMITE DE CORREÇÕES
  IF v_user_role != 'admin'::app_role THEN
    UPDATE correction_limits
    SET correction_count = correction_count + 1,
        last_correction_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;

  -- 11. LOG DE AUDITORIA
  PERFORM log_audit_event(
    'loan_corrected',
    jsonb_build_object(
      'loan_id', p_loan_id,
      'correction_id', v_correction_id,
      'previous_status', v_current_loan.status,
      'new_status', p_new_status,
      'is_critical', v_is_critical,
      'item_imei', (SELECT imei FROM inventory WHERE id = v_current_loan.item_id),
      'user_role', v_user_role,
      'pin_validated', (v_user_role != 'admin'::app_role)
    ),
    'loans',
    p_loan_id
  );

  -- 12. RETORNAR SUCESSO
  RETURN jsonb_build_object(
    'success', true,
    'correction_id', v_correction_id,
    'previous_status', v_current_loan.status,
    'new_status', p_new_status,
    'is_critical', v_is_critical,
    'item_imei', (SELECT imei FROM inventory WHERE id = v_current_loan.item_id),
    'message', 'Correção realizada com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro ao processar correção: ' || SQLERRM
    );
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.loan_corrections IS 'Histórico completo de correções de empréstimos com auditoria';
COMMENT ON TABLE public.correction_limits IS 'Controle de limites diários de correções por usuário';
COMMENT ON FUNCTION public.correct_loan_with_audit IS 'Função RPC para corrigir empréstimos com validação de PIN, limites e auditoria completa';