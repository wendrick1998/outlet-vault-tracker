-- Habilitar proteção contra senhas vazadas no Supabase Auth
-- Esta configuração melhora a segurança verificando senhas contra bases de dados de senhas vazadas

-- A configuração real precisa ser feita via dashboard do Supabase
-- Mas podemos criar uma função para validar senhas localmente também

-- Atualizar a função de validação de segurança de senhas para incluir verificação mais rigorosa
CREATE OR REPLACE FUNCTION public.validate_password_security(password_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{"valid": true, "errors": [], "score": 0}'::jsonb;
    errors text[] := ARRAY[]::text[];
    score integer := 0;
BEGIN
    -- Length validation (minimum 12 characters recommended)
    IF length(password_text) < 8 THEN
        errors := array_append(errors, 'Senha deve ter pelo menos 8 caracteres');
    ELSIF length(password_text) >= 12 THEN
        score := score + 2;
    ELSE
        score := score + 1;
    END IF;
    
    -- Character diversity checks
    IF password_text ~ '[a-z]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra minúscula');
    END IF;
    
    IF password_text ~ '[A-Z]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra maiúscula');
    END IF;
    
    IF password_text ~ '[0-9]' THEN
        score := score + 1;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos um número');
    END IF;
    
    IF password_text ~ '[^A-Za-z0-9]' THEN
        score := score + 2;
    ELSE
        errors := array_append(errors, 'Senha deve conter pelo menos um caractere especial');
    END IF;
    
    -- Check for repeated characters (security issue)
    IF password_text ~ '(.)\1{2,}' THEN
        errors := array_append(errors, 'Evite sequências de caracteres repetidos');
        score := score - 1;
    END IF;
    
    -- Check for common patterns (basic validation)
    IF lower(password_text) ~ '(123|abc|qwe|password|admin|user|cofre|vault|tracker)' THEN
        errors := array_append(errors, 'Evite padrões comuns ou palavras relacionadas ao sistema');
        score := score - 2;
    END IF;
    
    -- Additional security checks
    IF password_text ~ '^[0-9]+$' THEN
        errors := array_append(errors, 'Senha não pode conter apenas números');
        score := score - 3;
    END IF;
    
    IF lower(password_text) = password_text OR upper(password_text) = password_text THEN
        errors := array_append(errors, 'Senha deve misturar maiúsculas e minúsculas');
        score := score - 1;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL AND score >= 6,
        'errors', errors,
        'score', GREATEST(0, score),
        'strength', CASE 
            WHEN score >= 9 THEN 'muito_forte'
            WHEN score >= 7 THEN 'forte'
            WHEN score >= 5 THEN 'medio'
            ELSE 'fraco'
        END,
        'security_level', CASE
            WHEN score >= 8 THEN 'enterprise'
            WHEN score >= 6 THEN 'business'
            WHEN score >= 4 THEN 'basic'
            ELSE 'inadequate'
        END
    );
    
    RETURN result;
END;
$$;