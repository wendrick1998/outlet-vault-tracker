-- ========================================
-- FASE 1: CORREÇÕES SQL CRÍTICAS (P0)
-- ========================================

-- 1.1. Corrigir migrate_inventory_to_stock() para incluir UPDATE do stock_item_id
CREATE OR REPLACE FUNCTION public.migrate_inventory_to_stock()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        status, location, created_by, inventory_id
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
        'estoque'::stock_location,
        auth.uid(),
        inventory_record.id  -- Vincular bidirecional: stock -> inventory
      )
      RETURNING id INTO new_stock_id;
      
      -- 🔥 CORREÇÃO CRÍTICA: Vincular bidirecional inventory -> stock
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
$function$;

-- 1.2. Executar migração manual dos itens desvinculados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Vincular bidirecional para itens que já têm stock_items.inventory_id
  UPDATE inventory i
  SET stock_item_id = s.id,
      updated_at = now()
  FROM stock_items s
  WHERE s.inventory_id = i.id
  AND i.stock_item_id IS NULL
  AND i.is_archived = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Vinculação bidirecional concluída: % itens atualizados', updated_count;
END $$;

-- 1.3. Corrigir get_integration_stats() para contar vinculações bidirecionais
CREATE OR REPLACE FUNCTION public.get_integration_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Items sincronizados (vinculação bidirecional válida)
  SELECT COUNT(*) INTO synced_items
  FROM inventory i
  WHERE i.stock_item_id IS NOT NULL 
  AND i.is_archived = false
  AND EXISTS(
    SELECT 1 FROM stock_items s 
    WHERE s.id = i.stock_item_id 
    AND s.inventory_id = i.id
  );
  
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
$function$;

-- Script de validação (comentado para referência)
-- SELECT 
--   (SELECT COUNT(*) FROM inventory WHERE stock_item_id IS NOT NULL AND is_archived = false) as inv_synced,
--   (SELECT COUNT(*) FROM stock_items WHERE inventory_id IS NOT NULL) as stock_synced,
--   (SELECT COUNT(*) FROM inventory i 
--    JOIN stock_items s ON i.stock_item_id = s.id AND s.inventory_id = i.id 
--    WHERE i.is_archived = false) as bidirectional_synced;