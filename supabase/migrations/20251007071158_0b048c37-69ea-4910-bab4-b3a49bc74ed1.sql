-- ============================================
-- FASE 2: CORREÇÃO DE INCONSISTÊNCIAS
-- ============================================

-- PASSO 1: Identificar e corrigir loans inconsistentes
WITH inconsistent_loans AS (
  SELECT 
    l.id as loan_id,
    l.status as loan_status,
    l.item_id,
    i.status as inventory_status,
    i.imei
  FROM public.loans l
  JOIN public.inventory i ON i.id = l.item_id
  WHERE 
    (l.status = 'active' AND i.status != 'loaned')
    OR (l.status = 'returned' AND i.status != 'available')
    OR (l.status = 'sold' AND i.status != 'sold')
)
UPDATE public.inventory i
SET status = CASE 
  WHEN (SELECT loan_status FROM inconsistent_loans WHERE item_id = i.id) = 'active' THEN 'loaned'::inventory_status
  WHEN (SELECT loan_status FROM inconsistent_loans WHERE item_id = i.id) = 'returned' THEN 'available'::inventory_status
  WHEN (SELECT loan_status FROM inconsistent_loans WHERE item_id = i.id) = 'sold' THEN 'sold'::inventory_status
  ELSE i.status
END,
updated_at = now()
WHERE i.id IN (SELECT item_id FROM inconsistent_loans);

-- PASSO 2: Verificar trigger manage_loan_inventory_status
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'loans' AND t.tgname = 'manage_loan_inventory_status';

-- PASSO 3: Log da correção
SELECT public.log_audit_event(
  'loan_inventory_sync_corrected',
  jsonb_build_object(
    'corrected_count', (
      SELECT COUNT(*) 
      FROM public.loans l
      JOIN public.inventory i ON i.id = l.item_id
      WHERE (l.status = 'active' AND i.status = 'loaned')
         OR (l.status = 'returned' AND i.status = 'available')
         OR (l.status = 'sold' AND i.status = 'sold')
    ),
    'timestamp', now()
  )
);