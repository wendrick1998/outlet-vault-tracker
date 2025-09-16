import { supabase } from '@/integrations/supabase/client';
import type { ReasonWorkflow, ReasonWorkflowInsert, SLATracking, MovementApproval } from '@/types/workflow';
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];

export class ReasonWorkflowService {
  // Get workflows for a reason
  static async getWorkflowsForReason(reasonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('reason_workflows' as any)
      .select('*')
      .eq('reason_id', reasonId)
      .order('step_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create workflow step
  static async createWorkflowStep(workflow: ReasonWorkflowInsert): Promise<any> {
    const { data, error } = await supabase
      .from('reason_workflows' as any)
      .insert(workflow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update workflow step
  static async updateWorkflowStep(id: string, updates: Partial<ReasonWorkflowInsert>): Promise<any> {
    const { data, error } = await supabase
      .from('reason_workflows' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete workflow step
  static async deleteWorkflowStep(id: string): Promise<void> {
    const { error } = await supabase
      .from('reason_workflows' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Execute workflow for a loan
  static async executeWorkflow(loanId: string, reasonId: string): Promise<any> {
    const { data, error } = await supabase.rpc('execute_reason_workflow' as any, {
      p_loan_id: loanId,
      p_reason_id: reasonId
    });

    if (error) throw error;
    return data;
  }

  // Get SLA tracking for loan
  static async getSLATracking(loanId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('sla_tracking' as any)
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create SLA tracking
  static async createSLATracking(
    loanId: string,
    reasonId: string,
    estimatedCompletion: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('sla_tracking' as any)
      .insert({
        loan_id: loanId,
        reason_id: reasonId,
        estimated_completion: estimatedCompletion
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete SLA
  static async completeSLA(slaId: string): Promise<any> {
    const { data, error } = await supabase
      .from('sla_tracking' as any)
      .update({
        status: 'completed',
        actual_completion: new Date().toISOString()
      })
      .eq('id', slaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get pending approvals for user
  static async getPendingApprovals(userId?: string): Promise<any[]> {
    let query = supabase
      .from('movement_approvals' as any)
      .select('*')
      .eq('status', 'pending');

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Approve movement
  static async approveMovement(approvalId: string, notes?: string): Promise<any> {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('movement_approvals' as any)
      .update({
        status: 'approved',
        approved_by: user.data.user?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: notes
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Reject movement
  static async rejectMovement(approvalId: string, reason: string): Promise<any> {
    const { data, error } = await supabase
      .from('movement_approvals' as any)
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get overdue SLAs
  static async getOverdueSLAs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sla_tracking' as any)
      .select('*')
      .eq('status', 'overdue')
      .order('estimated_completion', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Check SLA status
  static async checkSLAOverdue(): Promise<void> {
    const { error } = await supabase.rpc('check_sla_overdue' as any);
    if (error) throw error;
  }

  // Get workflow step types
  static getStepTypes() {
    return [
      { value: 'approval', label: 'Aprovação', description: 'Requer aprovação de um papel específico' },
      { value: 'notification', label: 'Notificação', description: 'Envia notificação para papel específico' },
      { value: 'auto_action', label: 'Ação Automática', description: 'Executa ação automatizada' }
    ];
  }

  // Get available roles for workflow assignment
  static getWorkflowRoles(): { value: GranularRole; label: string }[] {
    return [
      { value: 'admin', label: 'Administrador' },
      { value: 'manager', label: 'Gerente' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'operator', label: 'Operador' }
    ];
  }
}