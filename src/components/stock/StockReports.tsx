import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, TrendingUp } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockStats } from '@/hooks/useStockStats';
import { StatsCard } from '@/components/ui/stats-card';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const StockReports = () => {
  const [reportType, setReportType] = useState('inventory');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { items: stockItems = [] } = useStock();
  const { data: stats } = useStockStats();

  const generateInventoryPDF = () => {
    const doc = new jsPDF();
    
    // Filtrar itens baseado nos filtros
    let filteredItems = stockItems;
    
    if (selectedStatus !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === selectedStatus);
    }
    
    if (selectedLocation !== 'all') {
      filteredItems = filteredItems.filter(item => item.location === selectedLocation);
    }

    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Estoque', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
    
    
    // Filters applied
    let filtersText = 'Filtros: ';
    if (selectedStatus !== 'all') filtersText += `Status: ${selectedStatus} `;
    if (selectedLocation !== 'all') filtersText += `Local: ${selectedLocation}`;
    doc.text(filtersText, 20, 40);

    // Table data
    const tableData = filteredItems.map(item => [
      item.imei,
      item.brand,
      item.model,
      item.color || '-',
      item.storage || '-',
      item.condition,
      item.status,
      item.location,
      `${item.battery_pct || 100}%`
    ]);

    // Create table
    (doc as any).autoTable({
      head: [['IMEI', 'Marca', 'Modelo', 'Cor', 'Armazenamento', 'Condição', 'Status', 'Local', 'Bateria']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total de itens: ${filteredItems.length}`, 20, finalY);
    
    doc.save(`relatorio-estoque-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    
    toast({
      title: "Relatório gerado",
      description: "Relatório PDF foi baixado com sucesso",
    });
  };

  const generateMovementsReport = () => {
    // Placeholder para relatório de movimentações
    toast({
      title: "Em desenvolvimento",
      description: "Relatório de movimentações será implementado em breve",
    });
  };

  const generateConferencesReport = () => {
    // Placeholder para relatório de conferências
    toast({
      title: "Em desenvolvimento", 
      description: "Relatório de conferências será implementado em breve",
    });
  };

  const exportToExcel = () => {
    let filteredItems = stockItems;
    if (selectedStatus !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === selectedStatus);
    }
    if (selectedLocation !== 'all') {
      filteredItems = filteredItems.filter(item => item.location === selectedLocation);
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map(item => ({
        IMEI: item.imei,
        Marca: item.brand,
        Modelo: item.model,
        Cor: item.color || '-',
        Armazenamento: item.storage || '-',
        Condição: item.condition,
        Status: item.status,
        Local: item.location,
        'Bateria (%)': item.battery_pct || 100,
        'Data Criação': format(new Date(item.created_at), 'dd/MM/yyyy'),
        Custo: item.cost || '-',
        Preço: item.price || '-'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    
    XLSX.writeFile(workbook, `estoque-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    
    toast({
      title: "Arquivo exportado",
      description: "Arquivo Excel foi baixado com sucesso",
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      switch (reportType) {
        case 'inventory':
          generateInventoryPDF();
          break;
        case 'movements':
          generateMovementsReport();
          break;
        case 'conferences':
          generateConferencesReport();
          break;
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Itens"
          value={stats?.totalItems || 0}
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="Disponíveis"
          value={stats?.availableItems || 0}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Reservados"
          value={stats?.reservedItems || 0}
          icon={TrendingUp}
          variant="warning"
        />
        <StatsCard
          title="Vendidos"
          value={stats?.soldItems || 0}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuração de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventário Atual</SelectItem>
                  <SelectItem value="movements">Movimentações</SelectItem>
                  <SelectItem value="conferences">Conferências</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="defeituoso">Defeituoso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Local</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="vitrine">Vitrine</SelectItem>
                  <SelectItem value="reserva">Reserva</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(reportType === 'movements' || reportType === 'conferences') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Gerar PDF'}
            </Button>
            
            {reportType === 'inventory' && (
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            )}

            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Agendar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Por Status</h4>
              <div className="flex flex-wrap gap-2">
                {['disponivel', 'reservado', 'vendido', 'defeituoso'].map(status => {
                  const count = stockItems.filter(item => item.status === status).length;
                  return (
                    <Badge key={status} variant="secondary">
                      {status}: {count}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Por Local</h4>
              <div className="flex flex-wrap gap-2">
                {['estoque', 'vitrine', 'reserva', 'manutencao'].map(location => {
                  const count = stockItems.filter(item => item.location === location).length;
                  return (
                    <Badge key={location} variant="outline">
                      {location}: {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};