-- ==========================================
-- FASE 1: CORREÇÕES CRÍTICAS DO SISTEMA DE CONFERÊNCIA
-- ==========================================

-- 1.1: Dropar e recriar trigger update_audit_counters com logging detalhado
DROP TRIGGER IF EXISTS trigger_update_audit_counts ON public.inventory_audit_scans CASCADE;
DROP FUNCTION IF EXISTS public.update_audit_counters() CASCADE;

CREATE OR REPLACE FUNCTION public.update_audit_counters()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'TRIGGER FIRED: audit_id=%, scan_result=%', NEW.audit_id, NEW.scan_result;
  
  UPDATE public.inventory_audits
  SET
    found_count = CASE WHEN NEW.scan_result = 'found_expected' THEN found_count + 1 ELSE found_count END,
    unexpected_count = CASE WHEN NEW.scan_result = 'unexpected_present' THEN unexpected_count + 1 ELSE unexpected_count END,
    duplicate_count = CASE WHEN NEW.scan_result = 'duplicate' THEN duplicate_count + 1 ELSE duplicate_count END,
    incongruent_count = CASE WHEN NEW.scan_result = 'status_incongruent' THEN incongruent_count + 1 ELSE incongruent_count END,
    updated_at = NOW()
  WHERE id = NEW.audit_id;
  
  RAISE NOTICE 'UPDATED: Rows affected for audit_id=%', NEW.audit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_update_audit_counts
  AFTER INSERT ON public.inventory_audit_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_counters();

-- 1.2: Adicionar índice para performance (apenas em tabelas, não em views)
CREATE INDEX IF NOT EXISTS idx_audit_scans_audit_id_result 
  ON public.inventory_audit_scans(audit_id, scan_result);

-- 1.3: Adicionar constraint de validação para location_found
ALTER TABLE public.inventory_audit_scans
  DROP CONSTRAINT IF EXISTS valid_location_found;

ALTER TABLE public.inventory_audit_scans
  ADD CONSTRAINT valid_location_found
  CHECK (
    location_found IS NULL OR 
    location_found IN ('estoque', 'vitrine', 'assistencia', 'deposito', 'loja_online', 'conserto')
  );

-- 1.4: Melhorar trigger auto_generate_missing_items com logging
DROP TRIGGER IF EXISTS trigger_auto_generate_missing ON public.inventory_audits CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_missing_items() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_generate_missing_items()
RETURNS TRIGGER AS $$
DECLARE
  items_to_insert INTEGER;
  missing_inserted INTEGER;
BEGIN
  -- Apenas executar quando mudar para completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    RAISE NOTICE 'AUTO_GENERATE_MISSING: Iniciando para audit_id=%, location_expected=%', NEW.id, NEW.location_expected;
    
    -- Contar quantos itens deveriam ser inseridos
    SELECT COUNT(*) INTO items_to_insert
    FROM (
      SELECT COALESCE(i.id, s.id) as item_id
      FROM public.inventory i
      FULL OUTER JOIN public.stock_items s ON i.stock_item_id = s.id
      WHERE 
        (NEW.location_expected IS NULL OR COALESCE(s.location::text, 'estoque') = NEW.location_expected::text)
        AND COALESCE(s.location::text, 'estoque') IS NOT NULL
        AND (s.status IS NULL OR s.status != 'vendido')
        AND (i.status IS NULL OR i.status != 'sold')
        AND COALESCE(i.id, s.id) NOT IN (
          SELECT DISTINCT scan.item_id
          FROM public.inventory_audit_scans scan
          WHERE scan.audit_id = NEW.id
            AND scan.scan_result = 'found_expected'
            AND scan.item_id IS NOT NULL
        )
    ) sub;
    
    RAISE NOTICE 'AUTO_GENERATE_MISSING: Items faltantes encontrados=%', items_to_insert;
    
    -- Inserir se houver itens
    IF items_to_insert > 0 THEN
      INSERT INTO public.inventory_audit_missing (audit_id, item_id, reason)
      SELECT 
        NEW.id,
        item_id,
        'not_scanned' as reason
      FROM (
        SELECT COALESCE(i.id, s.id) as item_id
        FROM public.inventory i
        FULL OUTER JOIN public.stock_items s ON i.stock_item_id = s.id
        WHERE 
          (NEW.location_expected IS NULL OR COALESCE(s.location::text, 'estoque') = NEW.location_expected::text)
          AND COALESCE(s.location::text, 'estoque') IS NOT NULL
          AND (s.status IS NULL OR s.status != 'vendido')
          AND (i.status IS NULL OR i.status != 'sold')
          AND COALESCE(i.id, s.id) NOT IN (
            SELECT DISTINCT scan.item_id
            FROM public.inventory_audit_scans scan
            WHERE scan.audit_id = NEW.id
              AND scan.scan_result = 'found_expected'
              AND scan.item_id IS NOT NULL
          )
      ) sub
      ON CONFLICT (audit_id, item_id) DO NOTHING;
      
      GET DIAGNOSTICS missing_inserted = ROW_COUNT;
      RAISE NOTICE 'AUTO_GENERATE_MISSING: Inserted % missing items', missing_inserted;
      
      -- Atualizar contador
      UPDATE public.inventory_audits
      SET missing_count = (
        SELECT COUNT(*)
        FROM public.inventory_audit_missing
        WHERE audit_id = NEW.id
      )
      WHERE id = NEW.id;
      
      RAISE NOTICE 'AUTO_GENERATE_MISSING: Missing count atualizado para %', 
        (SELECT missing_count FROM public.inventory_audits WHERE id = NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_auto_generate_missing
  AFTER UPDATE ON public.inventory_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_missing_items();

-- Log da migração
DO $$
BEGIN
  PERFORM public.log_audit_event(
    'conference_system_phase1_deployed',
    jsonb_build_object(
      'triggers_recreated', true,
      'indexes_added', true,
      'constraints_added', true,
      'logging_enabled', true
    )
  );
END $$;