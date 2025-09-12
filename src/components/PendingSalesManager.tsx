import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PendencyTimer } from './PendencyTimer';
import { usePendingSalesOnly, usePendingSales } from '@/hooks/usePendingSales';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function PendingSalesManager() {
  const { data: pendingSales = [], isLoading } = usePendingSalesOnly();
  const { resolvePendingSale, isResolving } = usePendingSales();
  const [selectedPendency, setSelectedPendency] = useState<any>(null);
  const [saleNumber, setSaleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleResolve = async () => {
    if (!selectedPendency || !saleNumber.trim()) return;

    try {
      await resolvePendingSale({
        id: selectedPendency.id,
        saleNumber: saleNumber.trim(),
        notes: notes.trim() || undefined
      });
      
      setIsDialogOpen(false);
      setSelectedPendency(null);
      setSaleNumber('');
      setNotes('');
    } catch (error) {
      console.error('Error resolving pending sale:', error);
    }
  };

  const openResolveDialog = (pendency: any) => {
    setSelectedPendency(pendency);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pendências de Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando pendências...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingSales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Pendências de Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma pendência encontrada! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Pendências de Venda ({pendingSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingSales.map((pendency: any) => (
              <div
                key={pendency.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">
                      {pendency.loans?.inventory?.brand} {pendency.loans?.inventory?.model}
                    </h4>
                    <Badge variant="outline" className="text-warning border-warning/50">
                      Pendente
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    IMEI: ...{pendency.loans?.inventory?.imei?.slice(-8)}
                  </p>
                  
                  <PendencyTimer createdAt={pendency.created_at} />
                  
                  {pendency.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {pendency.notes}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => openResolveDialog(pendency)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Regularizar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regularizar Venda</DialogTitle>
          </DialogHeader>
          
          {selectedPendency && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold">
                  {selectedPendency.loans?.inventory?.brand} {selectedPendency.loans?.inventory?.model}
                </h4>
                <p className="text-sm text-muted-foreground">
                  IMEI: ...{selectedPendency.loans?.inventory?.imei?.slice(-8)}
                </p>
                <PendencyTimer createdAt={selectedPendency.created_at} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Número da Venda *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: V001234"
                  value={saleNumber}
                  onChange={(e) => setSaleNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Observações (opcional)
                </label>
                <Textarea
                  placeholder="Adicione observações sobre a regularização..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={!saleNumber.trim() || isResolving}
                  className="flex-1"
                >
                  {isResolving ? "Regularizando..." : "Regularizar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}