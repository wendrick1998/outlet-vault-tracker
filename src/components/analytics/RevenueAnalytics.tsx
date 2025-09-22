import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Target, Award } from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Mock data - in real app, this would come from hooks
const revenueData = [
  { month: 'Jan', revenue: 45000, profit: 15000, items: 45 },
  { month: 'Fev', revenue: 52000, profit: 18000, items: 52 },
  { month: 'Mar', revenue: 48000, profit: 16000, items: 48 },
  { month: 'Abr', revenue: 61000, profit: 22000, items: 61 },
  { month: 'Mai', revenue: 55000, profit: 19000, items: 55 },
  { month: 'Jun', revenue: 67000, profit: 25000, items: 67 },
];

const categoryData = [
  { name: 'iPhone', value: 45, revenue: 180000 },
  { name: 'Samsung', value: 30, revenue: 90000 },
  { name: 'Xiaomi', value: 15, revenue: 30000 },
  { name: 'Outros', value: 10, revenue: 20000 }
];

const performanceData = [
  { seller: 'João Silva', sales: 15, revenue: 45000, commission: 4500 },
  { seller: 'Maria Santos', sales: 12, revenue: 38000, commission: 3800 },
  { seller: 'Pedro Lima', sales: 10, revenue: 32000, commission: 3200 },
  { seller: 'Ana Costa', sales: 8, revenue: 25000, commission: 2500 }
];

export const RevenueAnalytics = () => {
  const [period, setPeriod] = useState('6months');
  const [category, setCategory] = useState('all');

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
            <SelectItem value="6months">Últimos 6 meses</SelectItem>
            <SelectItem value="1year">Último ano</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="iphone">iPhone</SelectItem>
            <SelectItem value="samsung">Samsung</SelectItem>
            <SelectItem value="xiaomi">Xiaomi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Receita Total"
          value="R$ 328.000"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Lucro Líquido"
          value="R$ 115.000"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Ticket Médio"
          value="R$ 1.245"
          icon={Target}
          variant="default"
        />
        <StatsCard
          title="Meta do Mês"
          value="87%"
          icon={Award}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `R$ ${Number(value).toLocaleString('pt-BR')}`,
                    name === 'revenue' ? 'Receita' : 'Lucro'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `R$ ${props.payload.revenue.toLocaleString('pt-BR')}`,
                    'Receita'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} itens`, 'Vendas']}
                />
                <Bar dataKey="items" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((seller, index) => (
                <div key={seller.seller} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{seller.seller}</p>
                      <p className="text-sm text-muted-foreground">{seller.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {seller.revenue.toLocaleString('pt-BR')}</p>
                    <Badge variant="secondary">
                      R$ {seller.commission.toLocaleString('pt-BR')} comissão
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35.1%</div>
            <p className="text-xs text-muted-foreground">+2.1% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">De demonstrações para vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tempo Médio de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 dias</div>
            <p className="text-xs text-muted-foreground">Da entrada ao estoque à venda</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};