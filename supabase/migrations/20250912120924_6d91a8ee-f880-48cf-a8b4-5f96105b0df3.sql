-- FASE 1: Corrigir search_path de todas as funções mutáveis
-- Fixar função bootstrap_admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_email text;
BEGIN
  IF caller_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = caller_id;

  -- Only allow this bootstrap for the designated owner email
  IF caller_email IS DISTINCT FROM 'wendrick.1761998@gmail.com' THEN
    RETURN false;
  END IF;

  -- Promote to admin and ensure active
  UPDATE public.profiles
  SET role = 'admin', is_active = true, updated_at = now()
  WHERE id = caller_id;

  PERFORM public.log_audit_event('bootstrap_admin', jsonb_build_object('user_id', caller_id, 'email', caller_email));
  RETURN true;
END;
$$;

-- Fixar função check_account_security_status
CREATE OR REPLACE FUNCTION public.check_account_security_status(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fixar função check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(identifier text, max_requests integer DEFAULT 10, window_minutes integer DEFAULT 15)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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