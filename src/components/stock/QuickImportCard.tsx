import { useState } from 'react';
import { Upload, Download, FileText, TrendingUp, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CSVXLSXImportDialog } from '@/components/CSVXLSXImportDialog';
import { ImportTutorial } from './ImportTutorial';
import { downloadXLSXTemplate } from '@/utils/createXLSXTemplate';

interface QuickImportCardProps {
  lastImportDate?: Date | null;
  lastImportCount?: number;
}

export const QuickImportCard = ({ 
  lastImportDate, 
  lastImportCount 
}: QuickImportCardProps) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const downloadTemplate = (type: 'basico' | 'completo' | 'xlsx') => {
    if (type === 'xlsx') {
      downloadXLSXTemplate();
      return;
    }

    const fileName = type === 'basico' 
      ? 'cofre-modelo-basico.csv' 
      : 'cofre-modelo-completo.csv';
    
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Importação em Massa</CardTitle>
                <CardDescription>
                  Cadastre múltiplos aparelhos de uma vez
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Rápido
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Animated Tutorial */}
          <ImportTutorial />

          {/* Last Import Stats */}
          {lastImportDate && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Última importação: <strong>{lastImportCount}</strong> itens em{' '}
                {new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(lastImportDate)}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="w-full h-auto py-4 flex-col gap-2"
              size="lg"
            >
              <Upload className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">Importar Arquivo</div>
                <div className="text-xs opacity-90">CSV ou XLSX</div>
              </div>
            </Button>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('xlsx')}
                className="w-full justify-start bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-green-200 dark:border-green-900"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Modelo Excel (XLSX)</span>
                  <span className="text-[10px] opacity-70">Formatado com validações</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadTemplate('basico')}
                className="w-full justify-start"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV Básico
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadTemplate('completo')}
                className="w-full justify-start"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV Completo
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">Como usar:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                <li>Baixe um dos modelos</li>
                <li>Preencha com seus dados</li>
                <li>Clique em "Importar Arquivo"</li>
                <li>Revise os dados detectados</li>
                <li>Confirme a importação</li>
              </ol>
            </div>
          </div>

          {/* Accepted Columns Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Colunas aceitas:</p>
            <p>Título, IMEI 1, IMEI 2, Serial, % Bateria, Observações</p>
            <p className="text-[10px] mt-1">
              O sistema detecta automaticamente marcas, modelos, armazenamento e cores
            </p>
          </div>
        </CardContent>
      </Card>

      <CSVXLSXImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={(summary) => {
          console.log('Import completed:', summary);
          // A página Stock vai recarregar automaticamente os dados
        }}
      />
    </>
  );
};