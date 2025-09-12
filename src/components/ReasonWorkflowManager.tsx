import { useState } from 'react';
import { Plus, Edit, Trash2, Play, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReasonWorkflows, usePendingApprovals, useOverdueSLAs, useWorkflowUtils } from '@/hooks/useReasonWorkflow';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];

interface ReasonWorkflowManagerProps {
  reasonId?: string;
  showApprovals?: boolean;
}

export const ReasonWorkflowManager = ({ reasonId, showApprovals = true }: ReasonWorkflowManagerProps) => {
  const [selectedReasonId, setSelectedReasonId] = useState(reasonId || '');
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [newStep, setNewStep] = useState({
    step_name: '',
    step_type: '',
    assigned_role: '' as GranularRole | '',
    timeout_hours: ''
  });

  const { toast } = useToast();
  const { stepTypes, workflowRoles } = useWorkflowUtils();
  
  const { 
    workflows = [], 
    createStep, 
    updateStep, 
    deleteStep, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useReasonWorkflows(selectedReasonId);
  
  const { approvals = [], approve, reject, isApproving, isRejecting } = usePendingApprovals();
  const { overdueSLAs = [] } = useOverdueSLAs();

  const handleCreateStep = async () => {
    if (!selectedReasonId || !newStep.step_name || !newStep.step_type) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createStep({
        reason_id: selectedReasonId,
        step_order: workflows.length + 1,
        step_name: newStep.step_name,
        step_type: newStep.step_type as 'approval' | 'notification' | 'auto_action',
        assigned_role: newStep.assigned_role || null,
        timeout_hours: newStep.timeout_hours ? parseInt(newStep.timeout_hours) : null
      });

      setNewStep({ step_name: '', step_type: '', assigned_role: '', timeout_hours: '' });
      setShowStepDialog(false);
    } catch (error) {
      console.error('Error creating step:', error);
    }
  };

  const handleDeleteStep = async () => {
    if (!stepToDelete) return;
    
    try {
      await deleteStep(stepToDelete);
      setStepToDelete(null);
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  const handleApprove = async (approvalId: string, notes?: string) => {
    try {
      await approve({ approvalId, notes });
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (approvalId: string, reason: string) => {
    try {
      await reject({ approvalId, reason });
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'notification': return <AlertTriangle className="h-4 w-4" />;
      case 'auto_action': return <Play className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      supervisor: "secondary",
      operator: "outline"
    };
    return variants[role] || "outline";
  };

  return (
    <FeatureFlagWrapper flag={FEATURE_FLAGS.REASON_WORKFLOWS}>
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Workflows de Motivos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure fluxos de aprovação e SLA para movimentações
                </p>
              </div>
            </div>

            <Tabs defaultValue="workflows" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workflows" className="gap-2">
                  <Play className="h-4 w-4" />
                  Workflows
                </TabsTrigger>
                {showApprovals && (
                  <TabsTrigger value="approvals" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aprovações ({approvals.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="sla" className="gap-2">
                  <Clock className="h-4 w-4" />
                  SLA ({overdueSLAs.length})
                </TabsTrigger>
              </TabsList>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-4">
                <PermissionGuard permission="system.config">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Configure os passos do workflow para cada motivo
                    </div>
                    
                    <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
                      <DialogTrigger asChild>
                        <Button disabled={!selectedReasonId} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Passo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Novo Passo do Workflow</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Nome do Passo</label>
                            <Input
                              value={newStep.step_name}
                              onChange={(e) => setNewStep({ ...newStep, step_name: e.target.value })}
                              placeholder="Ex: Aprovação do Gerente"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Tipo</label>
                            <Select 
                              value={newStep.step_type} 
                              onValueChange={(value) => setNewStep({ ...newStep, step_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {stepTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      {getStepTypeIcon(type.value)}
                                      <div>
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Papel Responsável</label>
                            <Select 
                              value={newStep.assigned_role} 
                              onValueChange={(value) => setNewStep({ ...newStep, assigned_role: value as GranularRole })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o papel" />
                              </SelectTrigger>
                              <SelectContent>
                                {workflowRoles.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    <Badge variant={getRoleBadgeVariant(role.value)}>
                                      {role.label}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Timeout (horas - opcional)</label>
                            <Input
                              type="number"
                              value={newStep.timeout_hours}
                              onChange={(e) => setNewStep({ ...newStep, timeout_hours: e.target.value })}
                              placeholder="Ex: 24"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowStepDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreateStep} disabled={isCreating}>
                              {isCreating ? 'Criando...' : 'Criar'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {workflows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum passo configurado para este motivo.</p>
                      <p className="text-sm">Adicione passos para criar um workflow.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordem</TableHead>
                          <TableHead>Passo</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead>Timeout</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workflows.map((step, index) => (
                          <TableRow key={step.id}>
                            <TableCell>
                              <Badge variant="outline">{index + 1}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{step.step_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStepTypeIcon(step.step_type)}
                                <span className="text-sm capitalize">{step.step_type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {step.assigned_role && (
                                <Badge variant={getRoleBadgeVariant(step.assigned_role)}>
                                  {step.assigned_role}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {step.timeout_hours ? `${step.timeout_hours}h` : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingStep(step)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setStepToDelete(step.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </PermissionGuard>
              </TabsContent>

              {/* Approvals Tab */}
              {showApprovals && (
                <TabsContent value="approvals" className="space-y-4">
                  <PermissionGuard permission="movements.approve">
                    <div className="text-sm text-muted-foreground mb-4">
                      Movimentações aguardando sua aprovação
                    </div>

                    {approvals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma aprovação pendente.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {approvals.map((approval) => (
                          <Card key={approval.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="font-medium">
                                  {approval.reason_workflows?.step_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Motivo: {approval.reason_workflows?.reasons?.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Criado em: {format(new Date(approval.created_at), 'dd/MM/yyyy HH:mm')}
                                  {approval.expires_at && (
                                    <span className="text-orange-600 ml-2">
                                      • Expira em: {format(new Date(approval.expires_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(approval.id)}
                                  disabled={isApproving}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(approval.id, 'Rejeitado pelo usuário')}
                                  disabled={isRejecting}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </PermissionGuard>
                </TabsContent>
              )}

              {/* SLA Tab */}
              <TabsContent value="sla" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  SLAs em atraso que precisam de atenção
                </div>

                {overdueSLAs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p>Nenhum SLA em atraso. Ótimo trabalho!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overdueSLAs.map((sla) => (
                      <Card key={sla.id} className="p-4 border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="font-medium text-red-700">
                              {sla.reasons?.name}
                            </div>
                            <div className="text-sm">
                              Item: {sla.loans?.inventory?.brand} {sla.loans?.inventory?.model}
                              <span className="ml-2 font-mono text-xs">
                                ...{sla.loans?.inventory?.imei?.slice(-5)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Previsto: {format(new Date(sla.estimated_completion), 'dd/MM/yyyy HH:mm')}
                              <span className="text-red-600 ml-2">
                                • Atrasado há {Math.floor((Date.now() - new Date(sla.estimated_completion).getTime()) / (1000 * 60 * 60))}h
                              </span>
                            </div>
                            <Badge variant="destructive" className="w-fit">
                              Escalação Nível {sla.escalation_level}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Delete Step Confirmation */}
        <AlertDialog open={!!stepToDelete} onOpenChange={() => setStepToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Passo</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja remover este passo do workflow?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteStep}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Removendo...' : 'Remover'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FeatureFlagWrapper>
  );
};