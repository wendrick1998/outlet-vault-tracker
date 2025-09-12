-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins and managers can manage loans" ON public.loans;

-- Create new policies that allow users with can_withdraw permission
CREATE POLICY "Users with withdraw permission can create loans" 
ON public.loans 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND can_withdraw = true
  )
);

CREATE POLICY "Users with withdraw permission can update their loans" 
ON public.loans 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND can_withdraw = true
  )
);

CREATE POLICY "Admins and managers can manage all loans" 
ON public.loans 
FOR ALL 
TO authenticated 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Keep the existing view policy
-- (All authenticated users can view loans - this already exists)