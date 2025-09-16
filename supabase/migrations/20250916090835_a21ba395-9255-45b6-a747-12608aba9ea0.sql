-- Corrigir avisos de segurança - adicionar search_path nas funções

-- Recriar função sync_stock_status com search_path
CREATE OR REPLACE FUNCTION public.sync_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.stock_items 
        SET 
            status = CASE 
                WHEN NEW.status = 'active' THEN 'reservado'::stock_status -- Emprestado = reservado
                WHEN NEW.status = 'returned' THEN 'disponivel'::stock_status 
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'lost' THEN 'defeituoso'::stock_status -- Perdido = defeituoso
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
                WHEN NEW.status = 'lost' THEN 'maintenance'::inventory_status
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recriar função sync_stock_from_inventory com search_path
CREATE OR REPLACE FUNCTION public.sync_stock_from_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.stock_items 
        SET 
            status = CASE 
                WHEN NEW.status = 'available' THEN 'disponivel'::stock_status
                WHEN NEW.status = 'loaned' THEN 'reservado'::stock_status
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'maintenance' THEN 'manutencao'::stock_status
                ELSE status
            END,
            brand = NEW.brand,
            model = NEW.model,
            color = NEW.color,
            storage = NEW.storage,
            condition = NEW.condition,
            battery_pct = COALESCE(NEW.battery_pct, battery_pct),
            notes = NEW.notes,
            updated_at = now()
        WHERE inventory_id = NEW.id OR imei = NEW.imei;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.stock_items (
            inventory_id, imei, brand, model, color, storage,
            condition, battery_pct, notes, status, location
        ) VALUES (
            NEW.id, NEW.imei, NEW.brand, NEW.model, NEW.color, NEW.storage,
            NEW.condition, COALESCE(NEW.battery_pct, 100), NEW.notes,
            CASE 
                WHEN NEW.status = 'available' THEN 'disponivel'::stock_status
                WHEN NEW.status = 'loaned' THEN 'reservado'::stock_status
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'maintenance' THEN 'manutencao'::stock_status
                ELSE 'disponivel'::stock_status
            END,
            'estoque'::stock_location
        ) ON CONFLICT (imei) DO UPDATE SET
            inventory_id = NEW.id,
            brand = NEW.brand,
            model = NEW.model,
            color = NEW.color,
            storage = NEW.storage,
            condition = NEW.condition,
            battery_pct = COALESCE(NEW.battery_pct, stock_items.battery_pct),
            notes = NEW.notes,
            updated_at = now();
            
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';