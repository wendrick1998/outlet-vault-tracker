import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { 
  Activity, 
  Cpu, 
  Database, 
  Clock,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Mock performance data - in production this would come from actual monitoring
  const mockMetrics: PerformanceMetric[] = [
    {
      name: 'CPU Usage',
      value: Math.random() * 100,
      unit: '%',
      threshold: 80,
      status: 'good'
    },
    {
      name: 'Memory Usage',
      value: Math.random() * 100,
      unit: '%',
      threshold: 85,
      status: 'good'
    },
    {
      name: 'Database Response',
      value: Math.random() * 500 + 50,
      unit: 'ms',
      threshold: 300,
      status: 'good'
    },
    {
      name: 'Active Connections',
      value: Math.floor(Math.random() * 50) + 10,
      unit: '',
      threshold: 100,
      status: 'good'
    },
    {
      name: 'Query Performance',
      value: Math.random() * 200 + 50,
      unit: 'ms',
      threshold: 150,
      status: 'good'
    },
    {
      name: 'Scan Rate',
      value: Math.random() * 60 + 20,
      unit: '/min',
      threshold: 100,
      status: 'good'
    }
  ];

  const updateMetrics = React.useCallback(() => {
    setMetrics(prev => mockMetrics.map(metric => {
      const newValue = metric.value + (Math.random() - 0.5) * 10;
      let status: 'good' | 'warning' | 'critical' = 'good';
      
      if (metric.name === 'Database Response' || metric.name === 'Query Performance') {
        if (newValue > metric.threshold) status = 'warning';
        if (newValue > metric.threshold * 1.5) status = 'critical';
      } else {
        if (newValue > metric.threshold * 0.8) status = 'warning';
        if (newValue > metric.threshold) status = 'critical';
      }

      return {
        ...metric,
        value: Math.max(0, newValue),
        status
      };
    }));
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    updateMetrics();
    intervalRef.current = setInterval(updateMetrics, 2000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'CPU Usage':
        return <Cpu className="h-4 w-4" />;
      case 'Memory Usage':
        return <BarChart3 className="h-4 w-4" />;
      case 'Database Response':
      case 'Query Performance':
        return <Database className="h-4 w-4" />;
      case 'Active Connections':
        return <Activity className="h-4 w-4" />;
      case 'Scan Rate':
        return <Zap className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const averageHealth = metrics.length > 0 ? 
    metrics.filter(m => m.status === 'good').length / metrics.length * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitor de Performance
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento em tempo real do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Saúde: </span>
                <span className={getStatusColor(averageHealth > 80 ? 'good' : averageHealth > 60 ? 'warning' : 'critical')}>
                  {averageHealth.toFixed(0)}%
                </span>
              </div>
              {isMonitoring ? (
                <Button variant="destructive" size="sm" onClick={stopMonitoring}>
                  Parar Monitoramento
                </Button>
              ) : (
                <Button size="sm" onClick={startMonitoring}>
                  Iniciar Monitoramento
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde Geral do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Performance Geral</span>
              <span className={getStatusColor(averageHealth > 80 ? 'good' : 'warning')}>
                {averageHealth.toFixed(1)}%
              </span>
            </div>
            <Progress value={averageHealth} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={metric.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(metric.name)}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                {getStatusBadge(metric.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </div>
                
                {/* Progress bar for percentage-based metrics */}
                {metric.unit === '%' && (
                  <div className="space-y-1">
                    <Progress 
                      value={metric.value} 
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>Limite: {metric.threshold}%</span>
                    </div>
                  </div>
                )}
                
                {/* Threshold indicator for time-based metrics */}
                {(metric.unit === 'ms' || metric.unit === '/min') && (
                  <div className="text-xs text-muted-foreground">
                    Limite: {metric.threshold}{metric.unit}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Otimização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Otimize consultas do banco</p>
                <p className="text-muted-foreground">Use índices apropriados e evite consultas N+1</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Implemente cache</p>
                <p className="text-muted-foreground">Cache dados frequentemente acessados para melhor performance</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Monitore recursos</p>
                <p className="text-muted-foreground">Acompanhe uso de CPU e memória para detectar gargalos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}