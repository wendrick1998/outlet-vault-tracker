-- Investigar e corrigir problema com triggers de loan
-- O erro "stock_status does not exist" indica problema nos triggers

-- 1. Primeiro, verificar se o tipo existe corretamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_status') THEN
    RAISE NOTICE 'Tipo stock_status não existe, criando...';
    CREATE TYPE stock_status AS ENUM (
      'disponivel',
      'reservado', 
      'vendido',
      'defeituoso',
      'manutencao',
      'promocao'
    );
  END IF;
END
$$;

-- 2. Verificar se há triggers duplicados causando conflito
-- Remover triggers antigos problemáticos se existirem

DROP TRIGGER IF EXISTS sync_stock_status_changes_trigger ON public.loans;
DROP FUNCTION IF EXISTS sync_stock_status();

-- 3. Recriar trigger limpo e funcional para sincronizar status
CREATE OR REPLACE FUNCTION sync_loan_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT (novo empréstimo)
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Atualizar inventory
        UPDATE public.inventory 
        SET status = 'loaned'::inventory_status, updated_at = now()
        WHERE id = NEW.item_id;
        
        -- Atualizar stock_items se existir
        UPDATE public.stock_items 
        SET status = 'reservado'::stock_status, updated_at = now()
        WHERE inventory_id = NEW.item_id 
           OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        
        RETURN NEW;
    END IF;
    
    -- Para UPDATE (mudança de status do empréstimo)
    IF TG_OP = 'UPDATE' THEN
        -- Retorno do empréstimo
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE public.inventory 
            SET status = 'available'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE public.stock_items 
            SET status = 'disponivel'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id 
               OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        
        -- Venda do item emprestado
        ELSIF OLD.status = 'active' AND NEW.status = 'sold' THEN
            UPDATE public.inventory 
            SET status = 'sold'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE public.stock_items 
            SET status = 'vendido'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id 
               OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Remover triggers duplicados problemáticos
DROP TRIGGER IF EXISTS sync_stock_on_loan_change ON public.loans;
DROP TRIGGER IF EXISTS update_inventory_status_trigger ON public.loans;

-- 5. Criar novo trigger limpo
CREATE TRIGGER sync_loan_inventory_status_trigger
    AFTER INSERT OR UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION sync_loan_inventory_status();

-- 6. Verificar integridade dos dados
-- Corrigir qualquer inconsistência nos status
UPDATE public.inventory 
SET status = 'loaned'::inventory_status
WHERE id IN (
    SELECT DISTINCT item_id 
    FROM public.loans 
    WHERE status = 'active'
) AND status != 'loaned';

UPDATE public.inventory 
SET status = 'available'::inventory_status  
WHERE id NOT IN (
    SELECT DISTINCT item_id 
    FROM public.loans 
    WHERE status = 'active'
) AND status = 'loaned';

-- Log da correção
INSERT INTO audit_logs (action, table_name, details) 
VALUES ('SYSTEM_FIX', 'loans', '{"fix": "triggers_stock_status_error", "description": "Corrigido erro de triggers duplicados causando problema com stock_status"}');