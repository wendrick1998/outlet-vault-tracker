import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockAnalyticsDashboard } from '@/components/analytics/StockAnalyticsDashboard';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { StockReports } from '@/components/stock/StockReports';
import { BarChart3, DollarSign, FileText, TrendingUp } from 'lucide-react';

export const AdvancedAnalytics = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avançadas</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e relatórios do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics de Estoque
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Análise de Receita
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <StockAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueAnalytics />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <StockReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};