
-- ============================================================================
-- RECREATE LOAN-INVENTORY SYNCHRONIZATION SYSTEM
-- ============================================================================
-- This migration recreates the critical synchronization between loans and 
-- inventory tables to ensure status consistency across the system.
-- ============================================================================

-- 1. CREATE SYNCHRONIZATION FUNCTION
-- Maps loan status changes to inventory status automatically
CREATE OR REPLACE FUNCTION public.manage_loan_inventory_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_inventory_status inventory_status;
  v_old_status loan_status;
BEGIN
  -- Store old status for logging
  v_old_status := OLD.status;
  
  -- Map loan status to inventory status
  v_new_inventory_status := CASE NEW.status
    WHEN 'active'::loan_status THEN 'loaned'::inventory_status
    WHEN 'overdue'::loan_status THEN 'loaned'::inventory_status
    WHEN 'returned'::loan_status THEN 'available'::inventory_status
    WHEN 'sold'::loan_status THEN 'sold'::inventory_status
    ELSE 'available'::inventory_status
  END;
  
  -- Update inventory status if loan status changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.inventory
    SET 
      status = v_new_inventory_status,
      updated_at = NOW()
    WHERE id = NEW.item_id;
    
    -- Log the synchronization for audit trail
    PERFORM public.log_audit_event(
      'loan_inventory_sync',
      jsonb_build_object(
        'loan_id', NEW.id,
        'item_id', NEW.item_id,
        'old_loan_status', v_old_status,
        'new_loan_status', NEW.status,
        'new_inventory_status', v_new_inventory_status,
        'timestamp', NOW()
      ),
      'loans',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.manage_loan_inventory_status() IS 
'Automatically synchronizes inventory status when loan status changes. Maps: active/overdue→loaned, returned→available, sold→sold';

-- 2. CREATE TRIGGER ON LOANS TABLE
DROP TRIGGER IF EXISTS manage_loan_inventory_status_trigger ON public.loans;

CREATE TRIGGER manage_loan_inventory_status_trigger
  AFTER UPDATE OF status ON public.loans
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.manage_loan_inventory_status();

COMMENT ON TRIGGER manage_loan_inventory_status_trigger ON public.loans IS 
'Ensures inventory status stays synchronized with loan status changes';

-- 3. CREATE MONITORING VIEW FOR INCONSISTENCIES
CREATE OR REPLACE VIEW public.loan_inventory_inconsistencies AS
SELECT 
  l.id as loan_id,
  l.status as loan_status,
  i.id as inventory_id,
  i.status as inventory_status,
  i.imei,
  l.updated_at as loan_updated,
  i.updated_at as inventory_updated,
  CASE 
    WHEN l.status IN ('active', 'overdue') AND i.status != 'loaned' THEN 'MISMATCH: Active loan but not loaned'
    WHEN l.status = 'returned' AND i.status != 'available' THEN 'MISMATCH: Returned loan but not available'
    WHEN l.status = 'sold' AND i.status != 'sold' THEN 'MISMATCH: Sold loan but not sold'
    ELSE 'UNKNOWN MISMATCH'
  END as issue_description
FROM public.loans l
JOIN public.inventory i ON l.item_id = i.id
WHERE 
  (l.status IN ('active', 'overdue') AND i.status != 'loaned')
  OR (l.status = 'returned' AND i.status != 'available')
  OR (l.status = 'sold' AND i.status != 'sold');

COMMENT ON VIEW public.loan_inventory_inconsistencies IS 
'Monitors and reports any status mismatches between loans and inventory for admin review';

-- 4. GRANT PERMISSIONS
GRANT SELECT ON public.loan_inventory_inconsistencies TO authenticated;

-- 5. LOG COMPLETION
DO $$
BEGIN
  PERFORM public.log_audit_event(
    'loan_inventory_sync_recreated',
    jsonb_build_object(
      'trigger_created', 'manage_loan_inventory_status_trigger',
      'function_created', 'manage_loan_inventory_status',
      'monitoring_view', 'loan_inventory_inconsistencies',
      'timestamp', NOW()
    )
  );
END $$;
