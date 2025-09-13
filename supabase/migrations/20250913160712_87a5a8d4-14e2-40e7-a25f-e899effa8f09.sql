-- Adicionar campo updated_at à tabela reasons se não existir
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reasons' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.reasons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Garantir que o motivo "Demonstração" existe e está correto
INSERT INTO public.reasons (name, requires_customer, is_active)
VALUES ('Demonstração', false, true)
ON CONFLICT (name) DO UPDATE SET
  requires_customer = false,
  is_active = true;