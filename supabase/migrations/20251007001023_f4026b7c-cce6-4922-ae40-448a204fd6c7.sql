-- FASE 2: Migração automática de dados existentes do inventory para stock_items
-- Este script vincula items existentes e cria entradas correspondentes no estoque

-- 1. Função para migrar items do inventory para stock_items
CREATE OR REPLACE FUNCTION migrate_inventory_to_stock()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  migrated_count INTEGER := 0;
  failed_count INTEGER := 0;
  inventory_record inventory%ROWTYPE;
  new_stock_id UUID;
  result jsonb;
BEGIN
  -- Percorrer todos items do inventory que não têm stock_item_id
  FOR inventory_record IN 
    SELECT * FROM inventory 
    WHERE stock_item_id IS NULL 
    AND is_archived = false
  LOOP
    BEGIN
      -- Criar item correspondente no stock_items
      INSERT INTO stock_items (
        imei, model, brand, color, storage, condition,
        battery_pct, notes, shelf_position,
        status, location, created_by
      ) VALUES (
        inventory_record.imei,
        inventory_record.model,
        inventory_record.brand,
        inventory_record.color,
        inventory_record.storage,
        inventory_record.condition,
        inventory_record.battery_pct,
        inventory_record.notes,
        NULL, -- shelf_position
        CASE inventory_record.status
          WHEN 'available'::inventory_status THEN 'disponivel'::stock_status
          WHEN 'loaned'::inventory_status THEN 'reservado'::stock_status
          WHEN 'sold'::inventory_status THEN 'vendido'::stock_status
          ELSE 'disponivel'::stock_status
        END,
        'estoque'::stock_location, -- localização padrão
        auth.uid() -- created_by
      )
      RETURNING id INTO new_stock_id;
      
      -- Vincular o inventory item ao stock item
      UPDATE inventory
      SET stock_item_id = new_stock_id,
          updated_at = now()
      WHERE id = inventory_record.id;
      
      migrated_count := migrated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      RAISE WARNING 'Erro ao migrar item %: %', inventory_record.imei, SQLERRM;
    END;
  END LOOP;
  
  -- Log da migração
  PERFORM log_audit_event(
    'inventory_stock_migration_completed',
    jsonb_build_object(
      'migrated_count', migrated_count,
      'failed_count', failed_count,
      'total_processed', migrated_count + failed_count
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'migrated_count', migrated_count,
    'failed_count', failed_count,
    'message', format('Migração concluída: %s itens vinculados, %s falharam', migrated_count, failed_count)
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION migrate_inventory_to_stock IS 
'Migra automaticamente items existentes do inventory para stock_items, criando vínculos bidirecionais';

-- 2. Função para verificar status da integração
CREATE OR REPLACE FUNCTION get_integration_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_inventory INTEGER;
  synced_items INTEGER;
  unsynced_items INTEGER;
  sync_rate NUMERIC;
  result jsonb;
BEGIN
  -- Total de items no inventory (não arquivados)
  SELECT COUNT(*) INTO total_inventory
  FROM inventory
  WHERE is_archived = false;
  
  -- Items sincronizados (com stock_item_id)
  SELECT COUNT(*) INTO synced_items
  FROM inventory
  WHERE stock_item_id IS NOT NULL AND is_archived = false;
  
  -- Items não sincronizados
  unsynced_items := total_inventory - synced_items;
  
  -- Taxa de sincronização
  IF total_inventory > 0 THEN
    sync_rate := ROUND((synced_items::NUMERIC / total_inventory::NUMERIC) * 100, 2);
  ELSE
    sync_rate := 0;
  END IF;
  
  result := jsonb_build_object(
    'total_inventory', total_inventory,
    'synced_items', synced_items,
    'unsynced_items', unsynced_items,
    'sync_rate', sync_rate,
    'last_check', now()
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_integration_stats IS 
'Retorna estatísticas sobre a integração entre inventory e stock_items';