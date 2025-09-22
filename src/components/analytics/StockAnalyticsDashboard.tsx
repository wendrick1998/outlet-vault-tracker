import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useStockAnalytics, useMovementAnalytics } from '@/hooks/useStockAnalytics';
import { TrendingUp, Package, Battery, DollarSign, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const StockAnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useStockAnalytics(30);
  const { data: movements } = useMovementAnalytics(7);

  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted/50" />
            <CardContent className="h-32 bg-muted/30" />
          </Card>
        ))}
      </div>
    );
  }

  const chartData = analytics.movementsByPeriod.map(item => ({
    date: item.date,
    movimentos: item.entries + item.transfers + item.sales
  }));

  const locationData = analytics.locationDistribution.map(item => ({
    name: item.location,
    value: item.count,
    percentage: item.percentage
  }));

  const brandData = analytics.topBrandsByCount.map(item => ({
    marca: item.brand,
    quantidade: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Demonstrações"
          value={analytics.demonstrationMetrics.totalDemonstrations}
          icon={Package}
          variant="default"
        />
        <StatsCard
          title="Movimentações (7d)"
          value={analytics.movementsByPeriod.reduce((sum, item) => sum + item.entries + item.transfers + item.sales, 0)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Bateria Baixa"
          value={analytics.locationDistribution.reduce((sum, val) => sum + val.count, 0)}
          icon={Battery}
          variant="warning"
        />
        <StatsCard
          title="Valor em Estoque"
          value={85000}
          icon={DollarSign}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movements Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="movimentos" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary)/0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Local</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands */}
        <Card>
          <CardHeader>
            <CardTitle>Top Marcas por Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="marca" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Demonstration Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Demonstração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total de Demonstrações</span>
              <Badge variant="secondary">{analytics.demonstrationMetrics.totalDemonstrations}</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tempo Médio na Vitrine</span>
                <span>{analytics.demonstrationMetrics.averageDaysInShowroom} dias</span>
              </div>
              <Progress 
                value={(analytics.demonstrationMetrics.averageDaysInShowroom / 30) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Top Modelos</span>
              {analytics.demonstrationMetrics.topDemonstrationModels.slice(0, 3).map((item) => (
                <div key={item.model} className="flex justify-between items-center">
                  <span className="text-sm">{item.model}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {movements?.slice(0, 10).map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">{movement.stock_item?.imei}</p>
                    <p className="text-sm text-muted-foreground">
                      {movement.stock_item?.brand} {movement.stock_item?.model}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{movement.movement_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(movement.performed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};