-- ============================================
-- FASE 1 & 2: Correção de Triggers Críticos (FIX v2)
-- ============================================

-- 1. Recriar trigger para atualizar contadores de conferência
DROP TRIGGER IF EXISTS trigger_update_audit_counts ON public.inventory_audit_scans CASCADE;
DROP FUNCTION IF EXISTS public.update_audit_counters() CASCADE;

CREATE OR REPLACE FUNCTION public.update_audit_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log de debug
  RAISE LOG 'Atualizando contadores para audit_id: %, scan_result: %', NEW.audit_id, NEW.scan_result;
  
  -- Atualizar contadores baseado no tipo de scan
  UPDATE inventory_audits
  SET
    found_count = CASE 
      WHEN NEW.scan_result = 'found_expected' THEN found_count + 1
      ELSE found_count
    END,
    unexpected_count = CASE 
      WHEN NEW.scan_result = 'unexpected_present' THEN unexpected_count + 1
      ELSE unexpected_count
    END,
    duplicate_count = CASE 
      WHEN NEW.scan_result = 'duplicate' THEN duplicate_count + 1
      ELSE duplicate_count
    END,
    incongruent_count = CASE 
      WHEN NEW.scan_result = 'status_incongruent' THEN incongruent_count + 1
      ELSE incongruent_count
    END,
    updated_at = NOW()
  WHERE id = NEW.audit_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_audit_counts
AFTER INSERT ON public.inventory_audit_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_audit_counters();

-- 2. Recriar trigger para geração automática de itens faltantes
DROP TRIGGER IF EXISTS trigger_auto_generate_missing ON public.inventory_audits CASCADE;
DROP TRIGGER IF EXISTS trg_auto_missing ON public.inventory_audits CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_missing_items() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_generate_missing_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas executar quando mudar para completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    RAISE LOG 'Gerando itens faltantes para audit_id: %', NEW.id;
    
    -- Inserir itens faltantes baseado no snapshot vs scans
    INSERT INTO public.inventory_audit_missing (audit_id, item_id, reason)
    SELECT 
      NEW.id,
      COALESCE(ui.inventory_id, ui.stock_id) as item_id,
      'not_scanned' as reason
    FROM public.unified_inventory ui
    WHERE 
      -- Filtrar por localização esperada se existir
      (NEW.location_expected IS NULL OR ui.location = NEW.location_expected)
      -- Excluir itens vendidos
      AND (ui.stock_status IS NULL OR ui.stock_status != 'vendido')
      AND (ui.inventory_status IS NULL OR ui.inventory_status != 'sold')
      -- Excluir itens que foram encontrados
      AND COALESCE(ui.inventory_id, ui.stock_id) NOT IN (
        SELECT DISTINCT s.item_id
        FROM public.inventory_audit_scans s
        WHERE s.audit_id = NEW.id
          AND s.scan_result = 'found_expected'
          AND s.item_id IS NOT NULL
      )
    ON CONFLICT (audit_id, item_id) DO NOTHING;
    
    -- Atualizar missing_count
    UPDATE public.inventory_audits
    SET missing_count = (
      SELECT COUNT(*)
      FROM public.inventory_audit_missing
      WHERE audit_id = NEW.id
    )
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_missing
AFTER UPDATE ON public.inventory_audits
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_missing_items();

-- 3. Adicionar índices para performance (apenas em tabelas, não views)
CREATE INDEX IF NOT EXISTS idx_inventory_audit_scans_audit_id_result 
ON public.inventory_audit_scans(audit_id, scan_result);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_missing_audit_id 
ON public.inventory_audit_missing(audit_id);

CREATE INDEX IF NOT EXISTS idx_stock_items_location 
ON public.stock_items(location) 
WHERE location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_status 
ON public.inventory(status) 
WHERE status IS NOT NULL;