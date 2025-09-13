import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { SecurityService } from '@/services/securityService';

interface SecurityMetrics {
  active_sessions: number;
  failed_logins_24h: number;
  recent_audits_7d: number;
  security_check_time: string;
  system_health: 'OK' | 'WARNING' | 'ALERT';
}

export const SecurityMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityMetrics();
    
    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(loadSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      setLoading(true);
      const data = await SecurityService.getSecurityMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar métricas de segurança');
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'OK':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'OK':
        return 'default';
      case 'WARNING':
        return 'secondary';
      case 'ALERT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Métricas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Activity className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Métricas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Métricas de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Sistema</span>
              <Badge variant={getHealthBadgeVariant(metrics.system_health)} className="flex items-center gap-1">
                {getHealthIcon(metrics.system_health)}
                {metrics.system_health}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.active_sessions}</div>
                <div className="text-sm text-muted-foreground">Sessões Ativas</div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-500">{metrics.failed_logins_24h}</div>
                <div className="text-sm text-muted-foreground">Falhas de Login (24h)</div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.recent_audits_7d}</div>
                <div className="text-sm text-muted-foreground">Auditorias (7 dias)</div>
              </div>
            </div>

            {metrics.failed_logins_24h > 20 && (
              <Alert variant={metrics.failed_logins_24h > 50 ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {metrics.failed_logins_24h > 50 
                    ? 'ALERTA: Número elevado de tentativas de login falhadas detectadas!'
                    : 'AVISO: Monitorar tentativas de login falhadas.'
                  }
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground">
              Última atualização: {new Date(metrics.security_check_time).toLocaleString('pt-BR')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};