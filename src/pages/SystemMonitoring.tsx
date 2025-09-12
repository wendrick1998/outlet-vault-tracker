import React from 'react';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SystemMonitoring() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold">Sistema Operacional</p>
                <p className="text-sm text-muted-foreground">Todos os serviços funcionando</p>
              </div>
              <Badge className="bg-green-100 text-green-800 ml-auto">Online</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold">Segurança</p>
                <p className="text-sm text-muted-foreground">RLS ativos, validações OK</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 ml-auto">Seguro</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold">Avisos</p>
                <p className="text-sm text-muted-foreground">2 alertas de segurança menores</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 ml-auto">Atenção</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Monitoring Interface */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="security" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}