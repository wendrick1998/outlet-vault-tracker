// Temporary types for new workflow tables until Supabase types are regenerated
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];

// Temporary workflow types (will be replaced when Supabase regenerates types)
export interface ReasonWorkflow {
  id: string;
  reason_id: string;
  step_order: number;
  step_name: string;
  step_type: 'approval' | 'notification' | 'auto_action';
  assigned_role?: GranularRole;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  timeout_hours?: number;
  created_at: string;
}

export interface ReasonWorkflowInsert {
  reason_id: string;
  step_order: number;
  step_name: string;
  step_type: 'approval' | 'notification' | 'auto_action';
  assigned_role?: GranularRole | null;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  timeout_hours?: number | null;
}

export interface SLATracking {
  id: string;
  loan_id: string;
  reason_id: string;
  sla_start_time: string;
  sla_end_time?: string;
  estimated_completion: string;
  actual_completion?: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  overdue_notified_at?: string;
  escalation_level: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  loans?: {
    id: string;
    inventory?: {
      imei: string;
      brand: string;
      model: string;
    };
  };
  reasons?: {
    name: string;
  };
}

export interface MovementApproval {
  id: string;
  loan_id: string;
  workflow_step_id?: string;
  required_role: GranularRole;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  loans?: {
    id: string;
    item_id: string;
    status: string;
    inventory?: {
      imei: string;
      brand: string;
      model: string;
    };
  };
  reason_workflows?: {
    step_name: string;
    reasons?: {
      name: string;
    };
  };
}