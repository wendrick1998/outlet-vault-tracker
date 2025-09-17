-- Função para corrigir lançamentos errôneos
CREATE OR REPLACE FUNCTION public.correct_loan_transaction(
    p_loan_id uuid,
    p_correct_status loan_status,
    p_correction_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    loan_record loans%ROWTYPE;
    inventory_record inventory%ROWTYPE;
    result jsonb;
BEGIN
    -- Verificar se o usuário tem permissão (admin ou manager)
    IF get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
    END IF;
    
    -- Buscar o empréstimo
    SELECT * INTO loan_record FROM loans WHERE id = p_loan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    
    -- Buscar o item do inventário
    SELECT * INTO inventory_record FROM inventory WHERE id = loan_record.item_id;
    
    -- Log da correção antes de fazer as alterações
    PERFORM log_audit_event(
        'loan_correction_initiated',
        jsonb_build_object(
            'loan_id', p_loan_id,
            'item_imei', inventory_record.imei,
            'old_status', loan_record.status,
            'new_status', p_correct_status,
            'reason', p_correction_reason,
            'corrected_by', auth.uid()
        ),
        'loans',
        p_loan_id
    );
    
    -- Atualizar o empréstimo
    UPDATE loans SET
        status = p_correct_status,
        returned_at = CASE 
            WHEN p_correct_status IN ('returned'::loan_status, 'sold'::loan_status) 
            THEN COALESCE(returned_at, now()) 
            ELSE NULL 
        END,
        notes = COALESCE(notes || E'\n', '') || 'CORREÇÃO: ' || p_correction_reason || ' em ' || now()::text,
        updated_at = now()
    WHERE id = p_loan_id;
    
    -- Atualizar status do inventário
    UPDATE inventory SET
        status = CASE 
            WHEN p_correct_status = 'returned'::loan_status THEN 'available'::inventory_status
            WHEN p_correct_status = 'sold'::loan_status THEN 'sold'::inventory_status
            WHEN p_correct_status = 'active'::loan_status THEN 'loaned'::inventory_status
            WHEN p_correct_status = 'overdue'::loan_status THEN 'loaned'::inventory_status
            ELSE status
        END,
        updated_at = now()
    WHERE id = loan_record.item_id;
    
    -- Atualizar status do stock_items
    UPDATE stock_items SET
        status = CASE 
            WHEN p_correct_status = 'returned'::loan_status THEN 'disponivel'::stock_status
            WHEN p_correct_status = 'sold'::loan_status THEN 'vendido'::stock_status
            WHEN p_correct_status = 'active'::loan_status THEN 'reservado'::stock_status
            WHEN p_correct_status = 'overdue'::loan_status THEN 'reservado'::stock_status
            ELSE status
        END,
        updated_at = now()
    WHERE inventory_id = loan_record.item_id OR imei = inventory_record.imei;
    
    -- Log da correção finalizada
    PERFORM log_audit_event(
        'loan_correction_completed',
        jsonb_build_object(
            'loan_id', p_loan_id,
            'item_imei', inventory_record.imei,
            'corrected_status', p_correct_status,
            'reason', p_correction_reason,
            'corrected_by', auth.uid()
        ),
        'loans',
        p_loan_id
    );
    
    result := jsonb_build_object(
        'success', true,
        'loan_id', p_loan_id,
        'item_imei', inventory_record.imei,
        'old_status', loan_record.status,
        'new_status', p_correct_status,
        'message', 'Correção realizada com sucesso'
    );
    
    RETURN result;
END;
$function$;

-- Corrigir especificamente o IMEI 352113536370278
SELECT public.correct_loan_transaction(
    '2cfd31ff-41c3-43e3-84db-380351f4c530'::uuid,
    'returned'::loan_status,
    'Correção administrativa - Item foi incorretamente marcado como vendido quando deveria ter sido devolvido'
);