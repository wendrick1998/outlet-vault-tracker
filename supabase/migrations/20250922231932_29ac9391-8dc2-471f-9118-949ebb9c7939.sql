-- Corrigir o trigger problemático que está causando erro de tipo
-- Primeiro, vamos dropar o trigger existente se existir
DROP TRIGGER IF EXISTS sync_stock_on_loan_change ON loans;

-- Criar uma função corrigida para sincronização
CREATE OR REPLACE FUNCTION sync_stock_on_loan_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um loan é criado (status = active)
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Atualizar inventory para loaned
        UPDATE inventory 
        SET status = 'loaned'::inventory_status, updated_at = now()
        WHERE id = NEW.item_id;
        
        -- Atualizar stock_items para reservado (convertendo corretamente o tipo)
        UPDATE stock_items 
        SET status = 'reservado'::stock_status, updated_at = now()
        WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM inventory WHERE id = NEW.item_id);
        
        RETURN NEW;
    END IF;
    
    -- Quando um loan é atualizado
    IF TG_OP = 'UPDATE' THEN
        -- Se mudou de active para returned
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE inventory 
            SET status = 'available'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE stock_items 
            SET status = 'disponivel'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM inventory WHERE id = NEW.item_id);
        
        -- Se mudou de active para sold
        ELSIF OLD.status = 'active' AND NEW.status = 'sold' THEN
            UPDATE inventory 
            SET status = 'sold'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE stock_items 
            SET status = 'vendido'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM inventory WHERE id = NEW.item_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger com a função corrigida
CREATE TRIGGER sync_stock_on_loan_change
    AFTER INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_on_loan_change();