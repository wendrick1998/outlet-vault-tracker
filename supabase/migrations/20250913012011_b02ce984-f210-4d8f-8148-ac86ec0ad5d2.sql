-- Add 'sold' value to loan_status enum
ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'sold';

-- Update the trigger function to handle sold status properly
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_loan_sold()
RETURNS TRIGGER AS $$
BEGIN
    -- If loan status is being changed to sold
    IF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status != 'sold' THEN
        UPDATE public.inventory SET status = 'sold' WHERE id = NEW.item_id;
        
        -- Set returned_at if not already set
        IF NEW.returned_at IS NULL THEN
            NEW.returned_at = now();
        END IF;
        
        -- Log the sale operation
        PERFORM log_audit_event(
            'loan_sold',
            jsonb_build_object(
                'loan_id', NEW.id,
                'item_id', NEW.item_id,
                'previous_status', OLD.status
            ),
            'loans',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_inventory_on_loan_sold ON public.loans;
CREATE TRIGGER update_inventory_on_loan_sold
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_status_on_loan_sold();