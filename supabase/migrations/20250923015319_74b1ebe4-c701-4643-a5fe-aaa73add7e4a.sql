-- CORREÇÃO DEFINITIVA: Limpeza radical de todas as referências problemáticas a stock_status

-- 1. REMOVER TODAS as funções que fazem referência a stock_status relacionadas a loans
DROP FUNCTION IF EXISTS correct_loan_transaction(uuid, loan_status, text) CASCADE;
DROP FUNCTION IF EXISTS auto_apply_loan_label() CASCADE;
DROP FUNCTION IF EXISTS sync_stock_status_changes() CASCADE;
DROP FUNCTION IF EXISTS sync_stock_to_inventory() CASCADE;
DROP FUNCTION IF EXISTS sync_stock_on_loan_change() CASCADE;

-- 2. REMOVER TODOS os triggers problemáticos da tabela loans
DROP TRIGGER IF EXISTS manage_loan_inventory_status_trigger ON public.loans;

-- 3. REMOVER função atual que pode ter problemas
DROP FUNCTION IF EXISTS manage_loan_inventory_status() CASCADE;

-- 4. Criar função DEFINITIVA e LIMPA que só gerencia inventory (SEM stock_items)
CREATE OR REPLACE FUNCTION handle_loan_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Para INSERT (novo empréstimo ativo)
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE inventory 
        SET status = 'loaned'::inventory_status, 
            updated_at = now()
        WHERE id = NEW.item_id;
        RETURN NEW;
    END IF;
    
    -- Para UPDATE (mudança de status do empréstimo)
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Retorno do empréstimo
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE inventory 
            SET status = 'available'::inventory_status, 
                updated_at = now()
            WHERE id = NEW.item_id;
        
        -- Venda do item emprestado
        ELSIF OLD.status = 'active' AND NEW.status = 'sold' THEN
            UPDATE inventory 
            SET status = 'sold'::inventory_status, 
                updated_at = now()
            WHERE id = NEW.item_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Criar ÚNICO trigger limpo e funcional
CREATE TRIGGER handle_loan_status_change_trigger
    AFTER INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION handle_loan_status_change();

-- 6. Recriar função de correção SEM referências a stock_status
CREATE OR REPLACE FUNCTION correct_loan_simple(p_loan_id uuid, p_correct_status loan_status, p_correction_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    loan_record loans%ROWTYPE;
    result jsonb;
BEGIN
    -- Verificar permissão
    IF get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
    END IF;
    
    -- Buscar o empréstimo
    SELECT * INTO loan_record FROM loans WHERE id = p_loan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    
    -- Atualizar o empréstimo (o trigger cuida do inventory automaticamente)
    UPDATE loans SET
        status = p_correct_status,
        returned_at = CASE 
            WHEN p_correct_status IN ('returned'::loan_status, 'sold'::loan_status) 
            THEN COALESCE(returned_at, now()) 
            ELSE NULL 
        END,
        notes = COALESCE(notes || E'\n', '') || 'CORREÇÃO: ' || p_correction_reason,
        updated_at = now()
    WHERE id = p_loan_id;
    
    -- Log da correção
    PERFORM log_audit_event(
        'loan_correction_completed',
        jsonb_build_object(
            'loan_id', p_loan_id,
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
        'new_status', p_correct_status,
        'message', 'Correção realizada com sucesso'
    );
    
    RETURN result;
END;
$$;

-- 7. Corrigir integridade dos dados
UPDATE inventory 
SET status = 'loaned'::inventory_status, updated_at = now()
WHERE id IN (
    SELECT DISTINCT item_id 
    FROM loans 
    WHERE status = 'active'
) AND status != 'loaned';

UPDATE inventory 
SET status = 'available'::inventory_status, updated_at = now()
WHERE id NOT IN (
    SELECT DISTINCT item_id 
    FROM loans 
    WHERE status = 'active'
) AND status = 'loaned';

-- Log da correção definitiva
INSERT INTO audit_logs (action, table_name, details) 
VALUES ('SYSTEM_FIX', 'loans', '{"fix": "definitive_cleanup", "description": "Limpeza definitiva de todas as referências problemáticas a stock_status"}');