-- Inserir motivo "Demonstração" se não existir
INSERT INTO public.reasons (name, requires_customer, is_active)
VALUES ('Demonstração', false, true)
ON CONFLICT (name) DO NOTHING;

-- Garantir que o motivo existente está correto
UPDATE public.reasons 
SET requires_customer = false, is_active = true 
WHERE LOWER(name) LIKE '%demonstra%';