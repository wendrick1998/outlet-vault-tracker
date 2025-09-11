-- FASE 1: SISTEMA DE PROFILES E ROLES (SEGURANÇA CRÍTICA)

-- 1. Criar enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- 2. Criar tabela de profiles para dados do usuário
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role app_role NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(email)
);

-- 3. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função para verificar roles (Security Definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 5. Criar função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = required_role
    AND is_active = true
  );
$$;

-- 6. Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(user_id, 'admin'::app_role);
$$;

-- 7. Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user'::app_role
  );
  RETURN new;
END;
$$;

-- 8. Criar trigger para execução automática
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 11. ATUALIZAR POLÍTICAS RLS EXISTENTES PARA USAR ROLES

-- Customers: Admins e managers podem tudo, users podem ver apenas
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "All authenticated users can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage customers"
ON public.customers FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
);

-- Inventory: Role-based access
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON public.inventory;

CREATE POLICY "All authenticated users can view inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
);

-- Loans: Role-based access
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can create loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can delete loans" ON public.loans;

CREATE POLICY "All authenticated users can view loans"
ON public.loans FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage loans"
ON public.loans FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
);

-- Item Notes: Todos podem ver e criar, apenas admins/managers podem deletar
DROP POLICY IF EXISTS "Authenticated users can view item_notes" ON public.item_notes;
DROP POLICY IF EXISTS "Authenticated users can create item_notes" ON public.item_notes;
DROP POLICY IF EXISTS "Authenticated users can update item_notes" ON public.item_notes;
DROP POLICY IF EXISTS "Authenticated users can delete item_notes" ON public.item_notes;

CREATE POLICY "All authenticated users can view and create item_notes"
ON public.item_notes FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create item_notes"
ON public.item_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage item_notes"
ON public.item_notes FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin'::app_role, 'manager'::app_role)
);

-- Reasons e Sellers: Apenas admins podem gerenciar
DROP POLICY IF EXISTS "Authenticated users can view reasons" ON public.reasons;
DROP POLICY IF EXISTS "Authenticated users can create reasons" ON public.reasons;
DROP POLICY IF EXISTS "Authenticated users can update reasons" ON public.reasons;
DROP POLICY IF EXISTS "Authenticated users can delete reasons" ON public.reasons;

CREATE POLICY "All authenticated users can view reasons"
ON public.reasons FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage reasons"
ON public.reasons FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view sellers" ON public.sellers;
DROP POLICY IF EXISTS "Authenticated users can create sellers" ON public.sellers;
DROP POLICY IF EXISTS "Authenticated users can update sellers" ON public.sellers;
DROP POLICY IF EXISTS "Authenticated users can delete sellers" ON public.sellers;

CREATE POLICY "All authenticated users can view sellers"
ON public.sellers FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage sellers"
ON public.sellers FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));