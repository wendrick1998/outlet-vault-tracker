-- Add 'sold' status to loan_status enum
ALTER TYPE loan_status ADD VALUE 'sold';

-- Add 'sold' status to inventory_status enum if not exists
ALTER TYPE inventory_status ADD VALUE 'sold';

-- Create trigger to update inventory status when loan is sold
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

-- Create trigger for loan sold status
CREATE TRIGGER update_inventory_on_loan_sold
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_status_on_loan_sold();