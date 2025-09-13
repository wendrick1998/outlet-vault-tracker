import { useState } from "react";
import { Package, RotateCcw, Archive, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { BatchOutflowForm } from "@/components/BatchOutflowForm";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface BulkOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onComplete: () => void;
}

type OperationType = 'outflow' | 'return' | 'archive' | null;
type OperationResult = {
  itemId: string;
  itemName: string;
  success: boolean;
  error?: string;
};

export const BulkOperationModal = ({
  isOpen,
  onClose,
  items,
  onComplete
}: BulkOperationModalProps) => {
  const [selectedOperation, setSelectedOperation] = useState<OperationType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OperationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'results'>('select');
  
  const { updateItem, updateStatus } = useInventory();
  const { toast } = useToast();

  const handleOperationSelect = (operation: OperationType) => {
    setSelectedOperation(operation);
    if (operation === 'outflow') {
      setCurrentStep('configure');
    } else {
      // Para outras operações, executar diretamente
      handleExecuteOperation(operation);
    }
  };

  const handleExecuteOperation = async (operation: OperationType, outflowData?: any) => {
    if (!operation) return;

    setIsProcessing(true);
    setCurrentStep('results');
    setResults([]);
    setProgress(0);

    const operationResults: OperationResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemName = `${item.brand} ${item.model}`;
      
      try {
        switch (operation) {
          case 'return':
            await updateStatus({
              id: item.id,
              status: 'available'
            });
            break;
            
          case 'archive':
            await updateItem({
              id: item.id,
              data: { is_archived: true }
            });
            break;
            
          case 'outflow':
            // Outflow handling será feito pelo OutflowForm
            break;
        }
        
        operationResults.push({
          itemId: item.id,
          itemName,
          success: true
        });
        
      } catch (error) {
        operationResults.push({
          itemId: item.id,
          itemName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      setProgress(((i + 1) / items.length) * 100);
      setResults([...operationResults]);
    }

    setIsProcessing(false);
    
    const successCount = operationResults.filter(r => r.success).length;
    const failureCount = operationResults.filter(r => !r.success).length;
    
    toast({
      title: "Operação concluída",
      description: `${successCount} sucesso(s), ${failureCount} falha(s)`,
      variant: failureCount > 0 ? "destructive" : "default"
    });
  };

  const handleOutflowComplete = () => {
    // O BatchOutflowForm já cria os empréstimos e mostra o toast
    // Apenas fechamos o modal e executamos o callback de conclusão
    onComplete();
    handleClose();
  };

  const handleClose = () => {
    setSelectedOperation(null);
    setCurrentStep('select');
    setResults([]);
    setProgress(0);
    onClose();
  };

  const handleFinish = () => {
    onComplete();
    handleClose();
  };

  const renderOperationSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Escolha a operação</h3>
        <p className="text-muted-foreground">
          Será aplicada a todos os {items.length} item(s) selecionado(s)
        </p>
      </div>

      <div className="grid gap-3">
        <Card 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleOperationSelect('outflow')}
        >
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-medium">Saída</h4>
              <p className="text-sm text-muted-foreground">
                Empréstimo, venda ou saída interna
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleOperationSelect('return')}
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-success" />
            <div>
              <h4 className="font-medium">Devolução</h4>
              <p className="text-sm text-muted-foreground">
                Marcar itens como devolvidos/disponíveis
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleOperationSelect('archive')}
        >
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-warning" />
            <div>
              <h4 className="font-medium">Arquivar</h4>
              <p className="text-sm text-muted-foreground">
                Arquivar itens (soft delete)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderOutflowConfiguration = () => (
    <BatchOutflowForm
      items={items}
      onComplete={handleOutflowComplete}
      onCancel={() => setCurrentStep('select')}
    />
  );

  const renderResults = () => {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Resultado da Operação</h3>
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processando... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-4 justify-center">
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {successCount} Sucesso(s)
              </Badge>
              {failureCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {failureCount} Falha(s)
                </Badge>
              )}
            </div>

            <ScrollArea className="h-60">
              <div className="space-y-2">
                {results.map((result) => (
                  <div key={result.itemId} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{result.itemName}</p>
                      {result.error && (
                        <p className="text-xs text-destructive">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {!isProcessing && results.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button onClick={handleFinish} className="flex-1">
              Concluir
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getCurrentContent = () => {
    switch (currentStep) {
      case 'select':
        return renderOperationSelection();
      case 'configure':
        return renderOutflowConfiguration();
      case 'results':
        return renderResults();
      default:
        return renderOperationSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Operações em Lote</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {getCurrentContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};