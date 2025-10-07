-- CORREÇÃO CRÍTICA: Atualizar migrate_inventory_to_stock para vincular corretamente
DROP FUNCTION IF EXISTS public.migrate_inventory_to_stock();

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
      
      -- 🔥 CORREÇÃO CRÍTICA: Vincular o inventory item ao stock item
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