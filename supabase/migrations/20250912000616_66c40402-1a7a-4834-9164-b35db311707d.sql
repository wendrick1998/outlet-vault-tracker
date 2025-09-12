-- Create admin profile for wendrick.1761998@gmail.com
-- First, get the user ID from auth.users to ensure we use the correct ID
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID from auth.users table
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'wendrick.1761998@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert or update the profile with admin role
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'wendrick.1761998@gmail.com',
            'Wendrick Admin',
            'admin'::app_role,
            true,
            now(),
            now()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = 'admin'::app_role,
            is_active = true,
            updated_at = now();
            
        RAISE NOTICE 'Admin profile created/updated for user: %', user_uuid;
    ELSE
        RAISE NOTICE 'User with email wendrick.1761998@gmail.com not found in auth.users';
    END IF;
END $$;