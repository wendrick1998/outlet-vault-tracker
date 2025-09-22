-- Corrigir o search_path da função para resolver warning de segurança
CREATE OR REPLACE FUNCTION sync_stock_on_loan_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Quando um loan é criado (status = active)
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Atualizar inventory para loaned
        UPDATE public.inventory 
        SET status = 'loaned'::inventory_status, updated_at = now()
        WHERE id = NEW.item_id;
        
        -- Atualizar stock_items para reservado (convertendo corretamente o tipo)
        UPDATE public.stock_items 
        SET status = 'reservado'::stock_status, updated_at = now()
        WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        
        RETURN NEW;
    END IF;
    
    -- Quando um loan é atualizado
    IF TG_OP = 'UPDATE' THEN
        -- Se mudou de active para returned
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE public.inventory 
            SET status = 'available'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE public.stock_items 
            SET status = 'disponivel'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        
        -- Se mudou de active para sold  
        ELSIF OLD.status = 'active' AND NEW.status = 'sold' THEN
            UPDATE public.inventory 
            SET status = 'sold'::inventory_status, updated_at = now()
            WHERE id = NEW.item_id;
            
            UPDATE public.stock_items 
            SET status = 'vendido'::stock_status, updated_at = now()
            WHERE inventory_id = NEW.item_id OR imei = (SELECT imei FROM public.inventory WHERE id = NEW.item_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;