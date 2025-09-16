import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStock, useStockStats } from "@/hooks/useStock";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from "date-fns";
import { StatsCard } from "@/components/ui/stats-card";

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const StockReports = () => {
  const [reportType, setReportType] = useState<'inventory' | 'movements' | 'conferences'>('inventory');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
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

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório de Estoque', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 35);
    doc.text(`Total de itens: ${filteredItems.length}`, 20, 45);
    
    // Filtros aplicados
    let yPos = 55;
    if (selectedStatus !== 'all') {
      doc.text(`Filtro Status: ${selectedStatus}`, 20, yPos);
      yPos += 10;
    }
    if (selectedLocation !== 'all') {
      doc.text(`Filtro Localização: ${selectedLocation}`, 20, yPos);
      yPos += 10;
    }

    // Tabela de itens
    const tableColumns = ['IMEI', 'Marca', 'Modelo', 'Cor', 'Status', 'Localização', 'Bateria'];
    const tableRows = filteredItems.map(item => [
      item.imei,
      item.brand,
      item.model,
      item.color || '-',
      item.status,
      item.location,
      `${item.battery_pct || 100}%`
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPos + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Salvar
    doc.save(`estoque-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
    
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
    // Placeholder para exportação Excel
    toast({
      title: "Em desenvolvimento",
      description: "Exportação para Excel será implementada em breve",
    });
  };

  const handleGenerateReport = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Itens"
            value={stats.total}
            icon={Package}
            variant="default"
          />
          <StatsCard
            title="Disponíveis"
            value={stats.available}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Vendidos"
            value={stats.sold}
            icon={BarChart3}
            variant="default"
          />
          <StatsCard
            title="Reservados"
            value={stats.reserved}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>
      )}

      {/* Configurações do Relatório */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Gerar Relatórios</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
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

          {/* Status */}
          <div className="space-y-2">
            <Label>Filtrar por Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label>Filtrar por Localização</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Localizações</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="vitrine">Vitrine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Período (para movimentações e conferências) */}
        {reportType !== 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleGenerateReport}>
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
          
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Relatório
          </Button>
        </div>
      </Card>

      {/* Resumo dos Dados */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo dos Dados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div>
            <h4 className="font-medium mb-3">Distribuição por Status</h4>
            <div className="space-y-2">
              {stats && (
                <>
                  <div className="flex justify-between">
                    <span>Disponível</span>
                    <Badge variant="default">{stats.available}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Reservado</span>
                    <Badge variant="secondary">{stats.reserved}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendido</span>
                    <Badge variant="outline">{stats.sold}</Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location Distribution */}
          <div>
            <h4 className="font-medium mb-3">Distribuição por Local</h4>
            <div className="space-y-2">
              {stats && (
                <>
                  <div className="flex justify-between">
                    <span>Estoque</span>
                    <Badge variant="default">{stats.estoque}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Vitrine</span>
                    <Badge variant="secondary">{stats.vitrine}</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};