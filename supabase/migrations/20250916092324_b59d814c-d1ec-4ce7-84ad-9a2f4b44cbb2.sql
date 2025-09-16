-- Corrigir warnings de segurança: Function Search Path Mutable
-- Remover trigger antes de alterar função

-- Remover trigger existente
DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;

-- Remover função existente
DROP FUNCTION IF EXISTS update_updated_at_stock_items();

-- Recriar função com search_path correto
CREATE OR REPLACE FUNCTION public.update_updated_at_stock_items()
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

-- Recriar trigger
CREATE TRIGGER update_stock_items_updated_at
    BEFORE UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_stock_items();

-- Corrigir função validate_imei (recriar com search_path)
DROP FUNCTION IF EXISTS validate_imei(text);
CREATE OR REPLACE FUNCTION public.validate_imei(imei_code text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    cleaned_imei TEXT;
    digit_sum INTEGER := 0;
    digit_value INTEGER;
    i INTEGER;
BEGIN
    -- Clean and validate input
    cleaned_imei := regexp_replace(imei_code, '[^0-9]', '', 'g');
    
    IF length(cleaned_imei) NOT IN (14, 15) THEN
        RETURN FALSE;
    END IF;
    
    -- Luhn algorithm validation
    FOR i IN 1..length(cleaned_imei) LOOP
        digit_value := substr(cleaned_imei, length(cleaned_imei) - i + 1, 1)::INTEGER;
        
        IF i % 2 = 0 THEN
            digit_value := digit_value * 2;
            IF digit_value > 9 THEN
                digit_value := digit_value - 9;
            END IF;
        END IF;
        
        digit_sum := digit_sum + digit_value;
    END LOOP;
    
    RETURN digit_sum % 10 = 0;
END;
$$;