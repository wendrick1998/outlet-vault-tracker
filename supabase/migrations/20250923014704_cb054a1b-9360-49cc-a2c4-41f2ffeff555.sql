-- Corrigir erro interno no sistema de empréstimos
-- Remover triggers duplicados e conflitantes que causam o erro

-- 1. Remover todos os triggers antigos problemáticos da tabela loans
DROP TRIGGER IF EXISTS trigger_update_inventory_status_on_loan_change ON public.loans;
DROP TRIGGER IF EXISTS update_inventory_on_loan_sold ON public.loans;
DROP TRIGGER IF EXISTS sync_loan_inventory_status_trigger ON public.loans;

-- 2. Remover funções antigas conflitantes
DROP FUNCTION IF EXISTS update_inventory_status_on_loan_change();
DROP FUNCTION IF EXISTS update_inventory_status_on_loan_sold();
DROP FUNCTION IF EXISTS sync_loan_inventory_status();

-- 3. Criar função simplificada que só gerencia inventory (sem stock_items)
CREATE OR REPLACE FUNCTION manage_loan_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT (novo empréstimo ativo)
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.inventory 
        SET status = 'loaned'::inventory_status, updated_at = now()
        WHERE id = NEW.item_id;
        
        RETURN NEW;
    END IF;
    
    -- Para UPDATE (mudança de status do empréstimo)
    IF TG_OP = 'UPDATE' THEN
        -- Retorno do empréstimo
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE public.inventory 
            SET status = 'available'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
        
        -- Venda do item emprestado
        ELSIF OLD.status = 'active' AND NEW.status = 'sold' THEN
            UPDATE public.inventory 
            SET status = 'sold'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar único trigger limpo e funcional
CREATE TRIGGER manage_loan_inventory_status_trigger
    AFTER INSERT OR UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION manage_loan_inventory_status();

-- 5. Corrigir integridade dos dados existentes
UPDATE public.inventory 
SET status = 'loaned'::inventory_status, updated_at = now()
WHERE id IN (
    SELECT DISTINCT item_id 
    FROM public.loans 
    WHERE status = 'active'
) AND status != 'loaned';

UPDATE public.inventory 
SET status = 'available'::inventory_status, updated_at = now()
WHERE id NOT IN (
    SELECT DISTINCT item_id 
    FROM public.loans 
    WHERE status = 'active'
) AND status = 'loaned';

-- Log da correção
INSERT INTO audit_logs (action, table_name, details) 
VALUES ('SYSTEM_FIX', 'loans', '{"fix": "removed_conflicting_triggers", "description": "Removido triggers duplicados e criado função simplificada para corrigir erro interno do sistema"}');