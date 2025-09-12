-- Adicionar constraint única para IMEI na tabela inventory
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_imei_unique UNIQUE (imei);

-- Criar índice para performance em consultas IMEI
CREATE INDEX IF NOT EXISTS idx_inventory_imei ON public.inventory(imei);

-- Adicionar campos para auditoria de importação
ALTER TABLE public.inventory 
ADD COLUMN import_batch_id TEXT,
ADD COLUMN import_confidence DECIMAL(3,2),
ADD COLUMN title_original TEXT;