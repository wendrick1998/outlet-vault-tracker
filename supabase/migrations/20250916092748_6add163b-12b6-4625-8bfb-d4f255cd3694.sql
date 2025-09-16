-- FASE FINAL: Executar sistema de demonstração e criar etiqueta se não existir
INSERT INTO labels (name, color) 
VALUES ('Demonstração', '#FFA500')
ON CONFLICT (name) DO NOTHING;

-- Executar função de demonstração novamente
SELECT detect_demonstration_items();

-- Validação: Verificar se há itens que podem ser marcados como demonstração
SELECT 
  si.id,
  si.imei,
  si.model,
  si.location,
  si.status,
  si.created_at,
  CASE 
    WHEN si.location = 'vitrine' AND si.status = 'disponivel' AND si.created_at < (now() - INTERVAL '1 day') 
    THEN 'PODE_SER_DEMO'
    ELSE 'NAO_ELEGIVEL'
  END as elegibilidade_demo
FROM stock_items si
WHERE si.location = 'vitrine' AND si.status = 'disponivel'
ORDER BY si.created_at DESC
LIMIT 10;