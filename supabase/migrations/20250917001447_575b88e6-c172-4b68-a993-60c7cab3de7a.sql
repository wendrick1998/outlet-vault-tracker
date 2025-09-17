-- Correção da função sync_stock_status para remover referência a 'lost'
CREATE OR REPLACE FUNCTION public.sync_stock_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.stock_items 
        SET 
            status = CASE 
                WHEN NEW.status = 'active' THEN 'reservado'::stock_status -- Emprestado = reservado
                WHEN NEW.status = 'returned' THEN 'disponivel'::stock_status 
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'overdue' THEN 'reservado'::stock_status -- Atrasado = ainda reservado
                ELSE status
            END,
            updated_at = now()
        WHERE inventory_id = NEW.item_id OR imei = (
            SELECT imei FROM public.inventory WHERE id = NEW.item_id
        );
        
        -- Também atualizar o inventory original
        UPDATE public.inventory
        SET 
            status = CASE 
                WHEN NEW.status = 'active' THEN 'loaned'::inventory_status
                WHEN NEW.status = 'returned' THEN 'available'::inventory_status
                WHEN NEW.status = 'sold' THEN 'sold'::inventory_status
                WHEN NEW.status = 'overdue' THEN 'loaned'::inventory_status -- Atrasado = ainda emprestado
                ELSE status
            END,
            updated_at = now()
        WHERE id = NEW.item_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.stock_items 
        SET 
            status = 'disponivel'::stock_status,
            updated_at = now()
        WHERE inventory_id = OLD.item_id OR imei = (
            SELECT imei FROM public.inventory WHERE id = OLD.item_id
        );
        
        UPDATE public.inventory
        SET 
            status = 'available'::inventory_status,
            updated_at = now()
        WHERE id = OLD.item_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$