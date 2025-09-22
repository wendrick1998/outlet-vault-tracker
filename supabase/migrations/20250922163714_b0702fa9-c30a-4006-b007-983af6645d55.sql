-- PACOTE 1 - CRÍTICO: Correções de segurança e duplicidade

-- 1) Prevenir múltiplas saídas ativas por item
CREATE UNIQUE INDEX IF NOT EXISTS ux_loans_one_active
  ON public.loans(item_id) WHERE status IN ('active','overdue');

-- 2) Trigger para bloquear empréstimos duplicados
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_prevent_duplicate_loan ON public.loans;
CREATE TRIGGER trg_prevent_duplicate_loan
  BEFORE INSERT OR UPDATE OF status ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_active_loan();

-- 3) Coluna normalizada para inventory_audit_scans (anti-duplicata)
ALTER TABLE public.inventory_audit_scans
  ADD COLUMN IF NOT EXISTS code_normalized text
  GENERATED ALWAYS AS (lower(trim(coalesce(imei, serial, raw_code)))) STORED;

-- 4) Índice único por sessão + código normalizado
CREATE UNIQUE INDEX IF NOT EXISTS ux_audit_scans_session_code
  ON public.inventory_audit_scans(audit_id, code_normalized);

-- 5) Corrigir CHECK constraint para aceitar 'not_found'
ALTER TABLE public.inventory_audit_scans
  DROP CONSTRAINT IF EXISTS inventory_audit_scans_scan_result_check;
ALTER TABLE public.inventory_audit_scans
  ADD CONSTRAINT inventory_audit_scans_scan_result_check
  CHECK (scan_result IN ('found_expected','unexpected_present','duplicate','status_incongruent','not_found'));

-- 6) IMEI normalizado para prevenir duplicidade invisível
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS imei_normalized text 
  GENERATED ALWAYS AS (lower(trim(imei))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_imei_normalized 
  ON public.inventory(imei_normalized);

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS imei_normalized text 
  GENERATED ALWAYS AS (lower(trim(imei))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS ux_stock_items_imei_normalized 
  ON public.stock_items(imei_normalized);

-- 7) Função para auto-gerar itens faltantes ao finalizar sessão
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_auto_missing ON public.inventory_audits;
CREATE TRIGGER trg_auto_missing
  AFTER UPDATE ON public.inventory_audits
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_missing_items();

-- 8) RLS para bloquear updates em itens vendidos
DROP POLICY IF EXISTS prevent_updates_sold_inventory ON public.inventory;
CREATE POLICY prevent_updates_sold_inventory ON public.inventory
  FOR UPDATE USING (status <> 'sold');

DROP POLICY IF EXISTS prevent_updates_sold_stock ON public.stock_items;
CREATE POLICY prevent_updates_sold_stock ON public.stock_items
  FOR UPDATE USING (status <> 'vendido');