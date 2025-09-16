-- FASE 1: Corrigir aparelhos órfãos criando registros correspondentes no inventory
INSERT INTO inventory (imei, brand, model, color, storage, condition, status, battery_pct, notes)
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
    WHEN si.status = 'manutencao' THEN 'maintenance'::inventory_status
    ELSE 'available'::inventory_status
  END,
  si.battery_pct,
  'Criado automaticamente para sincronização com estoque'
FROM stock_items si
WHERE si.inventory_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.imei = si.imei);

-- Atualizar stock_items para referenciar os registros do inventory criados
UPDATE stock_items 
SET inventory_id = i.id
FROM inventory i
WHERE stock_items.imei = i.imei 
  AND stock_items.inventory_id IS NULL;

-- FASE 3: Criar função para detectar itens em demonstração
CREATE OR REPLACE FUNCTION detect_demonstration_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Aplicar etiqueta "Demonstração" para itens na vitrine que estão disponíveis há mais tempo
  INSERT INTO stock_item_labels (stock_item_id, label_id, applied_by)
  SELECT DISTINCT
    si.id,
    l.id as label_id,
    '00000000-0000-0000-0000-000000000000'::uuid -- Sistema
  FROM stock_items si
  CROSS JOIN labels l
  WHERE si.location = 'vitrine'::stock_location
    AND si.status = 'disponivel'::stock_status
    AND l.name = 'Demonstração'
    AND si.created_at < (now() - INTERVAL '7 days') -- Mais de 7 dias na vitrine
    AND NOT EXISTS (
      SELECT 1 FROM stock_item_labels sil 
      WHERE sil.stock_item_id = si.id AND sil.label_id = l.id
    );
END;
$$;

-- Executar a função de demonstração
SELECT detect_demonstration_items();