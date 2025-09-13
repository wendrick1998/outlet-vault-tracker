-- Create or replace the trigger function for handling sold loans
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_inventory_on_loan_sold ON public.loans;
CREATE TRIGGER update_inventory_on_loan_sold
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_status_on_loan_sold();