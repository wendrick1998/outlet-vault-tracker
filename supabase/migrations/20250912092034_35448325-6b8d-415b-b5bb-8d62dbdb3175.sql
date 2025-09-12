-- Enable password strength and leaked password protection
-- This must be done via Supabase Dashboard Auth Settings
-- Creating functions to enforce password policies at application level

-- Function to validate password meets security requirements
CREATE OR REPLACE FUNCTION public.validate_password_security(password_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    IF lower(password_text) ~ '(123|abc|qwe|password|admin|user)' THEN
        errors := array_append(errors, 'Evite padrões comuns ou palavras óbvias');
        score := score - 2;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL AND score >= 5,
        'errors', errors,
        'score', GREATEST(0, score),
        'strength', CASE 
            WHEN score >= 8 THEN 'muito_forte'
            WHEN score >= 6 THEN 'forte'
            WHEN score >= 4 THEN 'medio'
            ELSE 'fraco'
        END
    );
    
    RETURN result;
END;
$$;

-- Function to check account lockout status
CREATE OR REPLACE FUNCTION public.check_account_security_status(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data public.profiles%ROWTYPE;
    result jsonb;
    is_locked boolean := false;
    lock_reason text := null;
BEGIN
    -- Get user profile by email
    SELECT p.* INTO profile_data
    FROM public.profiles p
    WHERE p.email = user_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false,
            'message', 'Usuário não encontrado'
        );
    END IF;
    
    -- Check if account is locked
    IF profile_data.bloqueado_ate IS NOT NULL AND profile_data.bloqueado_ate > now() THEN
        is_locked := true;
        lock_reason := 'Conta temporariamente bloqueada por tentativas excessivas';
    END IF;
    
    -- Check if account is inactive
    IF NOT profile_data.is_active THEN
        is_locked := true;
        lock_reason := 'Conta desativada pelo administrador';
    END IF;
    
    -- Check excessive login attempts
    IF profile_data.tentativas_login >= 5 THEN
        is_locked := true;
        lock_reason := 'Muitas tentativas de login falharam';
    END IF;
    
    result := jsonb_build_object(
        'exists', true,
        'is_locked', is_locked,
        'lock_reason', lock_reason,
        'login_attempts', profile_data.tentativas_login,
        'locked_until', profile_data.bloqueado_ate,
        'last_login', profile_data.ultimo_login,
        'mfa_enabled', COALESCE(profile_data.mfa_habilitado, false),
        'is_active', profile_data.is_active
    );
    
    RETURN result;
END;
$$;

-- Function to implement rate limiting at database level
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    identifier text, 
    max_requests integer DEFAULT 10, 
    window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_requests integer := 0;
    window_start timestamp with time zone;
BEGIN
    window_start := now() - (window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests in current window
    SELECT COUNT(*)
    INTO current_requests
    FROM public.audit_logs
    WHERE details->>'identifier' = identifier
    AND created_at >= window_start
    AND action IN ('login_attempt', 'api_request', 'password_reset');
    
    -- Log this request
    PERFORM public.log_audit_event(
        'rate_limit_check',
        jsonb_build_object(
            'identifier', identifier,
            'current_requests', current_requests,
            'max_requests', max_requests,
            'window_minutes', window_minutes
        )
    );
    
    RETURN jsonb_build_object(
        'allowed', current_requests < max_requests,
        'current_requests', current_requests,
        'max_requests', max_requests,
        'window_minutes', window_minutes,
        'reset_time', window_start + (window_minutes || ' minutes')::INTERVAL
    );
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.validate_password_security(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_account_security_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated;