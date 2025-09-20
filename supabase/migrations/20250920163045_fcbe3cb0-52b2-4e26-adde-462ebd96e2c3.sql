-- Criar triggers para sincronização automática futura
CREATE OR REPLACE FUNCTION sync_stock_to_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Se um novo stock_item é inserido sem inventory_id, criar o inventory
    IF NEW.inventory_id IS NULL THEN
        -- Verificar se já existe um inventory com esse IMEI
        SELECT id INTO NEW.inventory_id 
        FROM public.inventory 
        WHERE imei = NEW.imei 
        LIMIT 1;
        
        -- Se não existe, criar um novo
        IF NEW.inventory_id IS NULL THEN
            INSERT INTO public.inventory (
                imei, brand, model, color, storage, condition, status, battery_pct, notes
            ) VALUES (
                NEW.imei, 
                NEW.brand, 
                NEW.model, 
                NEW.color, 
                NEW.storage, 
                NEW.condition,
                CASE 
                    WHEN NEW.status = 'disponivel' THEN 'available'::inventory_status
                    WHEN NEW.status = 'reservado' THEN 'loaned'::inventory_status
                    WHEN NEW.status = 'vendido' THEN 'sold'::inventory_status
                    ELSE 'available'::inventory_status
                END,
                NEW.battery_pct,
                COALESCE(NEW.notes, '')
            ) RETURNING id INTO NEW.inventory_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Aplicar trigger apenas em inserções
DROP TRIGGER IF EXISTS sync_stock_to_inventory_trigger ON public.stock_items;
CREATE TRIGGER sync_stock_to_inventory_trigger
    BEFORE INSERT ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_to_inventory();

-- Trigger para sincronizar mudanças de status
CREATE OR REPLACE FUNCTION sync_stock_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizar status quando stock_item muda
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.inventory_id IS NOT NULL THEN
        UPDATE public.inventory 
        SET status = CASE 
            WHEN NEW.status = 'disponivel' THEN 'available'::inventory_status
            WHEN NEW.status = 'reservado' THEN 'loaned'::inventory_status
            WHEN NEW.status = 'vendido' THEN 'sold'::inventory_status
            WHEN NEW.status = 'defeituoso' THEN 'available'::inventory_status
            ELSE 'available'::inventory_status
        END,
        updated_at = NOW()
        WHERE id = NEW.inventory_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS sync_stock_status_changes_trigger ON public.stock_items;
CREATE TRIGGER sync_stock_status_changes_trigger
    AFTER UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_status_changes();