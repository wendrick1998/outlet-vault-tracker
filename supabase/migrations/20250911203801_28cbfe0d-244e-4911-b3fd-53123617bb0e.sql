-- =============================================
-- COFRE TRACKER - FASE 1: SCHEMA CREATION
-- =============================================

-- Create ENUM types first
CREATE TYPE public.inventory_status AS ENUM ('available', 'loaned', 'sold', 'maintenance');
CREATE TYPE public.loan_status AS ENUM ('active', 'returned', 'overdue');

-- =============================================
-- TABLE: inventory
-- =============================================
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imei TEXT UNIQUE NOT NULL CHECK (length(imei) >= 15),
    suffix TEXT GENERATED ALWAYS AS (right(imei, 4)) STORED,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    storage TEXT,
    status inventory_status NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for fast IMEI searches
CREATE INDEX idx_inventory_imei ON public.inventory(imei);
CREATE INDEX idx_inventory_suffix ON public.inventory(suffix);
CREATE INDEX idx_inventory_status ON public.inventory(status);

-- =============================================
-- TABLE: reasons
-- =============================================
CREATE TABLE public.reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    requires_customer BOOLEAN NOT NULL DEFAULT false,
    requires_seller BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: sellers
-- =============================================
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: customers
-- =============================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_registered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: loans
-- =============================================
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
    reason_id UUID NOT NULL REFERENCES public.reasons(id) ON DELETE RESTRICT,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    status loan_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for fast loan queries
