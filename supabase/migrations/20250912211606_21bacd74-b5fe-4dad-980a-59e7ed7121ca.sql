-- Check if battery_pct column exists and add if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' 
        AND column_name = 'battery_pct'
    ) THEN
        ALTER TABLE public.inventory ADD COLUMN battery_pct integer 
        CONSTRAINT battery_pct_range CHECK (battery_pct >= 0 AND battery_pct <= 100);
    END IF;
END $$;

-- Ensure is_archived column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' 
        AND column_name = 'is_archived'
    ) THEN
        ALTER TABLE public.inventory ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
    END IF;
END $$;