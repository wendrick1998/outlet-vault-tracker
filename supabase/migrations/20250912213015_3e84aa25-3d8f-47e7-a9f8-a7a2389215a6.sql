-- Atribuir role de operador para usuários existentes que precisam fazer lançamentos
-- Garantir que o role 'operator' tem todas as permissões necessárias

-- Adicionar permissões essenciais para operadores se não existirem
INSERT INTO public.role_permissions (role, permission) 
VALUES 
  ('operator', 'movements.create'),
  ('operator', 'movements.view'),
  ('operator', 'inventory.view'),
  ('operator', 'inventory.create'),
  ('operator', 'inventory.update'),
  ('operator', 'inventory.bulk_operations'),
  ('operator', 'users.view'),
  ('operator', 'users.create')
ON CONFLICT (role, permission) DO NOTHING;

-- Atribuir role de operator para usuários ativos com role 'user' que podem fazer saques
INSERT INTO public.user_role_assignments (user_id, role, assigned_by, notes)
SELECT 
  p.id,
  'operator'::granular_role,
  p.id, -- auto-atribuição para migração
  'Migração automática: usuário habilitado para lançamentos'
FROM public.profiles p
WHERE p.role = 'user'::app_role 
  AND p.is_active = true 
  AND p.can_withdraw = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role = 'operator'::granular_role
  );

-- Log da migração
INSERT INTO public.audit_logs (user_id, action, details)
SELECT 
  NULL,
  'operator_role_migration',
  jsonb_build_object(
    'affected_users', (
      SELECT COUNT(*) FROM public.profiles p
      WHERE p.role = 'user'::app_role 
        AND p.is_active = true 
        AND p.can_withdraw = true
    ),
    'timestamp', now()
  );