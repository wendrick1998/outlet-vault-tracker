-- Add slug column to device_models for idempotent upserts
ALTER TABLE public.device_models 
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS device_models_slug_idx ON public.device_models(slug);

-- Update existing records to have slugs
UPDATE public.device_models 
SET slug = lower(trim(brand)) || '-' || lower(regexp_replace(trim(model), '[^a-zA-Z0-9]', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after updating existing records
ALTER TABLE public.device_models 
ALTER COLUMN slug SET NOT NULL;

-- Add seed metadata columns for tracking Apple catalog imports
ALTER TABLE public.device_models 
ADD COLUMN IF NOT EXISTS seed_source text,
ADD COLUMN IF NOT EXISTS seed_version text;