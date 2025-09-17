import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield } from "lucide-react";
import type { LoanWithDetails } from "@/services/loanService";
import { useLoanCorrections, type LoanStatus } from "@/hooks/useLoanCorrections";
import { usePinProtection } from "@/hooks/usePinProtection";
import { PinConfirmationModal } from "@/components/PinConfirmationModal";

interface LoanCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanWithDetails | null;
}

export function LoanCorrectionModal({ isOpen, onClose, loan }: LoanCorrectionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | ''>('');
  const [reason, setReason] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingCorrection, setPendingCorrection] = useState<{status: LoanStatus, reason: string} | null>(null);

  const { correctLoan, isCorreting } = useLoanCorrections();
  const { hasPinConfigured } = usePinProtection();

  const handleSubmit = () => {
    if (!selectedStatus || !reason.trim() || !loan) {
      return;
    }

    if (hasPinConfigured) {
      setPendingCorrection({ status: selectedStatus as LoanStatus, reason: reason.trim() });
      setShowPinModal(true);
    } else {
      executeCorrection(selectedStatus as LoanStatus, reason.trim());
    }
  };

  const executeCorrection = (status: LoanStatus, correctionReason: string) => {
    if (!loan) return;
    
    correctLoan({
      loanId: loan.id,
      correctStatus: status,
      reason: correctionReason
    });
    
    handleClose();
  };

  const handlePinConfirmed = () => {
    if (pendingCorrection) {
      executeCorrection(pendingCorrection.status, pendingCorrection.reason);
    }
    setShowPinModal(false);
    setPendingCorrection(null);
  };

  const handleClose = () => {
    setSelectedStatus('');
    setReason('');
    setPendingCorrection(null);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'returned': return 'bg-green-500';
      case 'sold': return 'bg-purple-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'returned': return 'Devolvido';
      case 'sold': return 'Vendido';
      case 'overdue': return 'Atrasado';
      default: return status;
    }
  };

  if (!loan) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Correção de Lançamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm font-medium text-amber-800">
                IMEI: {loan.inventory?.imei}
              </div>
              <div className="text-sm text-amber-700">
                {loan.inventory?.brand} {loan.inventory?.model}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-amber-700">Status atual:</span>
                <Badge className={`${getStatusColor(loan.status)} text-white`}>
                  {getStatusLabel(loan.status)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">Novo Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as LoanStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status correto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo (Emprestado)</SelectItem>
                  <SelectItem value="returned">Devolvido</SelectItem>
                  <SelectItem value="sold">Vendido</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Correção *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da correção..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              ⚠️ Esta ação será registrada no sistema de auditoria e não pode ser desfeita.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStatus || !reason.trim() || isCorreting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isCorreting ? 'Corrigindo...' : 'Confirmar Correção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinConfirmationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingCorrection(null);
        }}
        onConfirm={handlePinConfirmed}
        title="Confirmação de Correção"
        description="Digite seu PIN para confirmar a correção do lançamento."
      />
    </>
  );
}