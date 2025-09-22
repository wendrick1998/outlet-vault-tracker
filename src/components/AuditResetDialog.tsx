import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditResetDialogProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export function AuditResetDialog({ auditId, isOpen, onClose, onReset }: AuditResetDialogProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [confirmations, setConfirmations] = useState({
    deleteScans: false,
    resetProgress: false,
    clearTasks: false
  });
  const [confirmText, setConfirmText] = useState('');

  const handleReset = async () => {
    if (!confirmations.deleteScans || !confirmations.resetProgress) {
      toast.error('Confirme todas as opções necessárias');
      return;
    }

    if (confirmText !== 'RESETAR') {
      toast.error('Digite "RESETAR" para confirmar');
      return;
    }

    try {
      setIsResetting(true);

      // Delete all scans for this audit
      if (confirmations.deleteScans) {
        const { error: scansError } = await supabase
          .from('inventory_audit_scans')
          .delete()
          .eq('audit_id', auditId);

        if (scansError) throw scansError;
      }

      // Clear tasks if requested
      if (confirmations.clearTasks) {
        const { error: tasksError } = await supabase
          .from('inventory_audit_tasks')
          .delete()
          .eq('audit_id', auditId);

        if (tasksError) throw tasksError;
      }

      // Reset audit counters
      if (confirmations.resetProgress) {
        const { error: auditError } = await supabase
          .from('inventory_audits')
          .update({
            found_count: 0,
            missing_count: 0,
            unexpected_count: 0,
            duplicate_count: 0,
            incongruent_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', auditId);

        if (auditError) throw auditError;
      }

      toast.success('Conferência reiniciada com sucesso');
      onReset();
      onClose();
      
      // Reset form
      setConfirmations({
        deleteScans: false,
        resetProgress: false,
        clearTasks: false
      });
      setConfirmText('');
      
    } catch (error) {
      console.error('Error resetting audit:', error);
      toast.error('Erro ao reiniciar conferência');
    } finally {
      setIsResetting(false);
    }
  };

  const canProceed = confirmations.deleteScans && 
                    confirmations.resetProgress && 
                    confirmText === 'RESETAR';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            Reiniciar Conferência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação é irreversível e irá apagar permanentemente 
              todos os dados de escaneamento da conferência atual.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteScans"
                checked={confirmations.deleteScans}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, deleteScans: !!checked }))
                }
              />
              <label htmlFor="deleteScans" className="text-sm">
                Apagar todos os escaneamentos realizados
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="resetProgress"
                checked={confirmations.resetProgress}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, resetProgress: !!checked }))
                }
              />
              <label htmlFor="resetProgress" className="text-sm">
                Resetar contadores de progresso
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="clearTasks"
                checked={confirmations.clearTasks}
                onCheckedChange={(checked) => 
                  setConfirmations(prev => ({ ...prev, clearTasks: !!checked }))
                }
              />
              <label htmlFor="clearTasks" className="text-sm">
                Limpar tarefas criadas (opcional)
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="confirmText" className="text-sm font-medium block mb-2">
              Digite "RESETAR" para confirmar:
            </label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESETAR"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isResetting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!canProceed || isResetting}
          >
            {isResetting ? 'Reiniciando...' : 'Reiniciar Conferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}