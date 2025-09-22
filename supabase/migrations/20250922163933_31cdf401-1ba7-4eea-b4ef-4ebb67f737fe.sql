-- Corrigir search_path das funções para segurança

-- 1) Corrigir função prevent_duplicate_active_loan
CREATE OR REPLACE FUNCTION public.prevent_duplicate_active_loan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active','overdue') AND EXISTS (
    SELECT 1 FROM public.loans
    WHERE item_id = NEW.item_id AND status IN ('active','overdue')
      AND (TG_OP='INSERT' OR id <> NEW.id)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_LOAN: Item já possui empréstimo ativo'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2) Corrigir função auto_generate_missing_items  
CREATE OR REPLACE FUNCTION public.auto_generate_missing_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    INSERT INTO public.inventory_audit_missing (audit_id, item_id, reason)
    SELECT NEW.id, i.id, 'not_scanned'
    FROM public.inventory i
    WHERE i.status = 'available'
      AND i.id NOT IN (
        SELECT DISTINCT s.item_id
        FROM public.inventory_audit_scans s
        WHERE s.audit_id = NEW.id
          AND s.scan_result = 'found_expected'
          AND s.item_id IS NOT NULL
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';