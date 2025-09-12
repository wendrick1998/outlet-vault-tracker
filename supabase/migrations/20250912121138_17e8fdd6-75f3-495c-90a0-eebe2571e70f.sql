-- Finalizar correção das funções restantes com search_path mutável
-- Fixar função has_role
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = required_role
    AND is_active = true
  );
$$;

-- Fixar função is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(user_id, 'admin'::app_role);
$$;

-- Fixar função is_working_hours
CREATE OR REPLACE FUNCTION public.is_working_hours(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fixar função log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_details jsonb DEFAULT NULL::jsonb, p_table_name text DEFAULT NULL::text, p_record_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, details, table_name, record_id)
    VALUES (auth.uid(), p_action, p_details, p_table_name, p_record_id);
END;
$$;

-- Fixar função log_sensitive_access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(table_name text, record_id uuid, accessed_fields text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This would typically insert into an audit log table
  -- For now, we'll use a simple approach
  RAISE LOG 'SENSITIVE_ACCESS: User % accessed % fields % in table % for record %', 
    auth.uid(), array_length(accessed_fields, 1), accessed_fields, table_name, record_id;
END;
$$;