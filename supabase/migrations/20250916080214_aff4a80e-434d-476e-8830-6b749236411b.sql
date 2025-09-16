-- Implement field-level access controls and just-in-time sensitive data access
-- This adds additional security layers even for admin/manager roles

-- Create session-based sensitive data access tracking
CREATE TABLE IF NOT EXISTS sensitive_data_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  access_reason TEXT NOT NULL,
  approved_fields TEXT[] NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on sensitive access sessions
ALTER TABLE sensitive_data_access_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins and the session owner can access sessions
CREATE POLICY "Users can manage their own access sessions"
ON sensitive_data_access_sessions
FOR ALL
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'::app_role);

-- Function to request temporary access to sensitive customer fields
CREATE OR REPLACE FUNCTION request_sensitive_data_access(
  customer_id UUID,
  requested_fields TEXT[],
  business_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role app_role;
  session_id UUID;
  approved_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Only admin/manager can request sensitive data access
  IF user_role NOT IN ('admin'::app_role, 'manager'::app_role) THEN
    PERFORM log_audit_event(
      'sensitive_data_access_denied',
      jsonb_build_object(
        'customer_id', customer_id,
        'requested_fields', requested_fields,
        'reason', 'insufficient_privileges',
        'user_role', user_role
      )
    );
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;
  
  -- Validate requested fields
  approved_fields := ARRAY(
    SELECT unnest(requested_fields) 
    WHERE unnest(requested_fields) IN ('email', 'phone', 'cpf', 'address', 'notes')
  );
  
  -- Create temporary access session (15 minutes)
  INSERT INTO sensitive_data_access_sessions (
    user_id, customer_id, access_reason, approved_fields
  ) VALUES (
    auth.uid(), customer_id, business_reason, approved_fields
  ) RETURNING id INTO session_id;
  
  -- Log the access request
  PERFORM log_audit_event(
    'sensitive_data_access_requested',
    jsonb_build_object(
      'customer_id', customer_id,
      'session_id', session_id,
      'requested_fields', requested_fields,
      'approved_fields', approved_fields,
      'business_reason', business_reason,
      'expires_in_minutes', 15
    ),
    'customers',
    customer_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', session_id,
    'approved_fields', approved_fields,
    'expires_at', now() + INTERVAL '15 minutes'
  );
END;
$$;

-- Function to get customer data with active session validation
CREATE OR REPLACE FUNCTION get_customer_with_session_validation(
  customer_id UUID,
  session_id UUID DEFAULT NULL
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
  session_data sensitive_data_access_sessions%ROWTYPE;
  sensitive_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get current user role
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Get customer data
  SELECT * INTO customer_data FROM customers WHERE id = customer_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Check for active session if provided
  IF session_id IS NOT NULL THEN
    SELECT * INTO session_data 
    FROM sensitive_data_access_sessions 
    WHERE id = session_id 
      AND user_id = auth.uid() 
      AND customer_id = get_customer_with_session_validation.customer_id
      AND expires_at > now() 
      AND is_active = true;
      
    IF FOUND THEN
      sensitive_fields := session_data.approved_fields;
      
      -- Mark session as used
      UPDATE sensitive_data_access_sessions 
      SET used_at = now() 
      WHERE id = session_id;
      
      -- Log session usage
      PERFORM log_audit_event(
        'sensitive_data_session_used',
        jsonb_build_object(
          'customer_id', customer_id,
          'session_id', session_id,
          'accessed_fields', sensitive_fields
        ),
        'customers',
        customer_id
      );
    END IF;
  END IF;
  
  -- Build response based on role and session
  IF user_role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]) THEN
    result := jsonb_build_object(
      'id', customer_data.id,
      'name', customer_data.name,
      'is_registered', customer_data.is_registered,
      'loan_limit', customer_data.loan_limit,
      'created_at', customer_data.created_at,
      'updated_at', customer_data.updated_at
    );
    
    -- Add sensitive fields only if session authorizes them
    IF 'email' = ANY(sensitive_fields) THEN
      result := result || jsonb_build_object('email', customer_data.email);
    END IF;
    
    IF 'phone' = ANY(sensitive_fields) THEN
      result := result || jsonb_build_object('phone', customer_data.phone);
    END IF;
    
    IF 'cpf' = ANY(sensitive_fields) THEN
      result := result || jsonb_build_object('cpf', customer_data.cpf);
    END IF;
    
    IF 'address' = ANY(sensitive_fields) THEN
      result := result || jsonb_build_object('address', customer_data.address);
    END IF;
    
    IF 'notes' = ANY(sensitive_fields) THEN
      result := result || jsonb_build_object('notes', customer_data.notes);
    END IF;
    
  ELSE
    -- Regular users get minimal data
    result := jsonb_build_object(
      'id', customer_data.id,
      'name', customer_data.name,
      'is_registered', customer_data.is_registered,
      'created_at', customer_data.created_at
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_access_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Archive expired sessions
  UPDATE sensitive_data_access_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  -- Log cleanup
  PERFORM log_audit_event(
    'sensitive_data_sessions_cleaned',
    jsonb_build_object('cleaned_at', now())
  );
END;
$$;