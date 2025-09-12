-- Create enum for pending sales status
CREATE TYPE pending_sale_status AS ENUM ('pending', 'resolved');

-- Create pending_sales table
CREATE TABLE public.pending_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  item_id UUID NOT NULL,
  sale_number TEXT,
  status pending_sale_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  resolved_by UUID,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pending sales"
ON public.pending_sales
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can view all pending sales"
ON public.pending_sales
FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Users can create pending sales"  
ON public.pending_sales
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND can_withdraw = true
  )
);

CREATE POLICY "Users can update their own pending sales"
ON public.pending_sales
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins and managers can manage all pending sales"
ON public.pending_sales
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_pending_sales_updated_at
BEFORE UPDATE ON public.pending_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_pending_sales_status ON public.pending_sales(status);
CREATE INDEX idx_pending_sales_created_by ON public.pending_sales(created_by);
CREATE INDEX idx_pending_sales_loan_id ON public.pending_sales(loan_id);
CREATE INDEX idx_pending_sales_created_at ON public.pending_sales(created_at);