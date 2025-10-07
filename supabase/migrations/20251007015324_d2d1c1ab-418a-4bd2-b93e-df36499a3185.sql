-- SPRINT 1: Sistema de Conferência de Estoque - Correções Críticas SQL

-- 1. Criar trigger para auto-update de contadores na tabela inventory_audits
CREATE OR REPLACE FUNCTION update_audit_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar contadores baseado no tipo de scan
  UPDATE inventory_audits
  SET
    found_count = CASE 
      WHEN NEW.scan_result = 'found_expected' THEN found_count + 1
      ELSE found_count
    END,
    unexpected_count = CASE 
      WHEN NEW.scan_result = 'unexpected_present' THEN unexpected_count + 1
      ELSE unexpected_count
    END,
    duplicate_count = CASE 
      WHEN NEW.scan_result = 'duplicate' THEN duplicate_count + 1
      ELSE duplicate_count
    END,
    incongruent_count = CASE 
      WHEN NEW.scan_result = 'status_incongruent' THEN incongruent_count + 1
      ELSE incongruent_count
    END,
    updated_at = NOW()
  WHERE id = NEW.audit_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_audit_counts ON inventory_audit_scans;
CREATE TRIGGER trigger_update_audit_counts
  AFTER INSERT ON inventory_audit_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_counters();

-- 2. Adicionar índices únicos para prevenir duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_scans_unique_imei 
ON inventory_audit_scans(audit_id, imei) 
WHERE imei IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_scans_unique_serial 
ON inventory_audit_scans(audit_id, serial) 
WHERE serial IS NOT NULL;

-- 3. Adicionar campos para tracking de localização
ALTER TABLE inventory_audits 
ADD COLUMN IF NOT EXISTS location_expected stock_location;

ALTER TABLE inventory_audit_scans
ADD COLUMN IF NOT EXISTS location_found stock_location;