-- Sincronizar itens de stock_items para inventory que não estão conectados
INSERT INTO public.inventory (
    imei,
    brand,
    model,
    color,
    storage,
    condition,
    status,
    battery_pct,
    notes,
    created_at,
    updated_at
)
SELECT 
    si.imei,
    si.brand,
    si.model,
    si.color,
    si.storage,
    si.condition,
    CASE 
        WHEN si.status = 'disponivel' THEN 'available'::inventory_status
        WHEN si.status = 'reservado' THEN 'loaned'::inventory_status
        WHEN si.status = 'vendido' THEN 'sold'::inventory_status
        WHEN si.status = 'defeituoso' THEN 'available'::inventory_status
        ELSE 'available'::inventory_status
    END,
    si.battery_pct,
    COALESCE(si.notes, '') || 
    CASE 
        WHEN si.serial_number IS NOT NULL AND si.serial_number != si.imei 
        THEN ' | Serial: ' || si.serial_number 
        ELSE '' 
    END,
    si.created_at,
    si.updated_at
FROM public.stock_items si
WHERE si.inventory_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM public.inventory i 
    WHERE i.imei = si.imei
);

-- Agora conectar os stock_items aos inventory criados
UPDATE public.stock_items si
SET inventory_id = i.id,
    updated_at = NOW()
FROM public.inventory i
WHERE si.imei = i.imei 
AND si.inventory_id IS NULL;

-- Trigger para manter sincronização automática no futuro
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_stock_status_changes_trigger ON public.stock_items;
CREATE TRIGGER sync_stock_status_changes_trigger
    AFTER UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_status_changes();