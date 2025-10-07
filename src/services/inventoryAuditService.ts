import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type InventoryAudit = Database['public']['Tables']['inventory_audits']['Row'];
type InventoryAuditInsert = Database['public']['Tables']['inventory_audits']['Insert'];
type InventoryAuditUpdate = Database['public']['Tables']['inventory_audits']['Update'];
type InventoryAuditScan = Database['public']['Tables']['inventory_audit_scans']['Row'];
type InventoryAuditScanInsert = Database['public']['Tables']['inventory_audit_scans']['Insert'];
type InventoryAuditMissing = Database['public']['Tables']['inventory_audit_missing']['Row'];
type InventoryAuditTask = Database['public']['Tables']['inventory_audit_tasks']['Row'];
type InventoryAuditTaskInsert = Database['public']['Tables']['inventory_audit_tasks']['Insert'];

export class InventoryAuditService {
  // Audit Session Management
  static async createAudit(auditData: InventoryAuditInsert): Promise<InventoryAudit> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .insert(auditData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAudit(id: string): Promise<InventoryAudit | null> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateAudit(id: string, updates: InventoryAuditUpdate): Promise<InventoryAudit> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async finishAudit(id: string, notes?: string): Promise<InventoryAudit> {
    return this.updateAudit(id, {
      finished_at: new Date().toISOString(),
      status: 'completed',
      notes
    });
  }

  static async getActiveAudits(): Promise<InventoryAudit[]> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .select('*')
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllAudits(): Promise<InventoryAudit[]> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Scan Management with location tracking
  static async addScan(scanData: InventoryAuditScanInsert & { location_found?: string }): Promise<InventoryAuditScan> {
    const { data, error } = await supabase
      .from('inventory_audit_scans')
      .insert(scanData)
      .select()
      .single();

    if (error) {
      // Check for duplicate constraint violation
      if (error.code === '23505') {
        throw new Error('DUPLICATE_SCAN');
      }
      throw error;
    }

    return data;
  }

  static async getAuditScans(auditId: string): Promise<InventoryAuditScan[]> {
    const { data, error } = await supabase
      .from('inventory_audit_scans')
      .select('*')
      .eq('audit_id', auditId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async checkDuplicateScan(auditId: string, imei: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('inventory_audit_scans')
      .select('id')
      .eq('audit_id', auditId)
      .eq('imei', imei)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  }

  // Missing Items Management
  static async addMissingItem(auditId: string, itemId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_audit_missing')
      .insert({
        audit_id: auditId,
        item_id: itemId,
        reason: reason || 'not_scanned'
      });

    if (error) throw error;
  }

  static async getAuditMissingItems(auditId: string): Promise<InventoryAuditMissing[]> {
    const { data, error } = await supabase
      .from('inventory_audit_missing')
      .select(`
        *,
        inventory:item_id (
          id,
          imei,
          brand,
          model,
          color,
          storage,
          status
        )
      `)
      .eq('audit_id', auditId);

    if (error) throw error;
    return data || [];
  }

  // Task Management
  static async createTask(taskData: InventoryAuditTaskInsert): Promise<InventoryAuditTask> {
    const { data, error } = await supabase
      .from('inventory_audit_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAuditTasks(auditId: string): Promise<InventoryAuditTask[]> {
    const { data, error } = await supabase
      .from('inventory_audit_tasks')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async resolveTask(taskId: string, resolutionNotes: string): Promise<InventoryAuditTask> {
    const { data, error } = await supabase
      .from('inventory_audit_tasks')
      .update({
        status: 'resolved',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Validation utilities
  static validateIMEI(imei: string): boolean {
    const cleaned = imei.replace(/[^0-9]/g, '');
    if (cleaned.length !== 15) return false;

    // Luhn algorithm
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(cleaned[13 - i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleaned[14]);
  }

  static cleanCode(code: string): { imei?: string; serial?: string } {
    const cleaned = code.trim();
    
    // Try as IMEI first
    const imeiCleaned = cleaned.replace(/[^0-9]/g, '');
    if (imeiCleaned.length >= 14 && this.validateIMEI(imeiCleaned)) {
      return { imei: imeiCleaned };
    }
    
    // If not valid IMEI, treat as serial
    const serialCleaned = cleaned.replace(/[^A-Za-z0-9]/g, '');
    if (serialCleaned.length > 0) {
      return { serial: serialCleaned };
    }
    
    return {};
  }

  // Snapshot creation using unified_inventory
  static async createSnapshot(filters: any = {}): Promise<any[]> {
    let query = supabase
      .from('unified_inventory')
      .select('*')
      .or('stock_status.is.null,stock_status.neq.vendido')
      .or('inventory_status.is.null,inventory_status.neq.sold');

    // Apply filters
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.brand && filters.brand !== 'all') {
      query = query.eq('brand', filters.brand);
    }
    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    const { data, error } = await query.order('imei');

    if (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }

    return data || [];
  }

  // Generate report data
  static async generateReportData(auditId: string): Promise<any> {
    const [audit, scans, missing, tasks] = await Promise.all([
      this.getAudit(auditId),
      this.getAuditScans(auditId),
      this.getAuditMissingItems(auditId),
      this.getAuditTasks(auditId)
    ]);

    return {
      audit,
      scans,
      missing,
      tasks,
      summary: {
        total_scanned: scans.length,
        found_expected: scans.filter(s => s.scan_result === 'found_expected').length,
        unexpected_present: scans.filter(s => s.scan_result === 'unexpected_present').length,
        duplicates: scans.filter(s => s.scan_result === 'duplicate').length,
        incongruent: scans.filter(s => s.scan_result === 'status_incongruent').length,
        missing_items: missing.length,
        pending_tasks: tasks.filter(t => t.status === 'open').length
      }
    };
  }
}