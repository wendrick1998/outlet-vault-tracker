import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Download, TrendingUp, Package, Users, Clock, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useLoans } from '@/hooks/useLoans';
import { useCustomers } from '@/hooks/useCustomers';

type ReportType = 'inventory' | 'loans' | 'performance' | 'trends';
type TimeRange = '7d' | '30d' | '90d' | '1y';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const SmartReporting: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isGenerating, setIsGenerating] = useState(false);

  const { items } = useInventory();
  const { loans } = useLoans();
  const { customers } = useCustomers();

  const generateInventoryReport = () => {
    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brandCounts = items.reduce((acc, item) => {
      acc[item.brand] = (acc[item.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      brandData: Object.entries(brandCounts).map(([name, value]) => ({ name, value })),
      totalItems: items.length,
      availableItems: statusCounts.available || 0,
      loanedItems: statusCounts.loaned || 0
    };
  };

  const generateLoansReport = () => {
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const monthlyLoans = loans.reduce((acc, loan) => {
      const month = new Date(loan.issued_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overdueDays = activeLoans.filter(loan => {
      if (!loan.due_at) return false;
      return new Date(loan.due_at) < new Date();
    }).length;

    return {
      monthlyData: Object.entries(monthlyLoans).map(([name, value]) => ({ name, value })),
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueDays,
      averageLoanDuration: 7 // Simulado
    };
  };

  const generatePerformanceReport = () => {
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        loans: Math.floor(Math.random() * 10) + 5,
        returns: Math.floor(Math.random() * 8) + 3,
        registrations: Math.floor(Math.random() * 3) + 1
      };
    }).reverse();

    return {
      dailyData: dailyActivity,
      totalTransactions: loans.length + items.length,
      averageResponseTime: '2.3s', // Simulado
      systemUptime: '99.9%' // Simulado
    };
  };

  const generateTrendsReport = () => {
    const trendData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        name: date.toLocaleDateString('pt-BR', { month: 'short' }),
        inventory: Math.floor(Math.random() * 100) + 200,
        loans: Math.floor(Math.random() * 50) + 75,
        customers: Math.floor(Math.random() * 20) + 30
      };
    }).reverse();

    return {
      trendData,
      growthRate: '+12%', // Simulado
      seasonalTrend: 'Crescente',
      predictedGrowth: '+8%'
    };
  };

  const exportReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reportData = getCurrentReportData();
    const csvContent = convertToCSV(reportData);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setIsGenerating(false);
  };

  const getCurrentReportData = () => {
    switch (reportType) {
      case 'inventory': return generateInventoryReport();
      case 'loans': return generateLoansReport();
      case 'performance': return generatePerformanceReport();
      case 'trends': return generateTrendsReport();
      default: return {};
    }
  };

  const convertToCSV = (data: any): string => {
    // Simplified CSV conversion
    return JSON.stringify(data, null, 2);
  };

  const renderInventoryReport = () => {
    const report = generateInventoryReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{report.totalItems}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{report.availableItems}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Emprestados</p>
                <p className="text-2xl font-bold text-orange-600">{report.loanedItems}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Status dos Itens</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={report.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                >
                  {report.statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-4">Distribuição por Marca</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={report.brandData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  const renderLoansReport = () => {
    const report = generateLoansReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{report.totalLoans}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{report.activeLoans}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">{report.overdueLoans}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Duração Média</p>
                <p className="text-2xl font-bold text-blue-600">{report.averageLoanDuration}d</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Empréstimos por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderPerformanceReport = () => {
    const report = generatePerformanceReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Transações Totais</p>
              <p className="text-2xl font-bold">{report.totalTransactions}</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Tempo de Resposta</p>
              <p className="text-2xl font-bold">{report.averageResponseTime}</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Disponibilidade</p>
              <p className="text-2xl font-bold text-green-600">{report.systemUptime}</p>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Atividade dos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="loans" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="returns" stroke="hsl(var(--secondary))" strokeWidth={2} />
              <Line type="monotone" dataKey="registrations" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderTrendsReport = () => {
    const report = generateTrendsReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Crescimento</p>
              <p className="text-2xl font-bold text-green-600">{report.growthRate}</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Tendência Sazonal</p>
              <p className="text-2xl font-bold">{report.seasonalTrend}</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Crescimento Previsto</p>
              <p className="text-2xl font-bold text-blue-600">{report.predictedGrowth}</p>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Tendências dos Últimos 12 Meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="inventory" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="loans" stroke="hsl(var(--secondary))" strokeWidth={2} />
              <Line type="monotone" dataKey="customers" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'inventory': return renderInventoryReport();
      case 'loans': return renderLoansReport();
      case 'performance': return renderPerformanceReport();
      case 'trends': return renderTrendsReport();
      default: return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Relatórios Inteligentes</h2>
        
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory">Inventário</SelectItem>
              <SelectItem value="loans">Empréstimos</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="trends">Tendências</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportReport}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Exportar'}
          </Button>
        </div>
      </div>

      {renderReport()}
    </Card>
  );
};