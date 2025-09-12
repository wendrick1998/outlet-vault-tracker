import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from "@/integrations/supabase/types";

interface ParsedItem {
  brand: string;
  model: string;
  storage_gb: number | null;
  color: string | null;
  condition: string;
  imei1: string;
  imei2: string | null;
  serial: string | null;
  battery_pct: number | null;
  title_original: string;
  parse_confidence: number;
  import_batch_id: string;
  status: 'READY' | 'REVIEW_REQUIRED' | 'DUPLICATE';
  device_model_id: string | null;
}

interface ImportSummary {
  total: number;
  preview_count?: number;
  ready?: number;
  review_required?: number;
  duplicates: number;
  created?: number;
  updated?: number;
  errors?: number;
}

interface CSVXLSXImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (summary: ImportSummary) => void;
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete';

export const CSVXLSXImportDialog = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: CSVXLSXImportDialogProps) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<ParsedItem[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [batchId, setBatchId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [defaultCondition, setDefaultCondition] = useState<string>('seminovo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx)$/i)) {
      toast({
        title: "Formato inválido",
        description: "Selecione um arquivo CSV ou XLSX",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "Arquivo muito grande", 
        description: "O arquivo deve ter no máximo 50MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setStep('processing');
      setProgress(30);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('inventory-import/preview', {
        body: formData
      });

      if (error) throw error;

      setPreviewItems(data.items);
      setSummary(data.summary);
      setBatchId(data.batch_id);
      setProgress(100);
      setStep('preview');

      toast({
        title: "Preview gerado",
        description: `${data.summary.preview_count} itens processados para análise`
      });

    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Erro no preview",
        description: error.message || "Erro ao processar arquivo",
        variant: "destructive"
      });
      setStep('upload');
    }
  };

  const handleImport = async () => {
    try {
      setStep('processing');
      setProgress(0);

              // Aplicar condição padrão aos itens que não têm condição definida
              const itemsWithDefaults = previewItems
                .filter(item => item.status === 'READY')
                .map(item => ({
                  ...item,
                  condition: item.condition || defaultCondition
                }));

      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { data, error } = await supabase.functions.invoke('inventory-import/commit', {
        body: { items: itemsWithDefaults, batch_id: batchId }
      });

      if (error) throw error;

      setSummary(data.summary);
      setStep('complete');
      onImportComplete?.(data.summary);

        toast({
          title: "Importação concluída",
          description: `${data.summary.created || 0} itens criados`,
          variant: (data.summary.errors || 0) > 0 ? "destructive" : "default"
        });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar dados",
        variant: "destructive"
      });
      setStep('preview');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewItems([]);
    setSummary(null);
    setBatchId('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadErrorReport = () => {
    const errorItems = previewItems.filter(item => item.status === 'REVIEW_REQUIRED');
    if (errorItems.length === 0) return;

    const csvContent = [
      'Título,IMEI,Status,Problema',
      ...errorItems.map(item => [
        item.title_original,
        item.imei1,
        item.status,
        'Dados incompletos ou IMEI inválido'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erros-importacao-${batchId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = `Título,IMEI 1,Serial,% Bateria
iPhone 14 Pro Max 256GB Dourado Novo,123456789012345,F2LLXXXXXXX,100
iPhone 13 128GB Azul Seminovo,123456789012346,F2LLXXXXXXY,85
Samsung Galaxy S23 256GB Preto Usado,123456789012347,R58XXXXXXXX,78`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-inventario.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Inventário CSV/XLSX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Importe aparelhos a partir de arquivo CSV ou XLSX
                </p>
                <Button variant="outline" onClick={downloadTemplate} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar modelo
                </Button>
              </div>

              <div 
                className="
                  border-2 border-dashed border-border rounded-lg p-8
                  text-center hover:border-primary/50 transition-colors
                  cursor-pointer group
                "
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-lg font-medium mb-2">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Formatos suportados: CSV, XLSX (máximo 50MB)
                </p>
                <Badge variant="secondary">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : 'Arraste e solte aqui'}
                </Badge>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <div className="flex gap-3">
                  <Button onClick={handlePreview} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Gerar Preview
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Cancelar
                  </Button>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Colunas aceitas:</strong> Título/Produto/Descrição, IMEI/IMEI 1, Serial, % Bateria/Bateria.
                  O sistema reconhece automaticamente modelos Apple e normaliza dados.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{summary?.ready || 0}</div>
                  <div className="text-sm text-muted-foreground">Prontos</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary?.review_required || 0}</div>
                  <div className="text-sm text-muted-foreground">Revisão</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{summary?.duplicates || 0}</div>
                  <div className="text-sm text-muted-foreground">Duplicados</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary?.total || 0}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Default Condition Selector */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">Condição padrão para itens sem condição:</span>
                <select 
                  value={defaultCondition} 
                  onChange={(e) => setDefaultCondition(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="novo">Novo</option>
                  <option value="seminovo">Seminovo</option>
                  <option value="usado">Usado</option>
                </select>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Armazenamento</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Condição</TableHead>
                      <TableHead>Confiança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge 
                            variant={
                              item.status === 'READY' ? 'default' :
                              item.status === 'REVIEW_REQUIRED' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {item.status === 'READY' ? 'Pronto' :
                             item.status === 'REVIEW_REQUIRED' ? 'Revisão' : 
                             'Duplicado'}
                          </Badge>
                        </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.imei1 && item.imei1.length >= 4 
                      ? `***********${item.imei1.slice(-4)}`
                      : item.imei1
                    }
                  </TableCell>
                  <TableCell>{item.brand} {item.model}</TableCell>
                  <TableCell>{item.storage_gb ? `${item.storage_gb}GB` : '-'}</TableCell>
                  <TableCell>{item.color || '-'}</TableCell>
                  <TableCell>{item.condition || defaultCondition}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(item.parse_confidence * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleImport}
                  disabled={!summary?.ready}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {summary?.ready || 0} válidos
                </Button>
                
                {(summary?.review_required || 0) > 0 && (
                  <Button variant="outline" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar erros
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-medium">Processando importação...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progress}% concluído</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h3 className="text-xl font-bold">Importação Concluída!</h3>
              
              {summary && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{summary.created || 0}</div>
                    <div className="text-sm text-muted-foreground">Criados</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{summary.updated || 0}</div>
                    <div className="text-sm text-muted-foreground">Atualizados</div>
                  </div>
                </div>
              )}

              <Button onClick={() => onOpenChange(false)} className="mt-6">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};