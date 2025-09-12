-- Add is_archived column to inventory table for soft delete functionality
ALTER TABLE public.inventory 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for performance on archived items
CREATE INDEX idx_inventory_archived ON public.inventory(is_archived);

-- Create index for non-archived items (most common query)
CREATE INDEX idx_inventory_active ON public.inventory(is_archived) WHERE is_archived = FALSE;