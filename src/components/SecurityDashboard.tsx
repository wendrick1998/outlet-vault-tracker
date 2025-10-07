import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedPerformanceCard } from './optimized/OptimizedPerformanceCard';
import { VirtualList } from './optimized/VirtualList';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { useInconsistencyMonitor } from '@/hooks/useInconsistencyMonitor';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Users,
  Clock,
  Database,
  TrendingUp
} from 'lucide-react';

export function SecurityDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Monitor inconsistências
  const { count: inconsistencyCount, severity } = useInconsistencyMonitor(true);

  // Mock security data - in production this would come from the security service
  const securityMetrics = {
    activeUsers: 12,
    failedLogins: 3,
    activeSessions: 8,
    recentAudits: 15,
    systemHealth: (severity === 'critical' ? 'ALERT' : severity === 'warning' ? 'WARNING' : 'OK') as 'OK' | 'WARNING' | 'ALERT'
  };

  const recentEvents = [
    {
      id: '1',
      type: 'login_success',
      user: 'admin@company.com',
      timestamp: new Date(),
      details: 'Login bem-sucedido'
    },
    {
      id: '2',
      type: 'audit_created',
      user: 'manager@company.com', 
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      details: 'Nova conferência iniciada'
    },
    {
      id: '3',
      type: 'permission_denied',
      user: 'user@company.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      details: 'Acesso negado à área administrativa'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'audit_created':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'permission_denied':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'OK':
        return <Badge className="bg-green-100 text-green-800">Sistema Seguro</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case 'ALERT':
        return <Badge className="bg-red-100 text-red-800">Alerta</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const renderEventItem = useCallback((event: typeof recentEvents[0], index: number) => (
    <div className="flex items-start gap-3 p-3 border-b last:border-b-0">
      {getEventIcon(event.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{event.details}</p>
          <span className="text-xs text-muted-foreground">
            {event.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{event.user}</p>
      </div>
    </div>
  ), []);

  const filteredEvents = recentEvents.filter(event =>
    event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Dashboard de Segurança
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento de segurança e atividades do sistema
              </p>
            </div>
            {getHealthBadge(securityMetrics.systemHealth)}
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <OptimizedPerformanceCard
          title="Usuários Ativos"
          value={securityMetrics.activeUsers}
          icon={Users}
          description="Usuários conectados agora"
          changeType="increase"
          change={8}
        />
        
        <OptimizedPerformanceCard
          title="Tentativas Falhadas"
          value={securityMetrics.failedLogins}
          icon={AlertTriangle}
          description="Login falhado (24h)"
          changeType={securityMetrics.failedLogins > 5 ? "increase" : "neutral"}
          change={securityMetrics.failedLogins > 5 ? 25 : undefined}
        />
        
        <OptimizedPerformanceCard
          title="Sessões Ativas"
          value={securityMetrics.activeSessions}
          icon={Clock}
          description="Sessões em andamento"
          changeType="neutral"
        />
        
        <OptimizedPerformanceCard
          title="Auditorias Recentes"
          value={securityMetrics.recentAudits}
          icon={Database}
          description="Conferências (7 dias)"
          changeType="increase"
          change={15}
        />
        
        <OptimizedPerformanceCard
          title="Inconsistências"
          value={inconsistencyCount}
          icon={AlertTriangle}
          description="Loans vs Inventory"
          changeType={severity === 'critical' ? 'increase' : severity === 'warning' ? 'neutral' : 'decrease'}
          change={severity === 'critical' ? 100 : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'events', label: 'Eventos' },
          { id: 'users', label: 'Usuários' },
          { id: 'settings', label: 'Configurações' }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Eventos Recentes</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Última hora</SelectItem>
                    <SelectItem value="24h">24 horas</SelectItem>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <VirtualList
              items={filteredEvents}
              itemHeight={70}
              containerHeight={400}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              className="border-t"
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Segurança Geral</span>
                  <span className="text-green-600 font-medium">95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Conformidade RLS</span>
                  <span className="text-blue-600 font-medium">88%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span className="text-purple-600 font-medium">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center gap-3 text-sm">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <p className="font-medium">{event.details}</p>
                      <p className="text-muted-foreground">{event.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}