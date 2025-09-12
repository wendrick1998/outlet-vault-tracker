-- Add must_change_password field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Create trigger for profile changes audit (if not exists)
DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_changes_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profile_changes();

-- Add index for better performance on password queries
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password 
ON public.profiles(must_change_password) 
WHERE must_change_password = true;