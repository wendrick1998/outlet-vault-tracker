-- Add battery_pct column to inventory
ALTER TABLE public.inventory 
ADD COLUMN battery_pct INTEGER NOT NULL DEFAULT 100;

-- Add constraint to ensure battery_pct is between 0 and 100
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_battery_pct_check CHECK (battery_pct >= 0 AND battery_pct <= 100);

-- Create brands catalog
CREATE TABLE public.brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalog_colors
CREATE TABLE public.catalog_colors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalog_storages
CREATE TABLE public.catalog_storages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    size_gb INTEGER NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalog_conditions
CREATE TABLE public.catalog_conditions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create labels (status tags)
CREATE TABLE public.labels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6B7280',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key columns to inventory
ALTER TABLE public.inventory 
ADD COLUMN brand_id UUID REFERENCES public.brands(id),
ADD COLUMN color_id UUID REFERENCES public.catalog_colors(id),
ADD COLUMN storage_id UUID REFERENCES public.catalog_storages(id),
ADD COLUMN condition_id UUID REFERENCES public.catalog_conditions(id);

-- Add can_withdraw column to profiles
ALTER TABLE public.profiles
ADD COLUMN can_withdraw BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_storages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalogs (read for all authenticated, write for admin/manager)
CREATE POLICY "Anyone can view active catalog items" ON public.brands
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage brands" ON public.brands
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Anyone can view active colors" ON public.catalog_colors
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage colors" ON public.catalog_colors
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Anyone can view active storages" ON public.catalog_storages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage storages" ON public.catalog_storages
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Anyone can view active conditions" ON public.catalog_conditions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage conditions" ON public.catalog_conditions
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Anyone can view active labels" ON public.labels
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage labels" ON public.labels
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Insert default conditions
INSERT INTO public.catalog_conditions (code, label) VALUES
    ('novo', 'Novo'),
    ('seminovo', 'Seminovo'),
    ('usado', 'Usado');

-- Insert default storage options
INSERT INTO public.catalog_storages (size_gb, display_name) VALUES
    (64, '64GB'),
    (128, '128GB'),
    (256, '256GB'),
    (512, '512GB'),
    (1024, '1TB'),
    (2048, '2TB');

-- Insert default colors
INSERT INTO public.catalog_colors (name) VALUES
    ('Preto'),
    ('Branco'),
    ('Grafite'),
    ('Estelar'),
    ('Meia-noite'),
    ('Azul'),
    ('Rosa'),
    ('Roxo'),
    ('(PRODUCT)RED'),
    ('Verde'),
    ('Amarelo'),
    ('Titânio Natural'),
    ('Titânio Azul'),
    ('Titânio Branco'),
    ('Titânio Preto');

-- Insert default brands
INSERT INTO public.brands (name) VALUES
    ('Apple'),
    ('Samsung'),
    ('Motorola'),
    ('Xiaomi'),
    ('Huawei'),
    ('OnePlus');

-- Create updated_at trigger for new tables
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_colors_updated_at
    BEFORE UPDATE ON public.catalog_colors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_storages_updated_at
    BEFORE UPDATE ON public.catalog_storages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_conditions_updated_at
    BEFORE UPDATE ON public.catalog_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_labels_updated_at
    BEFORE UPDATE ON public.labels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();