import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditReport } from '@/hooks/useInventoryAudit';
import { ConferenceReportExporter } from './ConferenceReportExporter';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  AlertCircle,
  Copy
} from 'lucide-react';

interface InventoryConferenceReportProps {
  auditId: string;
  onBackToConferences?: () => void;
}

export function InventoryConferenceReport({ auditId, onBackToConferences }: InventoryConferenceReportProps) {
  const navigate = useNavigate();
  const { data: reportData, isLoading } = useAuditReport(auditId);
  const [showExporter, setShowExporter] = useState(false);

  const handleBack = () => {
    if (onBackToConferences) {
      onBackToConferences();
    } else {
      navigate('/conference');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Relatório não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar o relatório desta conferência.
              </p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Conferências
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { audit, scans, missing, tasks, scanSummary } = reportData;
  const completionPercentage = Math.round((audit.found_count / audit.snapshot_count) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7" />
              Relatório de Conferência
            </h1>
            <p className="text-muted-foreground">
              Conferência finalizada • {audit.location}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowExporter(true)} size="lg">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">{completionPercentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Encontrados</p>
                <p className="text-2xl font-bold text-green-600">{audit.found_count}</p>
                <p className="text-xs text-muted-foreground">de {audit.snapshot_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Não Encontrados</p>
                <p className="text-2xl font-bold text-red-600">{audit.missing_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fora do Esperado</p>
                <p className="text-2xl font-bold text-orange-600">{audit.unexpected_count}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conferência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-sm text-muted-foreground">{audit.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Iniciada em</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(audit.started_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Finalizada em</p>
                <p className="text-sm text-muted-foreground">
                  {audit.finished_at ? new Date(audit.finished_at).toLocaleString('pt-BR') : 'Em andamento'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                  {audit.status === 'completed' ? 'Concluída' : 'Em Progresso'}
                </Badge>
              </div>
            </div>
          </div>
          {audit.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-2">Observações</p>
                <p className="text-sm text-muted-foreground">{audit.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Escaneamentos ({scans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {scans.slice(0, 50).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-sm">{scan.imei || scan.serial || scan.raw_code}</div>
                      <Badge variant={
                        scan.scan_result === 'found_expected' ? 'default' :
                        scan.scan_result === 'unexpected_present' ? 'destructive' :
                        scan.scan_result === 'duplicate' ? 'outline' : 'secondary'
                      }>
                        {scan.scan_result === 'found_expected' && 'Encontrado'}
                        {scan.scan_result === 'unexpected_present' && 'Fora do Esperado'}
                        {scan.scan_result === 'duplicate' && 'Duplicado'}
                        {scan.scan_result === 'status_incongruent' && 'Incongruente'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))}
                {scans.length > 50 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    ... e mais {scans.length - 50} escaneamentos
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Missing Items */}
      {missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Itens Não Encontrados ({missing.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {missing.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.item?.model || 'Item não identificado'}</div>
                      {item.item && (
                        <div className="text-sm text-muted-foreground">
                          {item.item.brand} • IMEI: {item.item.imei}
                        </div>
                      )}
                    </div>
                    <Badge variant="destructive">{item.reason || 'Não escaneado'}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-blue-600" />
              Tarefas Pendentes ({tasks.filter(t => t.status === 'open').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{task.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {task.task_type} • Prioridade: {task.priority}
                      </div>
                      {task.imei && (
                        <div className="text-sm text-muted-foreground">IMEI: {task.imei}</div>
                      )}
                    </div>
                    <Badge variant={task.status === 'resolved' ? 'default' : 'destructive'}>
                      {task.status === 'resolved' ? 'Resolvida' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      <ConferenceReportExporter
        open={showExporter}
        onOpenChange={setShowExporter}
        auditId={auditId}
        reportData={reportData}
      />
    </div>
  );
}