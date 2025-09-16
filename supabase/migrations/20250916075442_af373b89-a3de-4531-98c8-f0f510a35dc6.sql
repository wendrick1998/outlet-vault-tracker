-- Fix search path security issues in functions
-- This addresses the "Function Search Path Mutable" warning

-- Update get_customer_secure function with explicit search_path
CREATE OR REPLACE FUNCTION public.get_customer_secure(
  customer_id UUID,
  access_purpose customer_access_purpose DEFAULT 'general_view'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  user_role app_role;
  customer_data customers%ROWTYPE;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Get customer data
  SELECT * INTO customer_data FROM customers WHERE id = customer_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Build response based on access purpose and user role
  CASE access_purpose
    WHEN 'search_only' THEN
      -- Minimal data for search results
      result := jsonb_build_object(
        'id', customer_data.id,
        'name', customer_data.name,
        'is_registered', customer_data.is_registered,
        'created_at', customer_data.created_at
      );
      
    WHEN 'general_view' THEN
      -- General viewing - mask sensitive data for non-admin/manager
      IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
        result := jsonb_build_object(
          'id', customer_data.id,
          'name', customer_data.name,
          'email', customer_data.email,
          'phone', customer_data.phone,
          'cpf', customer_data.cpf,
          'address', customer_data.address,
          'notes', customer_data.notes,
          'is_registered', customer_data.is_registered,
          'loan_limit', customer_data.loan_limit,
          'created_at', customer_data.created_at,
          'updated_at', customer_data.updated_at,
          'pending_data', customer_data.pending_data
        );
        
        -- Log admin/manager access to full data
        PERFORM log_audit_event(
          'customer_full_data_access',
          jsonb_build_object(
            'customer_id', customer_id,
            'access_purpose', access_purpose,
            'user_role', user_role,
            'fields_accessed', ARRAY['email', 'phone', 'cpf', 'address', 'notes']
          ),
          'customers',
          customer_id
        );
      ELSE
        -- Regular users get limited data
        result := jsonb_build_object(
          'id', customer_data.id,
          'name', customer_data.name,
          'is_registered', customer_data.is_registered,
          'loan_limit', customer_data.loan_limit,
          'created_at', customer_data.created_at,
          'updated_at', customer_data.updated_at
        );
      END IF;
      
    WHEN 'loan_processing' THEN
      -- For loan processing, even regular users need contact info but it's logged
      result := jsonb_build_object(
        'id', customer_data.id,
        'name', customer_data.name,
        'phone', customer_data.phone,  -- Needed for loan contact
        'is_registered', customer_data.is_registered,
        'loan_limit', customer_data.loan_limit,
        'created_at', customer_data.created_at,
        'updated_at', customer_data.updated_at
      );
      
      -- Log loan processing access
      PERFORM log_audit_event(
        'customer_loan_processing_access',
        jsonb_build_object(
          'customer_id', customer_id,
          'access_purpose', access_purpose,
          'user_role', user_role,
          'justification', 'Customer contact info accessed for loan processing'
        ),
        'customers',
        customer_id
      );
      
    WHEN 'administrative' THEN
      -- Full administrative access - heavily audited
      IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
        result := jsonb_build_object(
          'id', customer_data.id,
          'name', customer_data.name,
          'email', customer_data.email,
          'phone', customer_data.phone,
          'cpf', customer_data.cpf,
          'address', customer_data.address,
          'notes', customer_data.notes,
          'is_registered', customer_data.is_registered,
          'loan_limit', customer_data.loan_limit,
          'created_at', customer_data.created_at,
          'updated_at', customer_data.updated_at,
          'pending_data', customer_data.pending_data
        );
        
        -- Critical: Log all administrative access
        PERFORM log_audit_event(
          'customer_administrative_access',
          jsonb_build_object(
            'customer_id', customer_id,
            'access_purpose', access_purpose,
            'user_role', user_role,
            'ip_address', inet_client_addr(),
            'timestamp', now(),
            'all_fields_accessed', true
          ),
          'customers',
          customer_id
        );
      ELSE
        -- Unauthorized access attempt
        PERFORM log_audit_event(
          'unauthorized_customer_access_attempt',
          jsonb_build_object(
            'customer_id', customer_id,
            'access_purpose', access_purpose,
            'user_role', user_role,
            'blocked', true
          ),
          'customers',
          customer_id
        );
        RETURN NULL;
      END IF;
  END CASE;
  
  RETURN result;
END;
$$;

-- Update search_customers_secure function with explicit search_path
CREATE OR REPLACE FUNCTION public.search_customers_secure(
  search_term TEXT,
  search_type TEXT DEFAULT 'name'
)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB[] := ARRAY[]::JSONB[];
  customer_record customers%ROWTYPE;
  user_role app_role;
  search_pattern TEXT;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Sanitize search term
  search_pattern := '%' || lower(trim(search_term)) || '%';
  
  -- Log search operation
  PERFORM log_audit_event(
    'customer_search',
    jsonb_build_object(
      'search_type', search_type,
      'search_term_length', length(search_term),
      'user_role', user_role
    )
  );
  
  -- Perform search based on type and user permissions
  FOR customer_record IN 
    SELECT * FROM customers 
    WHERE CASE search_type
      WHEN 'email' THEN 
        (user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) AND lower(email) LIKE search_pattern)
      WHEN 'phone' THEN 
        (user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) AND phone LIKE search_pattern)
      WHEN 'cpf' THEN 
        (user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) AND cpf LIKE search_pattern)
      ELSE 
        lower(name) LIKE search_pattern
    END
    ORDER BY name ASC
    LIMIT 50  -- Prevent excessive data exposure
  LOOP
    -- Add search result with minimal data exposure
    result := result || get_customer_secure(customer_record.id, 'search_only'::customer_access_purpose);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Update get_customers_secure function with explicit search_path
CREATE OR REPLACE FUNCTION public.get_customers_secure(
  access_purpose customer_access_purpose DEFAULT 'general_view'
)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB[] := ARRAY[]::JSONB[];
  customer_record customers%ROWTYPE;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Log list access
  PERFORM log_audit_event(
    'customers_list_access',
    jsonb_build_object(
      'access_purpose', access_purpose,
      'user_role', user_role
    )
  );
  
  -- Get customers with purpose-based security
  FOR customer_record IN 
    SELECT * FROM customers ORDER BY name ASC
  LOOP
    result := result || get_customer_secure(customer_record.id, access_purpose);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Update get_registered_customers_secure function with explicit search_path
CREATE OR REPLACE FUNCTION public.get_registered_customers_secure()
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB[] := ARRAY[]::JSONB[];
  customer_record customers%ROWTYPE;
BEGIN
  -- Log access
  PERFORM log_audit_event(
    'registered_customers_access',
    jsonb_build_object('user_role', get_user_role(auth.uid()))
  );
  
  FOR customer_record IN 
    SELECT * FROM customers 
    WHERE is_registered = true 
    ORDER BY name ASC
  LOOP
    result := result || get_customer_secure(customer_record.id, 'general_view'::customer_access_purpose);
  END LOOP;
  
  RETURN result;
END;
$$;