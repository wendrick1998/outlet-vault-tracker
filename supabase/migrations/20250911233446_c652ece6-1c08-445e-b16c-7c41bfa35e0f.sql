-- FASE 1B: EXPANSÃO COMPLETA DE SEGURANÇA E ROLES (CORRIGIDA)

-- 2. Expandir tabela profiles para campos de segurança
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS turno TEXT CHECK (turno IN ('manha', 'tarde', 'noite', 'integral')),
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS codigo_backup TEXT[],
ADD COLUMN IF NOT EXISTS senha_alterada_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS sessao_unica_token TEXT,
ADD COLUMN IF NOT EXISTS horario_inicio TIME DEFAULT '08:00'::TIME,
ADD COLUMN IF NOT EXISTS horario_fim TIME DEFAULT '18:00'::TIME;

-- 3. Criar tabela de histórico de senhas
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- 4. Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    table_name TEXT,
    record_id UUID
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Criar tabela de sessões ativas
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para password_history
CREATE POLICY "Admins can manage password history" 
ON public.password_history FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- 7. Políticas RLS para audit_logs
CREATE POLICY "Auditors and admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'auditor'::app_role]));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- 8. Políticas RLS para active_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.active_sessions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" 
ON public.active_sessions FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "System can manage sessions" 
ON public.active_sessions FOR ALL 
USING (auth.uid() IS NOT NULL);

-- 9. Função para validar horário de trabalho (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.is_working_hours(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_turno TEXT;
    user_inicio TIME;
    user_fim TIME;
    hora_atual TIME;
    dia_atual INTEGER;
BEGIN
    SELECT turno, horario_inicio, horario_fim 
    INTO user_turno, user_inicio, user_fim
    FROM public.profiles 
    WHERE id = user_id;
    
    IF user_turno IS NULL THEN
        RETURN true;
    END IF;
    
    hora_atual := CURRENT_TIME;
    dia_atual := EXTRACT(DOW FROM CURRENT_DATE);
    
    IF dia_atual IN (0, 6) AND user_turno != 'integral' THEN
        RETURN false;
    END IF;
    
    CASE user_turno
        WHEN 'manha' THEN
            RETURN hora_atual BETWEEN '06:00'::TIME AND '14:00'::TIME;
        WHEN 'tarde' THEN
            RETURN hora_atual BETWEEN '14:00'::TIME AND '22:00'::TIME;
        WHEN 'noite' THEN
            RETURN hora_atual BETWEEN '22:00'::TIME AND '06:00'::TIME;
        WHEN 'integral' THEN
            RETURN true;
        ELSE
            RETURN hora_atual BETWEEN COALESCE(user_inicio, '08:00'::TIME) AND COALESCE(user_fim, '18:00'::TIME);
    END CASE;
END;
$$;

-- 10. Função para registrar logs de auditoria
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, details, table_name, record_id)
    VALUES (auth.uid(), p_action, p_details, p_table_name, p_record_id);
END;
$$;

-- 11. Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.active_sessions 
    WHERE expires_at < now() OR last_activity < now() - INTERVAL '24 hours';
END;
$$;

-- 12. Trigger para auditoria de profiles
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'profile_updated',
            jsonb_build_object(
                'user_id', NEW.id,
                'changes', row_to_json(NEW) - row_to_json(OLD)
            ),
            'profiles',
            NEW.id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_profiles_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();

-- 13. Atualizar políticas para incluir auditor
DROP POLICY IF EXISTS "Managers and auditors can view basic profiles" ON public.profiles;

CREATE POLICY "Managers and auditors can view basic profiles" 
ON public.profiles FOR SELECT 
USING (
    (get_user_role(auth.uid()) = ANY(ARRAY['manager'::app_role, 'auditor'::app_role])) 
    AND (get_user_role(id) <> 'admin'::app_role)
);

-- 14. Função para validar força da senha
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result JSONB := '{"valid": true, "errors": []}'::JSONB;
    errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF length(password) < 8 THEN
        errors := array_append(errors, 'Senha deve ter pelo menos 8 caracteres');
    END IF;
    
    IF password !~ '[A-Z]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra maiúscula');
    END IF;
    
    IF password !~ '[a-z]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra minúscula');
    END IF;
    
    IF password !~ '[0-9]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos um número');
    END IF;
    
    IF password !~ '[^A-Za-z0-9]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos um caractere especial');
    END IF;
    
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object('valid', false, 'errors', errors);
    END IF;
    
    RETURN result;
END;
$$;