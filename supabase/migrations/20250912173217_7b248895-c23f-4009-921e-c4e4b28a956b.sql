-- Corrigir campo battery_pct para ser opcional (permitir NULL)
-- e adicionar campos para anonimização de usuários
-- e semear etiquetas padrão (versão corrigida)

-- 1. Modificar constraint de battery_pct para permitir NULL
ALTER TABLE public.inventory 
ALTER COLUMN battery_pct DROP NOT NULL;

-- 2. Adicionar campos de anonimização em profiles (apenas se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_anonymized') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN is_anonymized BOOLEAN DEFAULT false,
        ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE NULL,
        ADD COLUMN anonymized_by UUID NULL,
        ADD COLUMN anonymized_reason TEXT NULL;
    END IF;
END $$;

-- 3. Adicionar unique constraint no IMEI apenas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_imei_unique') THEN
        ALTER TABLE public.inventory 
        ADD CONSTRAINT inventory_imei_unique UNIQUE (imei);
    END IF;
END $$;

-- 4. Semear etiquetas padrão se não existirem
INSERT INTO public.labels (name, color, is_active) VALUES 
('EMPRESTIMO', '#3B82F6', true),
('USO LOJA', '#10B981', true),  
('ASSISTENCIA', '#F59E0B', true),
('APROVADO', '#22C55E', true),
('AGUARDANDO TESTE', '#EAB308', true),
('REPROVADO', '#EF4444', true),
('EM TRANSITO', '#8B5CF6', true),
('MANUTENCAO', '#F97316', true),
('PERDA', '#DC2626', true),
('INCONSISTENCIA', '#6B7280', true)
ON CONFLICT (name) DO NOTHING;

-- 5. Função para verificar vínculos antes de excluir aparelhos
CREATE OR REPLACE FUNCTION public.check_device_links(device_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se há empréstimos ativos ou histórico
  RETURN EXISTS (
    SELECT 1 FROM public.loans 
    WHERE item_id = device_id
  );
END;
$$;

-- 6. Função para anonimizar usuário
CREATE OR REPLACE FUNCTION public.anonymize_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Solicitação administrativa'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  short_id TEXT;
BEGIN
  -- Gerar ID curto único
  short_id := substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  
  -- Atualizar perfil do usuário
  UPDATE public.profiles SET
    is_anonymized = true,
    anonymized_at = now(),
    anonymized_by = auth.uid(),
    anonymized_reason = p_reason,
    full_name = 'Usuário Anon-' || short_id,
    email = 'anon+' || p_user_id::text || '@example.local',
    is_active = false,
    can_withdraw = false
  WHERE id = p_user_id;
  
  -- Log da ação
  PERFORM log_audit_event(
    'user_anonymized',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'anonymous_id', short_id,
      'reason', p_reason
    )
  );
END;
$$;