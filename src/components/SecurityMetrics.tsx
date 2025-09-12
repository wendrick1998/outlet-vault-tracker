import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { metrics, METRIC_NAMES } from '@/lib/metrics';
import { Shield, Clock, Zap, AlertTriangle } from 'lucide-react';

export const SecurityMetrics: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show metrics in development or when explicitly enabled
    const showMetrics = localStorage.getItem('debug_metrics') === 'true' || 
                       import.meta.env.DEV;
    setIsVisible(showMetrics);

    if (!showMetrics) return;

    const updateStats = () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      setStats({
        passwordValidation: metrics.getStats(METRIC_NAMES.PASSWORD_VALIDATION_TIME, oneHourAgo),
        hibpResponse: metrics.getStats(METRIC_NAMES.HIBP_RESPONSE_TIME, oneHourAgo),
        hibpFallbacks: metrics.getMetrics(METRIC_NAMES.HIBP_FALLBACK_RATE, oneHourAgo).length,
        sseConnections: metrics.getStats(METRIC_NAMES.SSE_TTV, oneHourAgo),
        errors: metrics.getMetrics(METRIC_NAMES.ERROR_RATE, oneHourAgo).length,
      });
    };

    // Update immediately and then every 30 seconds
    updateStats();
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return null;
  }

  const getHealthScore = () => {
    const factors = [
      stats.passwordValidation?.avg < 1000 ? 25 : 0, // < 1s response time
      stats.hibpResponse?.avg < 3000 ? 25 : 0, // < 3s HIBP response
      stats.hibpFallbacks < 10 ? 25 : 0, // < 10 fallbacks per hour
      stats.errors < 5 ? 25 : 0, // < 5 errors per hour
    ];
    return factors.reduce((sum, score) => sum + score, 0);
  };

  const healthScore = getHealthScore();

  return (
    <Card className="border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-900/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security Metrics (Dev/Debug)
          <Badge variant={healthScore >= 75 ? 'default' : healthScore >= 50 ? 'secondary' : 'destructive'}>
            {healthScore}% Health
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Password Validation Performance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Validação de Senha</span>
            </div>
            <div className="text-muted-foreground">
              {stats.passwordValidation ? (
                <>
                  Média: {Math.round(stats.passwordValidation.avg)}ms
                  <br />
                  Máx: {stats.passwordValidation.max}ms
                </>
              ) : (
                'Nenhum dado'
              )}
            </div>
          </div>

          {/* HIBP Performance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>HIBP Response</span>
            </div>
            <div className="text-muted-foreground">
              {stats.hibpResponse ? (
                <>
                  Média: {Math.round(stats.hibpResponse.avg)}ms
                  <br />
                  Fallbacks: {stats.hibpFallbacks}
                </>
              ) : (
                'Nenhum dado'
              )}
            </div>
          </div>

          {/* SSE Performance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>SSE Time-to-Value</span>
            </div>
            <div className="text-muted-foreground">
              {stats.sseConnections ? (
                <>
                  Média: {Math.round(stats.sseConnections.avg)}ms
                  <br />
                  Conexões: {stats.sseConnections.count}
                </>
              ) : (
                'Nenhum dado'
              )}
            </div>
          </div>

          {/* Error Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Errors (1h)</span>
            </div>
            <div className="text-muted-foreground">
              {stats.errors} erros
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>System Health</span>
            <span>{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground">
          💡 Para ver métricas: localStorage.setItem('debug_metrics', 'true')
        </div>
      </CardContent>
    </Card>
  );
};