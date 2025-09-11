-- =============================================
-- FINAL SECURITY FIX: Update get_system_stats function
-- =============================================

-- Fix get_system_stats function with secure search_path
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON AS $$
DECLARE
    total_items INTEGER;
    available_items INTEGER;
    loaned_items INTEGER;
    active_loans INTEGER;
    overdue_loans INTEGER;
    total_customers INTEGER;
    registered_customers INTEGER;
    total_sellers INTEGER;
    active_sellers INTEGER;
    avg_loan_duration INTERVAL;
BEGIN
    -- Get inventory stats
    SELECT COUNT(*) INTO total_items FROM public.inventory;
    SELECT COUNT(*) INTO available_items FROM public.inventory WHERE status = 'available';
    SELECT COUNT(*) INTO loaned_items FROM public.inventory WHERE status = 'loaned';
    
    -- Get loan stats
    SELECT COUNT(*) INTO active_loans FROM public.loans WHERE status = 'active';
    SELECT COUNT(*) INTO overdue_loans FROM public.loans WHERE status = 'active' AND due_at < now();
    
    -- Get customer stats
    SELECT COUNT(*) INTO total_customers FROM public.customers;
    SELECT COUNT(*) INTO registered_customers FROM public.customers WHERE is_registered = true;
    
    -- Get seller stats
    SELECT COUNT(*) INTO total_sellers FROM public.sellers;
    SELECT COUNT(*) INTO active_sellers FROM public.sellers WHERE is_active = true;
    
    -- Get average loan duration
    SELECT AVG(COALESCE(returned_at, now()) - issued_at) INTO avg_loan_duration 
    FROM public.loans WHERE status IN ('active', 'returned');
    
    RETURN json_build_object(
        'inventory', json_build_object(
            'total', total_items,
            'available', available_items,
            'loaned', loaned_items,
            'utilizationRate', CASE WHEN total_items > 0 THEN ROUND((loaned_items::DECIMAL / total_items::DECIMAL) * 100, 1) ELSE 0 END
        ),
        'loans', json_build_object(
            'active', active_loans,
            'overdue', overdue_loans,
            'overdueRate', CASE WHEN active_loans > 0 THEN ROUND((overdue_loans::DECIMAL / active_loans::DECIMAL) * 100, 1) ELSE 0 END,
            'avgDurationDays', CASE WHEN avg_loan_duration IS NOT NULL THEN EXTRACT(DAYS FROM avg_loan_duration) ELSE 0 END
        ),
        'customers', json_build_object(
            'total', total_customers,
            'registered', registered_customers,
            'registrationRate', CASE WHEN total_customers > 0 THEN ROUND((registered_customers::DECIMAL / total_customers::DECIMAL) * 100, 1) ELSE 0 END
        ),
        'sellers', json_build_object(
            'total', total_sellers,
            'active', active_sellers
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;