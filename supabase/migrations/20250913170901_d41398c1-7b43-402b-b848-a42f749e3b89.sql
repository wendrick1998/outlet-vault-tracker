-- Corrigir funções PIN usando schema completo para pgcrypto
-- Recriar a função set_operation_pin com prefixo extensions correto
CREATE OR REPLACE FUNCTION public.set_operation_pin(user_id uuid, pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    hashed_pin TEXT;
BEGIN
    -- Validar formato do PIN (4 dígitos)
    IF pin !~ '^[0-9]{4}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'PIN deve conter exatamente 4 dígitos.'
        );
    END IF;
    
    -- Validar PIN fraco (evitar sequências óbvias)
    IF pin IN ('0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'PIN muito simples. Use uma combinação mais complexa.'
        );
    END IF;
    
    -- Gerar hash do PIN usando extensions.gen_salt e extensions.crypt
    BEGIN
        hashed_pin := extensions.crypt(pin, extensions.gen_salt('bf', 8));
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Erro na criptografia do PIN: ' || SQLERRM
        );
    END;
    
    -- Atualizar PIN no perfil
    UPDATE public.profiles
    SET operation_pin_hash = hashed_pin,
        updated_at = NOW()
    WHERE id = user_id AND is_active = true;
    
    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado ou inativo.'
        );
    END IF;
    
    -- Log da configuração
    PERFORM public.log_audit_event(
        'operation_pin_configured',
        jsonb_build_object('user_id', user_id)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'PIN operacional configurado com sucesso.'
    );
END;
$function$;

-- Corrigir também a função validate_operation_pin
CREATE OR REPLACE FUNCTION public.validate_operation_pin(user_id uuid, pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    stored_hash TEXT;
    attempts_count INTEGER := 0;
    is_valid BOOLEAN := FALSE;
    result JSONB;
BEGIN
    -- Verificar tentativas recentes (últimos 15 minutos)
    SELECT COUNT(*)
    INTO attempts_count
    FROM public.audit_logs
    WHERE user_id = validate_operation_pin.user_id
    AND action = 'pin_validation_failed'
    AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Bloquear após 3 tentativas
    IF attempts_count >= 3 THEN
        PERFORM public.log_audit_event(
            'pin_validation_blocked',
            jsonb_build_object(
                'user_id', user_id,
                'attempts_count', attempts_count,
                'blocked_until', NOW() + INTERVAL '15 minutes'
            )
        );
        
        RETURN jsonb_build_object(
            'valid', false,
            'blocked', true,
            'message', 'Muitas tentativas inválidas. Tente novamente em 15 minutos.'
        );
    END IF;
    
    -- Buscar hash armazenado
    SELECT operation_pin_hash
    INTO stored_hash
    FROM public.profiles
    WHERE id = user_id AND is_active = true;
    
    -- Verificar se PIN foi configurado
    IF stored_hash IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'not_configured', true,
            'message', 'PIN operacional não foi configurado.'
        );
    END IF;
    
    -- Validar PIN usando extensions.crypt
    BEGIN
        IF stored_hash = extensions.crypt(pin, stored_hash) THEN
            is_valid := TRUE;
            
            -- Log de sucesso
            PERFORM public.log_audit_event(
                'pin_validation_success',
                jsonb_build_object('user_id', user_id)
            );
        ELSE
            -- Log de falha
            PERFORM public.log_audit_event(
                'pin_validation_failed',
                jsonb_build_object(
                    'user_id', user_id,
                    'attempts_count', attempts_count + 1
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log erro de criptografia
        PERFORM public.log_audit_event(
            'pin_validation_error',
            jsonb_build_object(
                'user_id', user_id,
                'error', SQLERRM
            )
        );
        
        RETURN jsonb_build_object(
            'valid', false,
            'blocked', false,
            'not_configured', false,
            'message', 'Erro na validação do PIN.'
        );
    END;
    
    result := jsonb_build_object(
        'valid', is_valid,
        'blocked', false,
        'not_configured', false,
        'message', CASE 
            WHEN is_valid THEN 'PIN validado com sucesso.'
            ELSE 'PIN inválido.'
        END
    );
    
    RETURN result;
END;
$function$;