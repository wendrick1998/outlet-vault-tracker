import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Package, Users, Clock, AlertCircle } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { useStockAnalytics, useMovementAnalytics } from "@/hooks/useStockAnalytics";
import { useStockStats } from "@/hooks/useStock";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.destructive
];

interface AnalyticsProps {
  onBack?: () => void;
}

export const Analytics = ({ onBack }: AnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { data: analytics, isLoading: analyticsLoading } = useStockAnalytics(selectedPeriod);
  const { data: movements, isLoading: movementsLoading } = useMovementAnalytics(7);
  const { data: stats } = useStockStats();

  const isLoading = analyticsLoading || movementsLoading;

  // Prepare performance metrics
  const performanceMetrics = [
    {
      title: "Rotatividade",
      value: analytics?.demonstrationMetrics?.averageDaysInShowroom 
        ? `${Math.round(analytics.demonstrationMetrics.averageDaysInShowroom)} dias`
        : "N/A",
      subtitle: "Tempo médio em demonstração",
      icon: Clock,
      variant: "default" as const
    },
    {
      title: "Itens Ativos",
      value: stats?.total || 0,
      subtitle: "Total em estoque",
      icon: Package,
      variant: "success" as const
    },
    {
      title: "Em Demonstração", 
      value: stats?.vitrine || 0,
      subtitle: "Vitrine ativa",
      icon: TrendingUp,
      variant: "warning" as const
    },
    {
      title: "Reservados",
      value: stats?.reserved || 0,
      subtitle: "Empréstimos ativos",
      icon: Users,
      variant: "default" as const
    }
  ];

  const exportReport = (format: 'pdf' | 'excel') => {
    // TODO: Implementar exportação
    console.log(`Exporting ${format} report...`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Análise detalhada do estoque e operações</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada do estoque e operações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF  
          </Button>
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              Voltar
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <StatsCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            variant={metric.variant}
          />
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="locations">Localizações</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Movimentações por Período */}
            <Card>
              <CardHeader>
                <CardTitle>Movimentações por Período</CardTitle>
                <CardDescription>
                  Últimos {selectedPeriod} dias - Entradas, Transferências e Vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.movementsByPeriod?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.movementsByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="entries"
                        stackId="1"
                        stroke={CHART_COLORS.success}
                        fill={CHART_COLORS.success}
                        name="Entradas"
                      />
                      <Area
                        type="monotone"
                        dataKey="transfers"
                        stackId="1"
                        stroke={CHART_COLORS.warning}
                        fill={CHART_COLORS.warning}
                        name="Transferências"
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stackId="1"
                        stroke={CHART_COLORS.primary}
                        fill={CHART_COLORS.primary}
                        name="Vendas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    Nenhuma movimentação encontrada no período
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Status atual dos itens em estoque</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.statusTrends?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.statusTrends}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {analytics.statusTrends.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    Dados de status não disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>Últimas movimentações registradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements && movements.length > 0 ? (
                  movements.slice(0, 10).map((movement: any) => (
                    <div 
                      key={movement.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {movement.stock_item?.model || 'Item não identificado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movement.movement_type} • {movement.stock_item?.imei}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(movement.performed_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.performed_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    Nenhuma movimentação recente encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Localização</CardTitle>
              <CardDescription>Itens por localização física</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.locationDistribution?.length ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.locationDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      fill={CHART_COLORS.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mr-2" />
                  Dados de localização não disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Marcas</CardTitle>
              <CardDescription>Distribuição por marca</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topBrandsByCount?.length ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topBrandsByCount}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="brand" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      fill={CHART_COLORS.secondary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mr-2" />
                  Dados de marcas não disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};