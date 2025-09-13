import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  lastChecked?: Date;
}

export const SystemHealthCheck = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'PWA Icons', status: 'checking', message: 'Verificando ícones...' },
    { name: 'Service Worker', status: 'checking', message: 'Verificando SW...' },
    { name: 'Lazy Routes', status: 'checking', message: 'Verificando rotas...' },
    { name: 'Edge Functions', status: 'checking', message: 'Verificando IA...' }
  ]);

  const runHealthChecks = async () => {
    const newChecks: HealthCheck[] = [];
    
    // Check PWA Icons
    try {
      const icon192 = await fetch('/icons/icon-192.png');
      const icon512 = await fetch('/icons/icon-512.png');
      
      if (icon192.ok && icon512.ok) {
        newChecks.push({
          name: 'PWA Icons',
          status: 'healthy',
          message: 'Ícones PWA válidos e acessíveis',
          lastChecked: new Date()
        });
      } else {
        newChecks.push({
          name: 'PWA Icons',
          status: 'error',
          message: 'Um ou mais ícones PWA não encontrados',
          lastChecked: new Date()
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'PWA Icons',
        status: 'error',
        message: 'Erro ao verificar ícones PWA',
        lastChecked: new Date()
      });
    }

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
        newChecks.push({
          name: 'Service Worker',
          status: 'healthy',
          message: 'Service Worker ativo e funcionando',
          lastChecked: new Date()
        });
      } catch (error) {
        newChecks.push({
          name: 'Service Worker',
          status: 'warning',
          message: 'Service Worker com problemas',
          lastChecked: new Date()
        });
      }
    } else {
      newChecks.push({
        name: 'Service Worker',
        status: 'warning',
        message: 'Service Worker não supportado',
        lastChecked: new Date()
      });
    }

    // Check Lazy Routes (simulate loading History)
    try {
      await import('../pages/History');
      newChecks.push({
        name: 'Lazy Routes',
        status: 'healthy',
        message: 'Rotas lazy carregando corretamente',
        lastChecked: new Date()
      });
    } catch (error) {
      newChecks.push({
        name: 'Lazy Routes',
        status: 'error',
        message: 'Erro ao carregar rotas lazy',
        lastChecked: new Date()
      });
    }

    // Check Edge Functions (lightweight test)
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      newChecks.push({
        name: 'Edge Functions',
        status: response.ok ? 'healthy' : 'warning',
        message: response.ok ? 'Conectividade com backend OK' : 'Backend com problemas',
        lastChecked: new Date()
      });
    } catch (error) {
      newChecks.push({
        name: 'Edge Functions',
        status: 'warning',
        message: 'Sem conectividade com backend',
        lastChecked: new Date()
      });
    }

    setChecks(newChecks);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Saudável</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800">Verificando</Badge>;
    }
  };

  const overallStatus = checks.every(c => c.status === 'healthy') ? 'healthy' :
                      checks.some(c => c.status === 'error') ? 'error' : 'warning';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Health Check do Sistema</h3>
        <div className="flex items-center gap-2">
          {getStatusIcon(overallStatus)}
          {getStatusBadge(overallStatus)}
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.name} className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              {getStatusIcon(check.status)}
              <div>
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-muted-foreground">{check.message}</div>
                {check.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    Última verificação: {check.lastChecked.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            {getStatusBadge(check.status)}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Status geral do sistema: {overallStatus === 'healthy' ? '✅ Todos os sistemas funcionando' :
                                   overallStatus === 'error' ? '❌ Problemas críticos detectados' :
                                   '⚠️ Alguns sistemas precisam de atenção'}
        </div>
        <Button onClick={runHealthChecks} variant="outline" size="sm">
          Verificar Novamente
        </Button>
      </div>
    </Card>
  );
};