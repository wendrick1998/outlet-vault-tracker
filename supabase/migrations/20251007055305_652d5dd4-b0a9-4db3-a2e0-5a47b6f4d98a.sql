-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar job para verificação automática de inconsistências (a cada hora)
SELECT cron.schedule(
  'auto-inconsistency-checker',
  '0 * * * *', -- A cada hora no minuto 0
  $$
  SELECT
    net.http_post(
      url := 'https://lwbouxonjohqfdhnasvk.supabase.co/functions/v1/auto-inconsistency-checker',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Ym91eG9uam9ocWZkaG5hc3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjIxMzcsImV4cCI6MjA3MzE5ODEzN30.mrXXfVX5FR1wLpYjya92HDVwzTM3aOFSqscqYE4pIDo"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Criar job para relatório diário de acessos a dados sensíveis (todo dia às 9h)
SELECT cron.schedule(
  'daily-sensitive-access-report',
  '0 9 * * *', -- Todo dia às 9h da manhã
  $$
  SELECT
    net.http_post(
      url := 'https://lwbouxonjohqfdhnasvk.supabase.co/functions/v1/daily-sensitive-access-report',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Ym91eG9uam9ocWZkaG5hc3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjIxMzcsImV4cCI6MjA3MzE5ODEzN30.mrXXfVX5FR1wLpYjya92HDVwzTM3aOFSqscqYE4pIDo"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Criar tabela para rastrear alertas de correção de empréstimos
CREATE TABLE IF NOT EXISTS public.loan_correction_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loan_correction_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own alerts"
  ON public.loan_correction_alerts
  FOR SELECT
  USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "Admins can manage all alerts"
  ON public.loan_correction_alerts
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Trigger para criar alerta quando usuário atinge limite de correções
CREATE OR REPLACE FUNCTION public.check_correction_limit_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correction_count INTEGER;
  v_user_email TEXT;
BEGIN
  -- Buscar contagem de correções
  SELECT correction_count INTO v_correction_count
  FROM public.correction_limits
  WHERE user_id = NEW.user_id;

  -- Se atingiu 4 correções (próximo ao limite de 5), criar alerta
  IF v_correction_count >= 4 THEN
    -- Buscar email do usuário
    SELECT email INTO v_user_email
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Criar alerta
    INSERT INTO public.loan_correction_alerts (
      user_id,
      alert_type,
      alert_message,
      metadata
    ) VALUES (
      NEW.user_id,
      'correction_limit_warning',
      format('Usuário %s está próximo do limite diário de correções (%s/5)', v_user_email, v_correction_count),
      jsonb_build_object(
        'correction_count', v_correction_count,
        'user_email', v_user_email,
        'window_start', NEW.window_start
      )
    );

    -- Log de auditoria
    PERFORM public.log_audit_event(
      'correction_limit_alert_triggered',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'correction_count', v_correction_count,
        'user_email', v_user_email
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_correction_limit_alert
  AFTER UPDATE ON public.correction_limits
  FOR EACH ROW
  WHEN (NEW.correction_count >= 4)
  EXECUTE FUNCTION public.check_correction_limit_alert();

-- Trigger para enviar notificação quando admin acessa dados sensíveis
CREATE OR REPLACE FUNCTION public.notify_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role app_role;
  v_user_email TEXT;
  v_customer_name TEXT;
BEGIN
  -- Buscar role e email do usuário
  SELECT role, email INTO v_user_role, v_user_email
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Se for admin, criar alerta
  IF v_user_role = 'admin'::app_role THEN
    -- Buscar nome do cliente
    SELECT name INTO v_customer_name
    FROM public.customers
    WHERE id = NEW.customer_id;

    -- Criar alerta
    INSERT INTO public.loan_correction_alerts (
      user_id,
      alert_type,
      alert_message,
      metadata
    ) VALUES (
      NEW.user_id,
      'admin_sensitive_access',
      format('Admin %s acessou dados sensíveis do cliente %s', v_user_email, v_customer_name),
      jsonb_build_object(
        'user_email', v_user_email,
        'customer_id', NEW.customer_id,
        'customer_name', v_customer_name,
        'accessed_fields', NEW.approved_fields,
        'reason', NEW.access_reason
      )
    );

    -- Log de auditoria
    PERFORM public.log_audit_event(
      'admin_sensitive_access_notification',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'customer_id', NEW.customer_id,
        'accessed_fields', NEW.approved_fields
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_sensitive_access
  AFTER INSERT ON public.sensitive_data_access_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_sensitive_access();

-- Comentários para documentação
COMMENT ON TABLE public.loan_correction_alerts IS 'Armazena alertas de segurança e conformidade do sistema';
COMMENT ON FUNCTION public.check_correction_limit_alert() IS 'Cria alertas quando usuários se aproximam do limite de correções diárias';
COMMENT ON FUNCTION public.notify_sensitive_access() IS 'Notifica quando admins acessam dados sensíveis de clientes';
