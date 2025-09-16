-- FINALIZAÇÃO: Corrigir sistema de etiquetas automáticas
-- Executar função detect_demonstration_items para aplicar etiquetas automaticamente

-- Primeiro, verificar se temos itens na vitrine com mais de 1 dia
DO $$
DECLARE
    vitrine_count integer;
    demo_label_id uuid;
    item_record record;
BEGIN
    -- Verificar quantos itens temos na vitrine
    SELECT COUNT(*) INTO vitrine_count 
    FROM stock_items 
    WHERE location = 'vitrine' AND status = 'disponivel';
    
    RAISE NOTICE 'Encontrados % itens na vitrine com status disponível', vitrine_count;
    
    -- Buscar ID da etiqueta Demonstração
    SELECT id INTO demo_label_id FROM labels WHERE name = 'Demonstração' LIMIT 1;
    
    IF demo_label_id IS NOT NULL THEN
        RAISE NOTICE 'Etiqueta "Demonstração" encontrada: %', demo_label_id;
        
        -- Para cada item na vitrine há mais de 1 dia, aplicar etiqueta
        FOR item_record IN 
            SELECT si.id, si.imei, si.model, si.location, si.status, si.created_at
            FROM stock_items si
            WHERE si.location = 'vitrine' 
            AND si.status = 'disponivel' 
            AND si.created_at < (now() - INTERVAL '1 day')
            AND NOT EXISTS (
                SELECT 1 FROM stock_item_labels sil 
                WHERE sil.stock_item_id = si.id AND sil.label_id = demo_label_id
            )
        LOOP
            -- Aplicar etiqueta de demonstração
            INSERT INTO stock_item_labels (stock_item_id, label_id, applied_by)
            VALUES (item_record.id, demo_label_id, '00000000-0000-0000-0000-000000000000'::uuid)
            ON CONFLICT (stock_item_id, label_id) DO NOTHING;
            
            RAISE NOTICE 'Etiqueta aplicada ao item: % - %', item_record.imei, item_record.model;
        END LOOP;
    ELSE
        RAISE NOTICE 'Etiqueta "Demonstração" não encontrada';
    END IF;
    
    -- Log da execução
    PERFORM log_audit_event(
        'automatic_demonstration_labels_applied',
        jsonb_build_object(
            'vitrine_items_found', vitrine_count,
            'labels_applied', (SELECT COUNT(*) FROM stock_item_labels WHERE label_id = demo_label_id)
        )
    );
END $$;

-- Atualizar a função detect_demonstration_items para ser mais eficaz
CREATE OR REPLACE FUNCTION public.detect_demonstration_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    demo_label_id uuid;
    item_record record;
    applied_count integer := 0;
BEGIN
    -- Buscar ID da etiqueta Demonstração
    SELECT id INTO demo_label_id FROM labels WHERE name = 'Demonstração' LIMIT 1;
    
    IF demo_label_id IS NULL THEN
        -- Criar etiqueta se não existir
        INSERT INTO labels (name, color) 
        VALUES ('Demonstração', '#FFA500')
        ON CONFLICT (name) DO UPDATE SET color = '#FFA500'
        RETURNING id INTO demo_label_id;
    END IF;
    
    -- Aplicar etiqueta "Demonstração" para itens na vitrine disponíveis há mais de 1 dia
    FOR item_record IN 
        SELECT si.id
        FROM stock_items si
        WHERE si.location = 'vitrine'::stock_location
        AND si.status = 'disponivel'::stock_status  
        AND si.created_at < (now() - INTERVAL '1 day')
        AND NOT EXISTS (
            SELECT 1 FROM stock_item_labels sil 
            WHERE sil.stock_item_id = si.id AND sil.label_id = demo_label_id
        )
    LOOP
        INSERT INTO stock_item_labels (stock_item_id, label_id, applied_by)
        VALUES (item_record.id, demo_label_id, '00000000-0000-0000-0000-000000000000'::uuid)
        ON CONFLICT (stock_item_id, label_id) DO NOTHING;
        
        applied_count := applied_count + 1;
    END LOOP;
    
    -- Log da operação
    PERFORM log_audit_event(
        'demonstration_items_detected',
        jsonb_build_object(
            'labels_applied', applied_count,
            'label_id', demo_label_id
        )
    );
END;
$function$;

-- Executar a função atualizada
SELECT detect_demonstration_items();

-- Verificar resultado
SELECT 
    l.name as etiqueta,
    l.color,
    COUNT(sil.stock_item_id) as itens_com_etiqueta
FROM labels l
LEFT JOIN stock_item_labels sil ON l.id = sil.label_id
WHERE l.name = 'Demonstração'
GROUP BY l.id, l.name, l.color;