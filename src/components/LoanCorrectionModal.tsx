import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AlertTriangle, Shield, AlertCircle, Clock, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { LoanWithDetails } from "@/services/loanService";
import { useLoanCorrections, type LoanStatus } from "@/hooks/useLoanCorrections";
import { usePinProtection } from "@/hooks/usePinProtection";

interface LoanCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanWithDetails | null;
}

export function LoanCorrectionModal({ isOpen, onClose, loan }: LoanCorrectionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | ''>('');
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');

  const { correctLoan, isCorrecting, isError, error, correctionLimit, remainingCorrections } = useLoanCorrections();
  const { hasPinConfigured } = usePinProtection();

  const isCriticalChange = loan && selectedStatus && (
    (loan.status === 'sold' && ['active', 'returned'].includes(selectedStatus)) ||
    (['active', 'returned'].includes(loan.status) && selectedStatus === 'sold')
  );

  const handleSubmit = () => {
    if (!selectedStatus || !reason.trim() || !loan) {
      return;
    }

    // Validar justificativa mínima (10 caracteres)
    if (reason.trim().length < 10) {
      return;
    }

    // Validar PIN se configurado
    if (hasPinConfigured && pin.length !== 4) {
      return;
    }

    correctLoan({
      loanId: loan.id,
      correctStatus: selectedStatus as LoanStatus,
      reason: reason.trim(),
      pin: hasPinConfigured ? pin : undefined
    }, {
      onSuccess: () => {
        handleClose();
      },
      onError: (error: any) => {
        const errorMsg = error?.message?.toLowerCase() || '';
        if (errorMsg.includes('bloqueado') || errorMsg.includes('blocked')) {
          toast({
            title: "🔒 PIN Bloqueado",
            description: "Múltiplas tentativas incorretas detectadas. Aguarde 15 minutos antes de tentar novamente.",
            variant: "destructive",
            duration: 8000
          });
        }
        // Modal permanece aberto para o usuário ver o erro
      }
    });
  };

  const handleClose = () => {
    setSelectedStatus('');
    setReason('');
    setPin('');
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
            {/* Limite de correções */}
            {remainingCorrections <= 2 && (
              <Alert variant={remainingCorrections === 0 ? "destructive" : "default"}>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {remainingCorrections === 0 
                    ? "Limite diário de correções atingido (5/dia)"
                    : `Restam ${remainingCorrections} correções disponíveis hoje`
                  }
                </AlertDescription>
              </Alert>
            )}

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

            {/* Alerta de mudança crítica */}
            {isCriticalChange && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Correção Crítica!</strong> Esta mudança envolve status "Vendido" e será destacada para gerentes.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo da Correção * 
                <span className="text-xs text-muted-foreground ml-2">
                  (mínimo 10 caracteres)
                </span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo da correção..."
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                {reason.trim().length}/10 caracteres
              </div>
            </div>

            {/* PIN Field (se configurado) */}
            {hasPinConfigured && (
              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  PIN Operacional *
                </Label>
                <InputOTP
                  maxLength={4}
                  value={pin}
                  onChange={setPin}
                  className="justify-center"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-muted-foreground">
                  Digite seu PIN de 4 dígitos para confirmar
                </p>
              </div>
            )}

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
              disabled={
                !selectedStatus || 
                reason.trim().length < 10 || 
                (hasPinConfigured && pin.length !== 4) ||
                isCorrecting || 
                remainingCorrections === 0
              }
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isCorrecting ? 'Corrigindo...' : 'Confirmar Correção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}