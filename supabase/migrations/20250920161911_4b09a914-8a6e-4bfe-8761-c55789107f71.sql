-- Primeiro remover a constraint que está bloqueando
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_imei_check;

-- Sincronizar itens de stock_items para inventory que não estão conectados (sem constraint)
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

-- Conectar os stock_items aos inventory criados
UPDATE public.stock_items si
SET inventory_id = i.id,
    updated_at = NOW()
FROM public.inventory i
WHERE si.imei = i.imei 
AND si.inventory_id IS NULL;