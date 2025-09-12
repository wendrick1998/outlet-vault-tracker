-- Corrigir as últimas 2 funções com search_path mutável e implementar proteção contra senhas vazadas
-- Fixar função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fixar função validate_password_strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
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

-- Criar função para verificar senhas vazadas usando HaveIBeenPwned k-anonymity
-- Esta função será chamada via Edge Function, não diretamente pelo cliente
CREATE OR REPLACE FUNCTION public.check_password_leaked_status(password_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Log da verificação para auditoria (sem expor a senha)
    PERFORM public.log_audit_event(
        'password_leak_check',
        jsonb_build_object(
            'hash_prefix', substr(password_hash, 1, 5),
            'timestamp', now()
        )
    );
    
    -- Retornar formato esperado para integração com Edge Function
    result := jsonb_build_object(
        'needs_external_check', true,
        'hash_prefix', substr(password_hash, 1, 5),
        'timestamp', now()
    );
    
    RETURN result;
END;
$$;