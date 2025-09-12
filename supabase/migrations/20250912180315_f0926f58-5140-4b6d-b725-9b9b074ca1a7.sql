-- Complete cleanup of test data
-- This will delete ALL inventory, loans, and related test data

-- 1. Delete all loans first (this will automatically update inventory status via triggers)
DELETE FROM public.loans;

-- 2. Delete all item notes
DELETE FROM public.item_notes;

-- 3. Delete all inventory items
DELETE FROM public.inventory;

-- 4. Clean up audit logs related to inventory/loans operations (optional - keeps system logs clean)
DELETE FROM public.audit_logs 
WHERE action IN ('inventory_created', 'inventory_updated', 'loan_created', 'loan_updated', 'loan_returned', 'item_note_created')
   OR table_name IN ('inventory', 'loans', 'item_notes');

-- Reset any sequences or counters if needed
-- The system will now show 0 items, 0 loans, and be ready for real inventory