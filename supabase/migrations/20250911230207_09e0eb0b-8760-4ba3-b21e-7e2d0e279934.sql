-- Update RLS policies to be more secure and specific
-- Replace overly permissive policies with proper authentication checks

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.inventory;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.item_notes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.loans;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.reasons;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.sellers;

-- Create more secure policies for customers table
CREATE POLICY "Authenticated users can view customers" 
ON public.customers FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create customers" 
ON public.customers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create more secure policies for inventory table
CREATE POLICY "Authenticated users can view inventory" 
ON public.inventory FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory" 
ON public.inventory FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update inventory" 
ON public.inventory FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete inventory" 
ON public.inventory FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create more secure policies for item_notes table
CREATE POLICY "Authenticated users can view item_notes" 
ON public.item_notes FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create item_notes" 
ON public.item_notes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update item_notes" 
ON public.item_notes FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete item_notes" 
ON public.item_notes FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create more secure policies for loans table
CREATE POLICY "Authenticated users can view loans" 
ON public.loans FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create loans" 
ON public.loans FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update loans" 
ON public.loans FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete loans" 
ON public.loans FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create more secure policies for reasons table
CREATE POLICY "Authenticated users can view reasons" 
ON public.reasons FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create reasons" 
ON public.reasons FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reasons" 
ON public.reasons FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete reasons" 
ON public.reasons FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create more secure policies for sellers table
CREATE POLICY "Authenticated users can view sellers" 
ON public.sellers FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sellers" 
ON public.sellers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sellers" 
ON public.sellers FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sellers" 
ON public.sellers FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);