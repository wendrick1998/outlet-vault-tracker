-- Migração corrigida com enums válidos para unificação do sistema de estoque

-- Inserir itens do inventory que não existem em stock_items
INSERT INTO public.stock_items (
    imei,
    brand,
    model,
    color,
    storage,
    condition,
    battery_pct,
    notes,
    status,
    location,
    created_at,
    updated_at
)
SELECT 
    i.imei,
    i.brand,
    i.model,
    i.color,
    i.storage,
    i.condition,
    COALESCE(i.battery_pct, 100),
    i.notes,
    -- Mapear status do inventory para stock_status
    CASE 
        WHEN i.status = 'available' THEN 'disponivel'::stock_status
        WHEN i.status = 'loaned' THEN 'reservado'::stock_status -- Usar reservado para emprestado
        WHEN i.status = 'sold' THEN 'vendido'::stock_status
        WHEN i.status = 'maintenance' THEN 'manutencao'::stock_status
        ELSE 'disponivel'::stock_status
    END,
    'estoque'::stock_location,
    i.created_at,
    i.updated_at
FROM public.inventory i
WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_items s WHERE s.imei = i.imei
)
AND i.is_archived = false;

-- Adicionar coluna inventory_id para manter referência
ALTER TABLE public.stock_items 
ADD COLUMN IF NOT EXISTS inventory_id uuid REFERENCES public.inventory(id);

-- Atualizar stock_items existentes com referência ao inventory
UPDATE public.stock_items s
SET inventory_id = i.id
FROM public.inventory i
WHERE s.imei = i.imei AND s.inventory_id IS NULL;

-- Função para sincronizar status baseado em empréstimos
CREATE OR REPLACE FUNCTION public.sync_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.stock_items 
        SET 
            status = CASE 
                WHEN NEW.status = 'active' THEN 'reservado'::stock_status -- Emprestado = reservado
                WHEN NEW.status = 'returned' THEN 'disponivel'::stock_status 
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'lost' THEN 'defeituoso'::stock_status -- Perdido = defeituoso
                ELSE status
            END,
            updated_at = now()
        WHERE inventory_id = NEW.item_id OR imei = (
            SELECT imei FROM public.inventory WHERE id = NEW.item_id
        );
        
        -- Também atualizar o inventory original
        UPDATE public.inventory
        SET 
            status = CASE 
                WHEN NEW.status = 'active' THEN 'loaned'::inventory_status
                WHEN NEW.status = 'returned' THEN 'available'::inventory_status
                WHEN NEW.status = 'sold' THEN 'sold'::inventory_status
                WHEN NEW.status = 'lost' THEN 'maintenance'::inventory_status -- Perdido como manutenção
                ELSE status
            END,
            updated_at = now()
        WHERE id = NEW.item_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.stock_items 
        SET 
            status = 'disponivel'::stock_status,
            updated_at = now()
        WHERE inventory_id = OLD.item_id OR imei = (
            SELECT imei FROM public.inventory WHERE id = OLD.item_id
        );
        
        UPDATE public.inventory
        SET 
            status = 'available'::inventory_status,
            updated_at = now()
        WHERE id = OLD.item_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS sync_stock_on_loan_change ON public.loans;
CREATE TRIGGER sync_stock_on_loan_change
    AFTER INSERT OR UPDATE OR DELETE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_stock_status();

-- Função para sincronizar quando inventory é atualizado
CREATE OR REPLACE FUNCTION public.sync_stock_from_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.stock_items 
        SET 
            status = CASE 
                WHEN NEW.status = 'available' THEN 'disponivel'::stock_status
                WHEN NEW.status = 'loaned' THEN 'reservado'::stock_status
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'maintenance' THEN 'manutencao'::stock_status
                ELSE status
            END,
            brand = NEW.brand,
            model = NEW.model,
            color = NEW.color,
            storage = NEW.storage,
            condition = NEW.condition,
            battery_pct = COALESCE(NEW.battery_pct, battery_pct),
            notes = NEW.notes,
            updated_at = now()
        WHERE inventory_id = NEW.id OR imei = NEW.imei;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.stock_items (
            inventory_id, imei, brand, model, color, storage,
            condition, battery_pct, notes, status, location
        ) VALUES (
            NEW.id, NEW.imei, NEW.brand, NEW.model, NEW.color, NEW.storage,
            NEW.condition, COALESCE(NEW.battery_pct, 100), NEW.notes,
            CASE 
                WHEN NEW.status = 'available' THEN 'disponivel'::stock_status
                WHEN NEW.status = 'loaned' THEN 'reservado'::stock_status
                WHEN NEW.status = 'sold' THEN 'vendido'::stock_status
                WHEN NEW.status = 'maintenance' THEN 'manutencao'::stock_status
                ELSE 'disponivel'::stock_status
            END,
            'estoque'::stock_location
        ) ON CONFLICT (imei) DO UPDATE SET
            inventory_id = NEW.id,
            brand = NEW.brand,
            model = NEW.model,
            color = NEW.color,
            storage = NEW.storage,
            condition = NEW.condition,
            battery_pct = COALESCE(NEW.battery_pct, stock_items.battery_pct),
            notes = NEW.notes,
            updated_at = now();
            
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar de inventory para stock
DROP TRIGGER IF EXISTS sync_stock_from_inventory_trigger ON public.inventory;
CREATE TRIGGER sync_stock_from_inventory_trigger
    AFTER INSERT OR UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_stock_from_inventory();

-- Sincronizar status atual baseado em empréstimos ativos
UPDATE public.stock_items 
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM public.loans l 
        JOIN public.inventory i ON l.item_id = i.id 
        WHERE i.imei = stock_items.imei 
        AND l.status = 'active'
    ) THEN 'reservado'::stock_status
    WHEN EXISTS (
        SELECT 1 FROM public.loans l 
        JOIN public.inventory i ON l.item_id = i.id 
        WHERE i.imei = stock_items.imei 
        AND l.status = 'sold'
    ) THEN 'vendido'::stock_status
    ELSE 'disponivel'::stock_status
END;