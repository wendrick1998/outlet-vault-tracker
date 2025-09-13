-- Habilitar extensão pgcrypto para funções de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar a função set_operation_pin com a extensão habilitada
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
    
    -- Gerar hash do PIN usando pgcrypto
    hashed_pin := crypt(pin, gen_salt('bf', 8));
    
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