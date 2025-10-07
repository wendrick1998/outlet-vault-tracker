-- ============================================
-- INTEGRAÇÃO: Inventory <-> Stock Items
-- ============================================

-- 1. Adicionar coluna de relacionamento na tabela inventory
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS stock_item_id uuid REFERENCES public.stock_items(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_inventory_stock_item_id ON public.inventory(stock_item_id);

-- 3. Criar trigger para sincronizar status: inventory -> stock_items
CREATE OR REPLACE FUNCTION public.sync_inventory_to_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o item de inventário está vinculado a um item de estoque
  IF NEW.stock_item_id IS NOT NULL THEN
    -- Sincronizar status baseado no status do inventário
    UPDATE public.stock_items
    SET 
      status = CASE NEW.status
        WHEN 'available'::inventory_status THEN 'disponivel'::stock_status
        WHEN 'loaned'::inventory_status THEN 'reservado'::stock_status
        WHEN 'sold'::inventory_status THEN 'vendido'::stock_status
        ELSE status -- mantém status atual se não houver mapeamento direto
      END,
      updated_at = now()
    WHERE id = NEW.stock_item_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger para sincronizar status: stock_items -> inventory
CREATE OR REPLACE FUNCTION public.sync_stock_to_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar todos os itens de inventário vinculados a este item de estoque
  UPDATE public.inventory
  SET 
    status = CASE NEW.status
      WHEN 'disponivel'::stock_status THEN 'available'::inventory_status
      WHEN 'reservado'::stock_status THEN 'loaned'::inventory_status
      WHEN 'vendido'::stock_status THEN 'sold'::inventory_status
      ELSE status -- mantém status atual se não houver mapeamento direto
    END,
    updated_at = now()
  WHERE stock_item_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 5. Ativar triggers
DROP TRIGGER IF EXISTS trigger_sync_inventory_to_stock ON public.inventory;
CREATE TRIGGER trigger_sync_inventory_to_stock
  AFTER UPDATE OF status ON public.inventory
  FOR EACH ROW
  WHEN (NEW.stock_item_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_inventory_to_stock();

DROP TRIGGER IF EXISTS trigger_sync_stock_to_inventory ON public.stock_items;
CREATE TRIGGER trigger_sync_stock_to_inventory
  AFTER UPDATE OF status ON public.stock_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_stock_to_inventory();

-- 6. Criar view unificada para facilitar consultas
CREATE OR REPLACE VIEW public.unified_inventory AS
SELECT 
  -- Identificação
  i.id as inventory_id,
  s.id as stock_id,
  COALESCE(s.imei, i.imei) as imei,
  COALESCE(s.model, i.model) as model,
  COALESCE(s.brand, i.brand) as brand,
  COALESCE(s.color, i.color) as color,
  COALESCE(s.storage, i.storage) as storage,
  COALESCE(s.condition, i.condition) as condition,
  
  -- Status
  i.status as inventory_status,
  s.status as stock_status,
  
  -- Financeiro (só stock tem)
  s.price,
  s.cost,
  
  -- Localização (só stock tem)
  s.location,
  s.shelf_position,
  
  -- Bateria
  COALESCE(s.battery_pct, i.battery_pct) as battery_pct,
  
  -- Notas
  COALESCE(s.notes, i.notes) as notes,
  
  -- Metadados
  CASE 
    WHEN s.id IS NOT NULL THEN 'stock'
    ELSE 'inventory_only'
  END as source,
  
  i.created_at as inventory_created_at,
  s.created_at as stock_created_at,
  i.updated_at as inventory_updated_at,
  s.updated_at as stock_updated_at
  
FROM public.inventory i
LEFT JOIN public.stock_items s ON i.stock_item_id = s.id
WHERE i.is_archived = false;

-- 7. Garantir RLS na view
ALTER VIEW public.unified_inventory SET (security_invoker = true);

-- 8. Função helper para criar item vinculado
CREATE OR REPLACE FUNCTION public.create_linked_item(
  p_imei text,
  p_model text,
  p_brand text,
  p_color text DEFAULT NULL,
  p_storage text DEFAULT NULL,
  p_condition text DEFAULT 'novo',
  p_battery_pct integer DEFAULT 100,
  p_price numeric DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_location stock_location DEFAULT 'estoque',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stock_id uuid;
  v_inventory_id uuid;
  result jsonb;
BEGIN
  -- Verificar permissão
  IF get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;
  
  -- 1. Criar item no estoque
  INSERT INTO public.stock_items (
    imei, model, brand, color, storage, condition,
    battery_pct, price, cost, location, notes,
    status, created_by
  ) VALUES (
    p_imei, p_model, p_brand, p_color, p_storage, p_condition,
    p_battery_pct, p_price, p_cost, p_location, p_notes,
    'disponivel'::stock_status, auth.uid()
  )
  RETURNING id INTO v_stock_id;
  
  -- 2. Criar item vinculado no inventário
  INSERT INTO public.inventory (
    imei, model, brand, color, storage, condition,
    battery_pct, notes, status, stock_item_id
  ) VALUES (
    p_imei, p_model, p_brand, p_color, p_storage, p_condition,
    p_battery_pct, p_notes, 'available'::inventory_status, v_stock_id
  )
  RETURNING id INTO v_inventory_id;
  
  -- 3. Log da criação
  PERFORM log_audit_event(
    'linked_item_created',
    jsonb_build_object(
      'stock_id', v_stock_id,
      'inventory_id', v_inventory_id,
      'imei', p_imei,
      'model', p_model
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'stock_id', v_stock_id,
    'inventory_id', v_inventory_id,
    'message', 'Item criado e vinculado com sucesso'
  );
  
  RETURN result;
END;
$$;

-- 9. Comentários para documentação
COMMENT ON COLUMN public.inventory.stock_item_id IS 'Vincula item do inventário (empréstimos) com item do estoque (vendas). NULL = item exclusivo do inventário.';
COMMENT ON FUNCTION public.sync_inventory_to_stock() IS 'Sincroniza automaticamente mudanças de status do inventário para o estoque.';
COMMENT ON FUNCTION public.sync_stock_to_inventory() IS 'Sincroniza automaticamente mudanças de status do estoque para o inventário.';
COMMENT ON VIEW public.unified_inventory IS 'View unificada mostrando itens de ambos os sistemas (inventory + stock).';
COMMENT ON FUNCTION public.create_linked_item IS 'Helper para criar item vinculado em ambos os sistemas simultaneamente.';