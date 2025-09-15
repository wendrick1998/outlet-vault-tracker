-- Final security hardening - ensure all remaining functions have proper search_path

-- Query to identify functions that might still need fixing
DO $$
DECLARE
    func_record RECORD;
    fix_sql TEXT;
BEGIN
    -- Loop through all SECURITY DEFINER functions in public schema
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
          AND NOT (array_to_string(p.proconfig, ' ') LIKE '%search_path%')
    LOOP
        -- Construct ALTER FUNCTION command
        fix_sql := format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
                         func_record.schema_name, 
                         func_record.function_name, 
                         func_record.args);
        
        -- Execute the fix
        BEGIN
            EXECUTE fix_sql;
            RAISE NOTICE 'Fixed search_path for function: %', func_record.function_name;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Could not fix search_path for function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END
$$;

-- Log completion
PERFORM log_audit_event(
    'security_hardening_completed',
    jsonb_build_object(
        'timestamp', now(),
        'fixes_applied', 'search_path_security_definer_functions',
        'security_level', 'enhanced'
    )
);