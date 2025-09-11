-- =============================================
-- SECURITY FIX: Update functions with secure search_path
-- =============================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_inventory_status_on_loan_change function  
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_loan_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If loan is being created as active
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.inventory SET status = 'loaned' WHERE id = NEW.item_id;
    END IF;
    
    -- If loan status is being changed to returned
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = NEW.item_id;
        NEW.returned_at = now();
    END IF;
    
    -- If loan is being deleted (return item to available)
    IF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;