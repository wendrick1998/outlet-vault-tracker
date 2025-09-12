-- Phase F3: Basic Structure (minimal approach)

-- Create reason categories enum safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reason_category') THEN
        CREATE TYPE public.reason_category AS ENUM (
            'maintenance',      
            'loan',            
            'sale',            
            'warranty',        
            'demonstration',   
            'internal_use',    
            'transfer',        
            'return',          
            'disposal'         
        );
    END IF;
END $$;

-- Create reason priority enum safely  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reason_priority') THEN
        CREATE TYPE public.reason_priority AS ENUM (
            'low',
            'medium', 
            'high',
            'urgent'
        );
    END IF;
END $$;

-- Add columns to reasons table
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS category reason_category;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS priority reason_priority DEFAULT 'medium';
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER;
ALTER TABLE public.reasons ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false;