CREATE INDEX idx_loans_item_id ON public.loans(item_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_issued_at ON public.loans(issued_at);
CREATE INDEX idx_loans_due_at ON public.loans(due_at);

-- =============================================
-- TABLE: item_notes
-- =============================================
CREATE TABLE public.item_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for item notes
CREATE INDEX idx_item_notes_item_id ON public.item_notes(item_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_notes ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations for authenticated users
-- Later we can refine these policies based on user roles
CREATE POLICY "Allow all for authenticated users" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.reasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.item_notes FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update inventory status when loan is created/returned
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_loan_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If loan is being created as active
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.inventory SET status = 'loaned' WHERE id = NEW.item_id;
    END IF;
    
    -- If loan status is being changed to returned
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = NEW.item_id;
        NEW.returned_at = now();
    END IF;
    
    -- If loan is being deleted (return item to available)
    IF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE public.inventory SET status = 'available' WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for inventory status updates
CREATE TRIGGER update_inventory_status_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.loans 
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_status_on_loan_change();

-- =============================================
-- INITIAL DATA FROM MOCK
-- =============================================

-- Insert reasons
INSERT INTO public.reasons (name, requires_customer, requires_seller, description) VALUES
('Empréstimo para Cliente', true, false, 'Empréstimo temporário para cliente registrado'),
('Teste com Vendedor', false, true, 'Dispositivo em teste com vendedor da loja'),
('Reparo Externo', false, false, 'Dispositivo enviado para reparo em assistência externa'),
('Demonstração', false, true, 'Dispositivo usado para demonstração por vendedor'),
('Análise Técnica', false, false, 'Dispositivo em análise técnica detalhada');

-- Insert sellers
INSERT INTO public.sellers (name, phone, email, is_active) VALUES
('Carlos Silva', '(11) 99999-1234', 'carlos@loja.com', true),
('Maria Santos', '(11) 98888-5678', 'maria@loja.com', true),
('João Oliveira', '(11) 97777-9012', 'joao@loja.com', true),
('Ana Costa', '(11) 96666-3456', 'ana@loja.com', false),
('Pedro Lima', '(11) 95555-7890', 'pedro@loja.com', true);

-- Insert customers
INSERT INTO public.customers (name, phone, email, is_registered) VALUES
('Roberto Ferreira', '(11) 91111-2222', 'roberto@email.com', true),
('Lucia Mendes', '(11) 92222-3333', 'lucia@email.com', true),
('Fernando Castro', '(11) 93333-4444', null, false),
('Patricia Rocha', '(11) 94444-5555', 'patricia@email.com', true),
('Marcos Almeida', '(11) 95555-6666', null, false),
('Juliana Torres', '(11) 96666-7777', 'juliana@email.com', true),
('Ricardo Souza', '(11) 97777-8888', null, false),
('Camila Dias', '(11) 98888-9999', 'camila@email.com', true);

-- Insert inventory items
INSERT INTO public.inventory (imei, brand, model, color, storage, status, notes) VALUES
('123456789012345', 'Apple', 'iPhone 14', 'Azul', '128GB', 'available', null),
('234567890123456', 'Apple', 'iPhone 13', 'Preto', '256GB', 'available', 'Pequeno risco na tela'),
('345678901234567', 'Samsung', 'Galaxy S23', 'Branco', '128GB', 'available', null),
('456789012345678', 'Apple', 'iPhone 12', 'Verde', '64GB', 'available', null),
('567890123456789', 'Samsung', 'Galaxy A54', 'Azul', '128GB', 'available', null),
('678901234567890', 'Apple', 'iPhone 14 Pro', 'Roxo', '512GB', 'available', 'Estado impecável'),
('789012345678901', 'Samsung', 'Galaxy S22', 'Preto', '256GB', 'available', null),
('890123456789012', 'Apple', 'iPhone 13 Pro', 'Ouro', '128GB', 'available', null),
('901234567890123', 'Samsung', 'Galaxy A34', 'Rosa', '128GB', 'available', null),
('012345678901234', 'Apple', 'iPhone 15', 'Azul', '256GB', 'available', null),
('112345678901234', 'Samsung', 'Galaxy Z Flip5', 'Lavanda', '256GB', 'available', 'Edição especial');

-- Insert active loans (these will automatically update inventory status via trigger)
-- Get IDs for foreign keys
DO $$
DECLARE
    loan_reason_id UUID;
    test_reason_id UUID;
    repair_reason_id UUID;
    carlos_id UUID;
    maria_id UUID;
    roberto_id UUID;
    lucia_id UUID;
    fernando_id UUID;
    iphone14_id UUID;
    galaxys23_id UUID;
    iphone12_id UUID;
BEGIN
    -- Get reason IDs
    SELECT id INTO loan_reason_id FROM public.reasons WHERE name = 'Empréstimo para Cliente';
    SELECT id INTO test_reason_id FROM public.reasons WHERE name = 'Teste com Vendedor';
    SELECT id INTO repair_reason_id FROM public.reasons WHERE name = 'Reparo Externo';
    
    -- Get seller IDs
    SELECT id INTO carlos_id FROM public.sellers WHERE name = 'Carlos Silva';
    SELECT id INTO maria_id FROM public.sellers WHERE name = 'Maria Santos';
    
    -- Get customer IDs
    SELECT id INTO roberto_id FROM public.customers WHERE name = 'Roberto Ferreira';
    SELECT id INTO lucia_id FROM public.customers WHERE name = 'Lucia Mendes';
    SELECT id INTO fernando_id FROM public.customers WHERE name = 'Fernando Castro';
    
    -- Get inventory IDs
    SELECT id INTO iphone14_id FROM public.inventory WHERE imei = '123456789012345';
    SELECT id INTO galaxys23_id FROM public.inventory WHERE imei = '345678901234567';
    SELECT id INTO iphone12_id FROM public.inventory WHERE imei = '456789012345678';
    
    -- Insert loans
    INSERT INTO public.loans (item_id, reason_id, seller_id, customer_id, issued_at, due_at, status, notes) VALUES
    (iphone14_id, loan_reason_id, null, roberto_id, now() - interval '2 days', now() + interval '5 days', 'active', 'Cliente confiável, prazo estendido'),
    (galaxys23_id, test_reason_id, carlos_id, null, now() - interval '1 day', now() + interval '2 days', 'active', 'Teste de funcionalidades avançadas'),
    (iphone12_id, repair_reason_id, null, null, now() - interval '3 days', now() + interval '4 days', 'active', 'Problema na bateria - Assistência Técnica Central');
END $$;

-- =============================================
-- UTILITY FUNCTIONS FOR STATS
-- =============================================

-- Function to get system statistics
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON AS $$
DECLARE
    total_items INTEGER;
    available_items INTEGER;
    loaned_items INTEGER;
    active_loans INTEGER;
    overdue_loans INTEGER;
    total_customers INTEGER;
    registered_customers INTEGER;
    total_sellers INTEGER;
    active_sellers INTEGER;
    avg_loan_duration INTERVAL;
BEGIN
    -- Get inventory stats
    SELECT COUNT(*) INTO total_items FROM public.inventory;
    SELECT COUNT(*) INTO available_items FROM public.inventory WHERE status = 'available';
    SELECT COUNT(*) INTO loaned_items FROM public.inventory WHERE status = 'loaned';
    
    -- Get loan stats
    SELECT COUNT(*) INTO active_loans FROM public.loans WHERE status = 'active';
    SELECT COUNT(*) INTO overdue_loans FROM public.loans WHERE status = 'active' AND due_at < now();
    
    -- Get customer stats
    SELECT COUNT(*) INTO total_customers FROM public.customers;
    SELECT COUNT(*) INTO registered_customers FROM public.customers WHERE is_registered = true;
    
    -- Get seller stats
    SELECT COUNT(*) INTO total_sellers FROM public.sellers;
    SELECT COUNT(*) INTO active_sellers FROM public.sellers WHERE is_active = true;
    
    -- Get average loan duration
    SELECT AVG(COALESCE(returned_at, now()) - issued_at) INTO avg_loan_duration 
    FROM public.loans WHERE status IN ('active', 'returned');
    
    RETURN json_build_object(
        'inventory', json_build_object(
            'total', total_items,
            'available', available_items,
            'loaned', loaned_items,
            'utilizationRate', CASE WHEN total_items > 0 THEN ROUND((loaned_items::DECIMAL / total_items::DECIMAL) * 100, 1) ELSE 0 END
        ),
        'loans', json_build_object(
            'active', active_loans,
            'overdue', overdue_loans,
            'overdueRate', CASE WHEN active_loans > 0 THEN ROUND((overdue_loans::DECIMAL / active_loans::DECIMAL) * 100, 1) ELSE 0 END,
            'avgDurationDays', CASE WHEN avg_loan_duration IS NOT NULL THEN EXTRACT(DAYS FROM avg_loan_duration) ELSE 0 END
        ),
        'customers', json_build_object(
            'total', total_customers,
            'registered', registered_customers,
            'registrationRate', CASE WHEN total_customers > 0 THEN ROUND((registered_customers::DECIMAL / total_customers::DECIMAL) * 100, 1) ELSE 0 END
        ),
        'sellers', json_build_object(
            'total', total_sellers,
            'active', active_sellers
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;