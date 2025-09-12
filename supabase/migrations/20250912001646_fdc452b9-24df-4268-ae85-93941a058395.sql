-- Bootstrap admin RPC to promote the specific email after first login
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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