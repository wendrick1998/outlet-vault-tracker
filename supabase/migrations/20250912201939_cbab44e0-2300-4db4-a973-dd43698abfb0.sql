-- Add missing fields to customers table
ALTER TABLE public.customers ADD COLUMN cpf text;
ALTER TABLE public.customers ADD COLUMN address text;
ALTER TABLE public.customers ADD COLUMN loan_limit integer DEFAULT 3;
ALTER TABLE public.customers ADD COLUMN notes text;
ALTER TABLE public.customers ADD COLUMN pending_data jsonb;

-- Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON public.customers(cpf) WHERE cpf IS NOT NULL;

-- Add constraint for CPF format (11 digits)
ALTER TABLE public.customers ADD CONSTRAINT cpf_format_check CHECK (cpf IS NULL OR (length(cpf) = 11 AND cpf ~ '^\d{11}$'));

-- Create enum for pending loan types
CREATE TYPE public.pending_loan_type AS ENUM ('incomplete_customer_data', 'missing_cpf', 'missing_contact');

-- Create pending_loans table for incomplete loan data
CREATE TABLE public.pending_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory(id),
  customer_name text,
  customer_phone text,
  customer_cpf text,
  pending_type pending_loan_type NOT NULL DEFAULT 'incomplete_customer_data',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid NOT NULL,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for pending_loans
ALTER TABLE public.pending_loans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_loans
CREATE POLICY "Users can view their own pending loans" 
ON public.pending_loans 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can view all pending loans" 
ON public.pending_loans 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Users can create pending loans" 
ON public.pending_loans 
FOR INSERT 
WITH CHECK (created_by = auth.uid() AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND is_active = true AND can_withdraw = true
));

CREATE POLICY "Users can update their own pending loans" 
ON public.pending_loans 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can manage all pending loans" 
ON public.pending_loans 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_pending_loans_updated_at
BEFORE UPDATE ON public.pending_loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();