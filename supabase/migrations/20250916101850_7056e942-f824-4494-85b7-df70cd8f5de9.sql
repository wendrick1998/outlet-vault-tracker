-- CORREÇÃO CRÍTICA: Executar etiquetas automáticas e criar triggers
-- Primeiro executar função para aplicar etiquetas existentes
SELECT public.detect_demonstration_items();

-- Criar trigger automático para aplicar etiqueta "Demonstração" quando item vai para vitrine
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
            INSERT INTO public.stock_item_labels (stock_item_id, label_id, applied_by)
            VALUES (NEW.id, demo_label_id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid))
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_apply_demonstration_label ON public.stock_items;
CREATE TRIGGER trigger_auto_apply_demonstration_label
    AFTER INSERT OR UPDATE OF location ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_apply_demonstration_label();

-- Criar função para aplicar etiqueta "Empréstimo" 
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
            INSERT INTO public.stock_item_labels (stock_item_id, label_id, applied_by)
            VALUES (NEW.id, loan_label_id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid))
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para empréstimo
DROP TRIGGER IF EXISTS trigger_auto_apply_loan_label ON public.stock_items;
CREATE TRIGGER trigger_auto_apply_loan_label
    AFTER INSERT OR UPDATE OF status ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_apply_loan_label();

-- Aplicar etiquetas para itens existentes na vitrine
INSERT INTO public.stock_item_labels (stock_item_id, label_id, applied_by)
SELECT 
    si.id,
    l.id,
    '00000000-0000-0000-0000-000000000000'::uuid
FROM public.stock_items si
CROSS JOIN public.labels l
WHERE l.name = 'Demonstração'
AND si.location = 'vitrine'::stock_location
AND NOT EXISTS (
    SELECT 1 FROM public.stock_item_labels sil 
    WHERE sil.stock_item_id = si.id AND sil.label_id = l.id
)
ON CONFLICT (stock_item_id, label_id) DO NOTHING;

-- Aplicar etiquetas para itens reservados
INSERT INTO public.stock_item_labels (stock_item_id, label_id, applied_by)
SELECT 
    si.id,
    l.id,
    '00000000-0000-0000-0000-000000000000'::uuid
FROM public.stock_items si
CROSS JOIN public.labels l
WHERE l.name = 'EMPRESTIMO'
AND si.status = 'reservado'::stock_status
AND NOT EXISTS (
    SELECT 1 FROM public.stock_item_labels sil 
    WHERE sil.stock_item_id = si.id AND sil.label_id = l.id
)
ON CONFLICT (stock_item_id, label_id) DO NOTHING;