-- ============================================
-- ETAPA 1: FUNDAÇÃO - BANCO DE DADOS E RPC
-- ============================================

-- 1.1 Criar tabela supplier_batches
CREATE TABLE IF NOT EXISTS public.supplier_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  warranty_months INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_cost NUMERIC(10,2),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- RLS Policies para supplier_batches
ALTER TABLE public.supplier_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage batches"
  ON public.supplier_batches FOR ALL
  USING (public.get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Users can view their own batches"
  ON public.supplier_batches FOR SELECT
  USING (created_by = auth.uid() OR public.get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'manager'::app_role]));

-- 1.2 Adicionar batch_id às tabelas existentes
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.supplier_batches(id);
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.supplier_batches(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_batch_id ON public.inventory(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_batch_id ON public.stock_items(batch_id);

-- 1.3 Atualizar RPC create_linked_item
CREATE OR REPLACE FUNCTION public.create_linked_item(
  p_imei TEXT,
  p_model TEXT,
  p_brand TEXT,
  p_color TEXT DEFAULT NULL,
  p_storage TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT 'novo',
  p_battery_pct INTEGER DEFAULT 100,
  p_price NUMERIC DEFAULT NULL,
  p_cost NUMERIC DEFAULT NULL,
  p_location stock_location DEFAULT 'estoque',
  p_notes TEXT DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_supplier_name TEXT DEFAULT NULL
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_id UUID;
  v_inventory_id UUID;
BEGIN
  -- Validação de permissões
  IF public.get_user_role(auth.uid()) NOT IN ('admin'::app_role, 'manager'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;
  
  -- Validação de IMEI duplicado
  IF EXISTS (
    SELECT 1 FROM public.unified_inventory 
    WHERE imei = p_imei AND (stock_id IS NOT NULL OR inventory_id IS NOT NULL)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'IMEI já cadastrado no sistema',
      'duplicate', true,
      'imei', p_imei
    );
  END IF;

  -- Criar no stock_items
  INSERT INTO public.stock_items (
    imei, model, brand, color, storage, condition,
    battery_pct, price, cost, location, notes,
    status, created_by, batch_id
  ) VALUES (
    p_imei, p_model, p_brand, p_color, p_storage, p_condition,
    p_battery_pct, p_price, p_cost, p_location, p_notes,
    'disponivel', auth.uid(), p_batch_id
  ) RETURNING id INTO v_stock_id;

  -- Criar no inventory (vinculado)
  INSERT INTO public.inventory (
    imei, model, brand, color, storage, condition,
    battery_pct, notes, status, stock_item_id, batch_id
  ) VALUES (
    p_imei, p_model, p_brand, p_color, p_storage, p_condition,
    p_battery_pct, p_notes, 'available', v_stock_id, p_batch_id
  ) RETURNING id INTO v_inventory_id;

  -- Atualizar vinculação bidirecional
  UPDATE public.stock_items SET inventory_id = v_inventory_id WHERE id = v_stock_id;

  -- Log de auditoria
  PERFORM public.log_audit_event(
    'linked_item_created',
    jsonb_build_object(
      'stock_id', v_stock_id,
      'inventory_id', v_inventory_id,
      'batch_id', p_batch_id,
      'supplier', p_supplier_name,
      'imei', p_imei,
      'model', p_model
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'stock_id', v_stock_id,
    'inventory_id', v_inventory_id,
    'message', 'Aparelho criado e sincronizado com sucesso'
  );
END;
$$;