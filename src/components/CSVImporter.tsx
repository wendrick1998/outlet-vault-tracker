import { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInventoryImporter, type ImportResult } from '@/hooks/useInventoryImporter';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

export const CSVImporter = ({ onImportComplete, className }: CSVImporterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const { importFromCSV, isImporting, progress, resetProgress } = useInventoryImporter();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setLastResult(null);
      resetProgress();
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importFromCSV(selectedFile);
      setLastResult(result);
      onImportComplete?.(result);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setLastResult(null);
    resetProgress();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `imei,modelo,marca,armazenamento,cor,condicao,observacoes
123456789012345,iPhone 14 Pro Max,Apple,256GB,Dourado,novo,Em perfeito estado
123456789012346,iPhone 13,Apple,128GB,Azul,seminovo,Pequeno risco na tela
123456789012347,Galaxy S23,Samsung,256GB,Preto,usado,Funciona perfeitamente`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-inventario.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Template baixado",
      description: "Use este arquivo como modelo para sua importação",
    });
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Importação CSV</h3>
              <p className="text-sm text-muted-foreground">
                Importe itens do inventário a partir de um arquivo CSV
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar modelo
          </Button>
        </div>

        {/* File Selection */}
        {!selectedFile && !isImporting && !lastResult && (
          <div className="space-y-4">
            <div 
              className="
                border-2 border-dashed border-border rounded-lg p-8
                text-center hover:border-primary/50 transition-colors
                cursor-pointer group
              "
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-lg font-medium mb-2">Clique para selecionar o arquivo CSV</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ou arraste e solte o arquivo aqui
              </p>
              <Badge variant="secondary">Máximo 10MB</Badge>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* File Selected */}
        {selectedFile && !isImporting && !lastResult && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    Cancelar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={handleImport}
                className="w-full gap-2"
                size="lg"
              >
                <Upload className="h-5 w-5" />
                Iniciar Importação
              </Button>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Colunas suportadas:</strong> imei, modelo, marca, armazenamento, cor, condicao, observacoes.
                  O sistema reconhece automaticamente modelos Apple e normaliza os dados.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {isImporting && progress && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">
                {progress.status === 'parsing' ? 'Processando arquivo...' : 'Importando itens...'}
              </h4>
              {progress.currentItem && (
                <p className="text-sm text-muted-foreground">{progress.currentItem}</p>
              )}
            </div>

            <Progress value={progress.percentage} className="h-3" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.current} de {progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
          </div>
        )}

        {/* Import Results */}
        {lastResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {lastResult.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <h4 className="font-medium">Importação Concluída</h4>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{lastResult.created}</div>
                <div className="text-sm text-muted-foreground">Criados</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{lastResult.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{lastResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Ignorados</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{lastResult.processed}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </Card>
            </div>

            {/* Apple Matching Stats */}
            {lastResult.details.successful.some(item => item.matched) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reconhecimento Apple:</strong> {' '}
                  {lastResult.details.successful.filter(item => item.matched).length} itens 
                  foram automaticamente reconhecidos como modelos Apple com normalização de cores e armazenamento.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Details */}
            {lastResult.errors > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Erros na Importação
                </h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {lastResult.details.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-200">
                      <strong>Linha {error.row}:</strong> {error.error}
                      {error.imei && <span className="text-muted-foreground"> (IMEI: {error.imei})</span>}
                    </div>
                  ))}
                  {lastResult.details.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ... e mais {lastResult.details.errors.length - 5} erros
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Nova Importação
              </Button>
              {lastResult.created > 0 && (
                <Badge variant="secondary" className="px-4 py-2">
                  {lastResult.created} itens adicionados ao inventário
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};