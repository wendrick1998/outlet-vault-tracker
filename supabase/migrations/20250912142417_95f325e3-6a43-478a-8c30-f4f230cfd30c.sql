-- Migração idempotente para suporte a Cadastros Admin
-- Adiciona campo can_withdraw na tabela profiles

-- Adiciona coluna can_withdraw se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS can_withdraw BOOLEAN DEFAULT false;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.can_withdraw IS 'Indica se o usuário pode retirar aparelhos do cofre';

-- Atualiza audit log para registrar essa mudança
SELECT public.log_audit_event(
  'migration_admin_cadastros_can_withdraw',
  jsonb_build_object(
    'table', 'profiles',
    'action', 'add_column',
    'column', 'can_withdraw',
    'type', 'BOOLEAN',
    'default', false
  )
);