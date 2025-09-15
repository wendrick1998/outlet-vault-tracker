-- Final security hardening - fix remaining functions without search_path set
-- These are likely the remaining functions that need to be fixed based on the linter warnings

-- Fix all remaining functions that don't have search_path set
ALTER FUNCTION public.anonymize_user(uuid, text) SET search_path = public;
ALTER FUNCTION public.bootstrap_admin() SET search_path = public;
ALTER FUNCTION public.check_device_links(uuid) SET search_path = public;
ALTER FUNCTION public.check_rate_limit(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public;
ALTER FUNCTION public.cleanup_old_audit_data() SET search_path = public;
ALTER FUNCTION public.current_user_has_permission(permission) SET search_path = public;
ALTER FUNCTION public.ensure_profile_exists(uuid) SET search_path = public;
ALTER FUNCTION public.get_audit_performance_metrics(uuid) SET search_path = public;
ALTER FUNCTION public.get_system_stats() SET search_path = public;
ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_working_hours(uuid) SET search_path = public;
ALTER FUNCTION public.log_password_security_event(uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.log_sensitive_access(text, uuid, text[]) SET search_path = public;
ALTER FUNCTION public.migrate_existing_roles() SET search_path = public;
ALTER FUNCTION public.secure_get_system_stats() SET search_path = public;
ALTER FUNCTION public.sync_app_role_to_granular() SET search_path = public;
ALTER FUNCTION public.update_inventory_status_on_loan_change() SET search_path = public;
ALTER FUNCTION public.update_inventory_status_on_loan_sold() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.user_has_permission(uuid, permission) SET search_path = public;
ALTER FUNCTION public.validate_inventory_audit_scan() SET search_path = public;

-- Functions that already have search_path set (from previous migrations)
-- These should already be fixed but we can confirm they're correct:
-- get_user_role, has_role, is_admin, log_audit_event, get_security_status
-- set_operation_pin, validate_operation_pin, check_password_leaked_status
-- validate_password_security, check_account_security_status
-- get_customer_data_safe, get_customer_safe, get_masked_customer_data
-- audit_customer_changes, log_sensitive_customer_access