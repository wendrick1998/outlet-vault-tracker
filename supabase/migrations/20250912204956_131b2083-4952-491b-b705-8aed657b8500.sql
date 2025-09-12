-- Create table for devices left at store
CREATE TABLE public.devices_left_at_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  model TEXT,
  imei TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices_left_at_store ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view devices left at store"
ON public.devices_left_at_store
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create device left records"
ON public.devices_left_at_store
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins and managers can manage all device left records"
ON public.devices_left_at_store
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_devices_left_at_store_updated_at
BEFORE UPDATE ON public.devices_left_at_store
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Expand pending loan types
ALTER TYPE pending_loan_type ADD VALUE IF NOT EXISTS 'missing_device_left_info';
ALTER TYPE pending_loan_type ADD VALUE IF NOT EXISTS 'incomplete_customer_contact';

-- Add foreign key reference to loans table
ALTER TABLE public.devices_left_at_store 
ADD CONSTRAINT devices_left_at_store_loan_id_fkey 
FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_devices_left_at_store_loan_id ON public.devices_left_at_store(loan_id);
CREATE INDEX idx_devices_left_at_store_created_by ON public.devices_left_at_store(created_by);