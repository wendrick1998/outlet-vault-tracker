import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, 
  FileText, 
  Table, 
  CheckCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';

interface ConferenceReportExporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  reportData: any;
}

export function ConferenceReportExporter({ 
  open, 
  onOpenChange, 
  auditId, 
  reportData 
}: ConferenceReportExporterProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [includeData, setIncludeData] = useState({
    summary: true,
    scans: true,
    missing: true,
    tasks: true,
    auditInfo: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!reportData) return;

    setIsExporting(true);
    try {
      const exportData = buildExportData();
      
      if (exportFormat === 'csv') {
        await exportAsCSV(exportData);
      } else if (exportFormat === 'json') {
        await exportAsJSON(exportData);
      } else {
        await exportAsPDF(exportData);
      }

      toast({
        title: "Exportação concluída",
        description: `Relatório exportado como ${exportFormat.toUpperCase()} com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar o relatório.",
      });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  const buildExportData = () => {
    const { audit, scans, missing, tasks } = reportData;
    const exportData: any = {};

    if (includeData.auditInfo) {
      exportData.audit = {
        id: audit.id,
        location: audit.location,
        status: audit.status,
        started_at: audit.started_at,
        finished_at: audit.finished_at,
        snapshot_count: audit.snapshot_count,
        found_count: audit.found_count,
        missing_count: audit.missing_count,
        unexpected_count: audit.unexpected_count,
        duplicate_count: audit.duplicate_count,
        incongruent_count: audit.incongruent_count,
        notes: audit.notes
      };
    }

    if (includeData.summary) {
      const completionPercentage = Math.round((audit.found_count / audit.snapshot_count) * 100);
      exportData.summary = {
        completion_percentage: completionPercentage,
        total_items_expected: audit.snapshot_count,
        items_found: audit.found_count,
        items_missing: audit.missing_count,
        items_unexpected: audit.unexpected_count,
        duplicate_scans: audit.duplicate_count,
        status_incongruent: audit.incongruent_count
      };
    }

    if (includeData.scans && scans.length > 0) {
      exportData.scans = scans.map(scan => ({
        timestamp: scan.timestamp,
        imei: scan.imei,
        serial: scan.serial,
        raw_code: scan.raw_code,
        scan_result: scan.scan_result,
        item_id: scan.item_id
      }));
    }

    if (includeData.missing && missing.length > 0) {
      exportData.missing_items = missing.map(item => ({
        item_id: item.item_id,
        reason: item.reason,
        item_details: item.item ? {
          model: item.item.model,
          brand: item.item.brand,
          imei: item.item.imei,
          status: item.item.status
        } : null
      }));
    }

    if (includeData.tasks && tasks.length > 0) {
      exportData.tasks = tasks.map(task => ({
        id: task.id,
        task_type: task.task_type,
        description: task.description,
        priority: task.priority,
        status: task.status,
        imei: task.imei,
        created_at: task.created_at,
        resolved_at: task.resolved_at,
        resolution_notes: task.resolution_notes
      }));
    }

    return exportData;
  };

  const exportAsCSV = async (data: any) => {
    const csvContent = [];
    
    // Summary section
    if (data.summary) {
      csvContent.push('RESUMO DA CONFERÊNCIA');
      csvContent.push('Campo,Valor');
      Object.entries(data.summary).forEach(([key, value]) => {
        csvContent.push(`${key.replace(/_/g, ' ')},${value}`);
      });
      csvContent.push('');
    }

    // Audit info section
    if (data.audit) {
      csvContent.push('INFORMAÇÕES DA AUDITORIA');
      csvContent.push('Campo,Valor');
      Object.entries(data.audit).forEach(([key, value]) => {
        csvContent.push(`${key.replace(/_/g, ' ')},${value || ''}`);
      });
      csvContent.push('');
    }

    // Scans section
    if (data.scans && data.scans.length > 0) {
      csvContent.push('ESCANEAMENTOS');
      csvContent.push('Timestamp,IMEI,Serial,Código Raw,Resultado,Item ID');
      data.scans.forEach((scan: any) => {
        csvContent.push(`${scan.timestamp},${scan.imei || ''},${scan.serial || ''},${scan.raw_code},${scan.scan_result},${scan.item_id || ''}`);
      });
      csvContent.push('');
    }

    // Missing items section
    if (data.missing_items && data.missing_items.length > 0) {
      csvContent.push('ITENS NÃO ENCONTRADOS');
      csvContent.push('Item ID,Razão,Modelo,Marca,IMEI,Status');
      data.missing_items.forEach((item: any) => {
        const details = item.item_details;
        csvContent.push(`${item.item_id},${item.reason},${details?.model || ''},${details?.brand || ''},${details?.imei || ''},${details?.status || ''}`);
      });
      csvContent.push('');
    }

    // Tasks section
    if (data.tasks && data.tasks.length > 0) {
      csvContent.push('TAREFAS');
      csvContent.push('ID,Tipo,Descrição,Prioridade,Status,IMEI,Criada em,Resolvida em,Notas de Resolução');
      data.tasks.forEach((task: any) => {
        csvContent.push(`${task.id},${task.task_type},${task.description},${task.priority},${task.status},${task.imei || ''},${task.created_at},${task.resolved_at || ''},${task.resolution_notes || ''}`);
      });
    }

    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conferencia_${auditId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsJSON = async (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conferencia_${auditId}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPDF = async (data: any) => {
    const doc = new jsPDF();
    const { audit, scans, missing_items, tasks } = data;
    
    // Title
    doc.setFontSize(20);
    doc.text('Relatório de Conferência de Inventário', 14, 20);
    
    // Audit info
    doc.setFontSize(12);
    doc.text(`Local: ${audit.location}`, 14, 35);
    doc.text(`Status: ${audit.status}`, 14, 42);
    doc.text(`Iniciado em: ${new Date(audit.started_at).toLocaleString('pt-BR')}`, 14, 49);
    if (audit.finished_at) {
      doc.text(`Finalizado em: ${new Date(audit.finished_at).toLocaleString('pt-BR')}`, 14, 56);
    }
    
    let yPos = 70;
    
    // Summary
    if (data.summary) {
      doc.setFontSize(14);
      doc.text('Resumo', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: [
          ['Taxa de Conclusão', `${data.summary.completion_percentage}%`],
          ['Itens Esperados', data.summary.total_items_expected],
          ['Itens Encontrados', data.summary.items_found],
          ['Itens Faltantes', data.summary.items_missing],
          ['Itens Inesperados', data.summary.items_unexpected],
          ['Scans Duplicados', data.summary.duplicate_scans],
          ['Status Incongruente', data.summary.status_incongruent]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Scans
    if (scans && scans.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Escaneamentos', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data/Hora', 'IMEI', 'Resultado']],
        body: scans.slice(0, 50).map((scan: any) => [
          new Date(scan.timestamp).toLocaleString('pt-BR'),
          scan.imei || scan.serial || '-',
          scan.scan_result
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Missing items
    if (missing_items && missing_items.length > 0) {
      if (yPos > 250 || scans?.length > 30) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Itens Não Encontrados', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Modelo', 'Marca', 'IMEI', 'Razão']],
        body: missing_items.map((item: any) => [
          item.item_details?.model || '-',
          item.item_details?.brand || '-',
          item.item_details?.imei || '-',
          item.reason
        ]),
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Tasks
    if (tasks && tasks.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Tarefas', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Descrição', 'Status', 'Prioridade']],
        body: tasks.map((task: any) => [
          task.task_type,
          task.description,
          task.status,
          task.priority
        ]),
        theme: 'grid',
        headStyles: { fillColor: [243, 156, 18] }
      });
    }
    
    // Save PDF
    doc.save(`conferencia_${auditId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatório de Conferência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'pdf') => setExportFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <Table className="h-4 w-4" />
                    CSV (Excel compatível)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    JSON (dados estruturados)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                    <Download className="h-4 w-4" />
                    PDF (relatório formatado)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Data Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados a Incluir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summary" 
                  checked={includeData.summary}
                  onCheckedChange={(checked) => setIncludeData(prev => ({ ...prev, summary: !!checked }))}
                />
                <Label htmlFor="summary" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4" />
                  Resumo da conferência
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auditInfo" 
                  checked={includeData.auditInfo}
                  onCheckedChange={(checked) => setIncludeData(prev => ({ ...prev, auditInfo: !!checked }))}
                />
                <Label htmlFor="auditInfo" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Informações da auditoria
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="scans" 
                  checked={includeData.scans}
                  onCheckedChange={(checked) => setIncludeData(prev => ({ ...prev, scans: !!checked }))}
                />
                <Label htmlFor="scans" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4" />
                  Escaneamentos ({reportData?.scans?.length || 0})
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="missing" 
                  checked={includeData.missing}
                  onCheckedChange={(checked) => setIncludeData(prev => ({ ...prev, missing: !!checked }))}
                />
                <Label htmlFor="missing" className="flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4" />
                  Itens não encontrados ({reportData?.missing?.length || 0})
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tasks" 
                  checked={includeData.tasks}
                  onCheckedChange={(checked) => setIncludeData(prev => ({ ...prev, tasks: !!checked }))}
                />
                <Label htmlFor="tasks" className="flex items-center gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Tarefas pendentes ({reportData?.tasks?.length || 0})
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}