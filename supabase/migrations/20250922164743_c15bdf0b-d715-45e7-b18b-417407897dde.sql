-- Corrigir search_path das funções restantes para segurança

-- 1) Corrigir função auto_apply_demonstration_label
CREATE OR REPLACE FUNCTION public.auto_apply_demonstration_label()
RETURNS TRIGGER AS $$
DECLARE
    demo_label_id uuid;
BEGIN
    -- Buscar ID da etiqueta Demonstração
    SELECT id INTO demo_label_id FROM public.labels WHERE name = 'Demonstração' LIMIT 1;
    
    -- Se item mudou para vitrine, aplicar etiqueta
    IF NEW.location = 'vitrine'::stock_location AND (OLD.location IS NULL OR OLD.location != 'vitrine'::stock_location) THEN
        IF demo_label_id IS NOT NULL THEN
            INSERT INTO public.stock_item_labels (stock_item_id, label_id)
            VALUES (NEW.id, demo_label_id)
            ON CONFLICT (stock_item_id, label_id) DO NOTHING;
        END IF;
    END IF;
    
    -- Se item saiu da vitrine, remover etiqueta demonstração
    IF OLD.location = 'vitrine'::stock_location AND NEW.location != 'vitrine'::stock_location THEN
        IF demo_label_id IS NOT NULL THEN
            DELETE FROM public.stock_item_labels 
            WHERE stock_item_id = NEW.id AND label_id = demo_label_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2) Corrigir função auto_apply_loan_label
CREATE OR REPLACE FUNCTION public.auto_apply_loan_label()
RETURNS TRIGGER AS $$
DECLARE
    loan_label_id uuid;
BEGIN
    -- Buscar ID da etiqueta EMPRESTIMO
    SELECT id INTO loan_label_id FROM public.labels WHERE name = 'EMPRESTIMO' LIMIT 1;
    
    -- Se item mudou para reservado, aplicar etiqueta
    IF NEW.status = 'reservado'::stock_status AND (OLD.status IS NULL OR OLD.status != 'reservado'::stock_status) THEN
        IF loan_label_id IS NOT NULL THEN
            INSERT INTO public.stock_item_labels (stock_item_id, label_id)
            VALUES (NEW.id, loan_label_id)
            ON CONFLICT (stock_item_id, label_id) DO NOTHING;
        END IF;
    END IF;
    
    -- Se item não está mais reservado, remover etiqueta empréstimo  
    IF OLD.status = 'reservado'::stock_status AND NEW.status != 'reservado'::stock_status THEN
        IF loan_label_id IS NOT NULL THEN
            DELETE FROM public.stock_item_labels 
            WHERE stock_item_id = NEW.id AND label_id = loan_label_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';