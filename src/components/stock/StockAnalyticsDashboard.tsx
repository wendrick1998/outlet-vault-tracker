import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ResponsiveContainer } from "recharts";
import { useStockAnalytics, useMovementAnalytics } from "@/hooks/useStockAnalytics";
import { Loading } from "@/components/ui/loading";
import { TrendingUp, TrendingDown, BarChart3, Activity, Package, Store } from "lucide-react";

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))", 
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.destructive,
];

export const StockAnalyticsDashboard = () => {
  const { data: analytics, isLoading: isLoadingAnalytics } = useStockAnalytics(30);
  const { data: movements, isLoading: isLoadingMovements } = useMovementAnalytics(7);

  if (isLoadingAnalytics || isLoadingMovements) {
    return <Loading />;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentações por Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Movimentações (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                entries: { label: "Entradas", color: CHART_COLORS.success },
                transfers: { label: "Transferências", color: CHART_COLORS.warning },
                sales: { label: "Vendas", color: CHART_COLORS.primary },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.movementsByPeriod}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="entries" stackId="1" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.8} />
                  <Area type="monotone" dataKey="transfers" stackId="1" stroke={CHART_COLORS.warning} fill={CHART_COLORS.warning} fillOpacity={0.8} />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Distribuição por Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                analytics.locationDistribution.map((item, index) => [
                  item.location,
                  { label: item.location, color: PIE_COLORS[index % PIE_COLORS.length] }
                ])
              )}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.locationDistribution}
                    dataKey="count"
                    nameKey="location"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ location, percentage }) => `${location} (${percentage}%)`}
                  >
                    {analytics.locationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Marcas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Marcas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                analytics.topBrandsByCount.map((item, index) => [
                  item.brand,
                  { label: item.brand, color: PIE_COLORS[index % PIE_COLORS.length] }
                ])
              )}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topBrandsByCount.slice(0, 5)} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="brand" type="category" width={60} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Métricas de Demonstração */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Demonstração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total em Demonstração</span>
              <span className="text-2xl font-bold text-warning">{analytics.demonstrationMetrics.totalDemonstrations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Média de Dias na Vitrine</span>
              <span className="text-lg font-semibold">{Math.round(analytics.demonstrationMetrics.averageDaysInShowroom)} dias</span>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Top Modelos em Demonstração</span>
              {analytics.demonstrationMetrics.topDemonstrationModels.slice(0, 3).map((model) => (
                <div key={model.model} className="flex justify-between text-sm">
                  <span>{model.model}</span>
                  <span className="font-medium">{model.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendências de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.statusTrends.map((trend) => (
              <div key={trend.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="capitalize text-sm">{trend.status}</span>
                  {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                  {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                </div>
                <span className="font-semibold">{trend.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Movimentações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {movements?.slice(0, 10).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">
                      {movement.stock_item?.brand} {movement.stock_item?.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      IMEI: {movement.stock_item?.imei?.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium capitalize">
                    {movement.movement_type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(movement.performed_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};