-- Criação do módulo de estoque de iPhones
-- Separado do inventário (que é para empréstimos)

-- Enum para status do estoque
CREATE TYPE public.stock_status AS ENUM (
    'disponivel',
    'reservado', 
    'vendido',
    'defeituoso',
    'manutencao',
    'promocao'
);

-- Enum para localização no estoque
CREATE TYPE public.stock_location AS ENUM (
    'vitrine',
    'estoque',
    'assistencia',
    'deposito',
    'loja_online',
    'conserto'
);

-- Tabela principal de itens do estoque
CREATE TABLE public.stock_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    imei TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Apple',
    color TEXT,
    storage TEXT,
    condition TEXT DEFAULT 'novo',
    battery_pct INTEGER DEFAULT 100,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    notes TEXT,
    status stock_status NOT NULL DEFAULT 'disponivel',
    location stock_location NOT NULL DEFAULT 'estoque',
    shelf_position TEXT, -- ex: "A1-B2", "VIT-01"
    acquisition_date DATE DEFAULT CURRENT_DATE,
    warranty_until DATE,
    supplier TEXT,
    purchase_order TEXT,
    serial_number TEXT,
    apple_model_id UUID, -- referência para device_models
    is_featured BOOLEAN DEFAULT false, -- destaque na vitrine
    view_count INTEGER DEFAULT 0, -- quantas vezes foi visualizado
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de relacionamento N:N entre produtos e etiquetas
CREATE TABLE public.stock_item_labels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    applied_by UUID REFERENCES public.profiles(id),
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(stock_item_id, label_id)
);

-- Tabela de movimentações do estoque
CREATE TABLE public.stock_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'entrada', 'saida', 'transferencia', 'reserva', 'venda'
    from_status stock_status,
    to_status stock_status,
    from_location stock_location,
    to_location stock_location,
    quantity INTEGER DEFAULT 1,
    reason TEXT,
    reference_number TEXT, -- número da nota, pedido, etc
    performed_by UUID REFERENCES public.profiles(id),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de conferências do estoque
CREATE TABLE public.stock_conferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location stock_location,
    status TEXT NOT NULL DEFAULT 'em_andamento',
    items_expected INTEGER DEFAULT 0,
    items_found INTEGER DEFAULT 0,
    items_missing INTEGER DEFAULT 0,
    discrepancies JSONB DEFAULT '[]'::jsonb,
    started_by UUID REFERENCES public.profiles(id),
    completed_by UUID,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Tabela de itens escaneados na conferência
CREATE TABLE public.stock_conference_scans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conference_id UUID NOT NULL REFERENCES public.stock_conferences(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES public.stock_items(id),
    imei_scanned TEXT NOT NULL,
    found BOOLEAN NOT NULL,
    location_found stock_location,
    scanned_by UUID REFERENCES public.profiles(id),
    scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_item_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_conference_scans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stock_items
CREATE POLICY "Usuários autenticados podem visualizar estoque" 
ON public.stock_items FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins e managers podem gerenciar estoque" 
ON public.stock_items FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Usuários podem criar itens do estoque" 
ON public.stock_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Políticas RLS para stock_item_labels
CREATE POLICY "Usuários autenticados podem visualizar etiquetas do estoque" 
ON public.stock_item_labels FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem aplicar etiquetas" 
ON public.stock_item_labels FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = applied_by);

CREATE POLICY "Admins e managers podem gerenciar etiquetas do estoque" 
ON public.stock_item_labels FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Políticas RLS para stock_movements
CREATE POLICY "Usuários autenticados podem visualizar movimentações" 
ON public.stock_movements FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem registrar movimentações" 
ON public.stock_movements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = performed_by);

CREATE POLICY "Admins e managers podem gerenciar movimentações" 
ON public.stock_movements FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Políticas RLS para stock_conferences
CREATE POLICY "Usuários podem visualizar suas conferências" 
ON public.stock_conferences FOR SELECT 
USING (auth.uid() = started_by OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Usuários podem criar conferências" 
ON public.stock_conferences FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = started_by);

CREATE POLICY "Usuários podem atualizar suas conferências" 
ON public.stock_conferences FOR UPDATE
USING (auth.uid() = started_by OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Políticas RLS para stock_conference_scans
CREATE POLICY "Usuários podem visualizar scans de conferências acessíveis" 
ON public.stock_conference_scans FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.stock_conferences 
    WHERE id = conference_id 
    AND (started_by = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
));

CREATE POLICY "Usuários podem registrar scans" 
ON public.stock_conference_scans FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = scanned_by);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_stock_items()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_items_updated_at
    BEFORE UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_stock_items();

-- Função para registrar movimentações automáticas
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Se status ou localização mudou, registra movimentação
        IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.location IS DISTINCT FROM NEW.location) THEN
            INSERT INTO public.stock_movements (
                stock_item_id,
                movement_type,
                from_status,
                to_status, 
                from_location,
                to_location,
                reason,
                performed_by
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'mudanca_status'
                    WHEN OLD.location IS DISTINCT FROM NEW.location THEN 'transferencia'
                    ELSE 'atualizacao'
                END,
                OLD.status,
                NEW.status,
                OLD.location,
                NEW.location,
                'Atualização automática do sistema',
                auth.uid()
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        -- Registra entrada no estoque
        INSERT INTO public.stock_movements (
            stock_item_id,
            movement_type,
            to_status,
            to_location,
            reason,
            performed_by
        ) VALUES (
            NEW.id,
            'entrada',
            NEW.status,
            NEW.location,
            'Cadastro inicial no estoque',
            NEW.created_by
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_stock_movement_trigger
    AFTER INSERT OR UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.log_stock_movement();

-- Índices para performance
CREATE INDEX idx_stock_items_imei ON public.stock_items(imei);
CREATE INDEX idx_stock_items_status ON public.stock_items(status);
CREATE INDEX idx_stock_items_location ON public.stock_items(location);
CREATE INDEX idx_stock_items_brand_model ON public.stock_items(brand, model);
CREATE INDEX idx_stock_items_created_at ON public.stock_items(created_at);
CREATE INDEX idx_stock_item_labels_stock_item ON public.stock_item_labels(stock_item_id);
CREATE INDEX idx_stock_movements_stock_item ON public.stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(performed_at);

-- Inserir alguns dados de exemplo para teste
INSERT INTO public.stock_items (imei, model, brand, color, storage, price, cost, status, location, created_by) 
VALUES 
    ('123456789012345', 'iPhone 15 Pro', 'Apple', 'Azul Titânio', '256GB', 8999.00, 7500.00, 'disponivel', 'vitrine', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
    ('123456789012346', 'iPhone 15', 'Apple', 'Rosa', '128GB', 6999.00, 5800.00, 'disponivel', 'estoque', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
    ('123456789012347', 'iPhone 14 Pro Max', 'Apple', 'Roxo Profundo', '512GB', 9999.00, 8200.00, 'reservado', 'vitrine', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));