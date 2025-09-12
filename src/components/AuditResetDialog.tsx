import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  auditData?: {
    location: string;
    scanCount: number;
    foundCount: number;
  };
  isLoading?: boolean;
}

export function AuditResetDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  auditData,
  isLoading = false 
}: AuditResetDialogProps) {
  const [resetReason, setResetReason] = useState('');

  const handleConfirm = () => {
    if (!resetReason.trim()) {
      toast.error('Por favor, informe o motivo do reset');
      return;
    }
    
    onConfirm(resetReason);
    setResetReason('');
  };

  const handleCancel = () => {
    setResetReason('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            Resetar Conferência
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                Esta ação irá <strong>apagar todos os dados</strong> da conferência atual e 
                permitir que você recomece do zero.
              </div>
            </div>
            
            {auditData && (
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="text-sm font-medium">Dados que serão perdidos:</div>
                <div className="text-xs space-y-1">
                  <div>• Local: {auditData.location}</div>
                  <div>• Total escaneado: {auditData.scanCount} itens</div>
                  <div>• Itens encontrados: {auditData.foundCount}</div>
                  <div>• Todas as tarefas e observações</div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="resetReason">
            Motivo do reset <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="resetReason"
            placeholder="Explique o motivo para resetar esta conferência..."
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Este motivo será registrado no histórico de auditoria.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !resetReason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Confirmar Reset
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}