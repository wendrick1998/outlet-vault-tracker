-- Atualizar o usuário wendrick.1761998@gmail.com para administrador
-- User ID: fdbdee69-46c2-4e99-af8c-be74670d3cb2

-- Primeiro, desabilitar temporariamente os triggers para evitar problemas
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- 1. Atualizar a tabela profiles para role admin
UPDATE public.profiles 
SET 
  role = 'admin'::app_role,
  is_active = true,
  updated_at = now()
WHERE email = 'wendrick.1761998@gmail.com';

-- Reabilitar os triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- 2. Desativar a atribuição atual de operator em user_role_assignments
UPDATE public.user_role_assignments 
SET 
  is_active = false,
  updated_at = now()
WHERE user_id = 'fdbdee69-46c2-4e99-af8c-be74670d3cb2'
  AND role = 'operator'::granular_role;

-- 3. Adicionar nova atribuição de admin em user_role_assignments
INSERT INTO public.user_role_assignments (
  user_id, 
  role, 
  assigned_by, 
  notes,
  is_active
) VALUES (
  'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  'admin'::granular_role,
  'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  'Upgraded to admin via SQL migration',
  true
) ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  assigned_by = 'fdbdee69-46c2-4e99-af8c-be74670d3cb2',
  notes = 'Upgraded to admin via SQL migration',
  updated_at = now();