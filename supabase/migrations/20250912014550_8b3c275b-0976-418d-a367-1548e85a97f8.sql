-- Fix security issues found by linter

-- 1. Fix function search path mutable - Add SET search_path to functions that don't have it
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_loan_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Create trigger for the function if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_inventory_status_on_loan_change') THEN
        CREATE TRIGGER trigger_update_inventory_status_on_loan_change
        AFTER INSERT OR UPDATE OR DELETE ON public.loans
        FOR EACH ROW EXECUTE FUNCTION public.update_inventory_status_on_loan_change();
    END IF;
END $$;

-- Create trigger for profiles audit if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audit_profile_changes') THEN
        CREATE TRIGGER trigger_audit_profile_changes
        AFTER UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.audit_profile_changes();
    END IF;
END $$;

-- Create trigger for updated_at timestamps on all tables if they don't exist
DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY['inventory', 'loans', 'customers', 'sellers', 'profiles', 'reasons', 'item_notes'];
BEGIN
    FOREACH t IN ARRAY tables 
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = format('trigger_update_%s_updated_at', t)) THEN
            EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
        END IF;
    END LOOP;
END $$;