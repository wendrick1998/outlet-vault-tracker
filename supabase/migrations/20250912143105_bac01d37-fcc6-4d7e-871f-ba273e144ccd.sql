-- Migração para tabela de modelos de dispositivos
-- Cria tabela device_models para cadastro de modelos de aparelhos

CREATE TABLE IF NOT EXISTS public.device_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  supported_storage INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  available_colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Índice único para brand + model (case insensitive)
  CONSTRAINT device_models_brand_model_unique UNIQUE (brand, model)
);

-- Enable Row Level Security
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;

-- Policies para device_models
-- Todos podem ler modelos ativos
CREATE POLICY "Anyone can view active device models" 
ON public.device_models 
FOR SELECT 
USING (is_active = true OR auth.uid() IS NOT NULL);

-- Apenas admins podem gerenciar modelos
CREATE POLICY "Only admins can manage device models" 
ON public.device_models 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::app_role);

-- Trigger para updated_at
CREATE TRIGGER update_device_models_updated_at
BEFORE UPDATE ON public.device_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.device_models IS 'Modelos de dispositivos cadastrados no sistema';
COMMENT ON COLUMN public.device_models.brand IS 'Marca do dispositivo (ex: Apple, Samsung)';
COMMENT ON COLUMN public.device_models.model IS 'Modelo do dispositivo (ex: iPhone 13, Galaxy S21)';
COMMENT ON COLUMN public.device_models.variant IS 'Variante opcional (ex: Pro, Ultra)';
COMMENT ON COLUMN public.device_models.supported_storage IS 'Armazenamentos suportados em GB';
COMMENT ON COLUMN public.device_models.available_colors IS 'Cores disponíveis para este modelo';

-- Adiciona campo condition na tabela inventory se não existir
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'novo';

-- Comentário para o novo campo
COMMENT ON COLUMN public.inventory.condition IS 'Condição do aparelho: novo, seminovo, usado';

-- Log de auditoria
SELECT public.log_audit_event(
  'migration_device_models_and_inventory_condition',
  jsonb_build_object(
    'tables_created', ARRAY['device_models'],
    'columns_added', jsonb_build_object(
      'inventory', ARRAY['condition']
    )
  )
);