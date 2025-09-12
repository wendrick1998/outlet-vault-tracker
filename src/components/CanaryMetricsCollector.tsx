import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Clock, 
  Zap, 
  Shield, 
  AlertTriangle,
  Camera
} from 'lucide-react';
import { metrics, METRIC_NAMES } from '@/lib/metrics';
import { canaryManager } from '@/lib/canary-deployment';

interface MetricsSummary {
  hibp: {
    p50: number;
    p95: number;
    fallbacks: number;
    totalCalls: number;
  };
  sse: {
    p50: number;
    p95: number;
    connections: number;
    avgDuration: number;
  };
  errors: {
    totalErrors: number;
    errorRate: number;
  };
  healthScore: number;
}

export const CanaryMetricsCollector: React.FC = () => {
  const [metrics24h, setMetrics24h] = useState<MetricsSummary | null>(null);
  const [metricsCanary, setMetricsCanary] = useState<MetricsSummary | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const canaryState = canaryManager.getState();

  // Collect metrics for comparison
  const collectMetrics = (since?: number): MetricsSummary => {
    const hibpTimes = metrics.getMetrics(METRIC_NAMES.HIBP_RESPONSE_TIME, since);
    const hibpFallbacks = metrics.getMetrics(METRIC_NAMES.HIBP_FALLBACK_RATE, since);
    const sseTimes = metrics.getMetrics(METRIC_NAMES.SSE_TTV, since);
    const errors = metrics.getMetrics(METRIC_NAMES.ERROR_RATE, since);

    // Calculate percentiles
    const calculatePercentile = (values: number[], percentile: number) => {
      if (values.length === 0) return 0;
      const sorted = values.sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[index] || 0;
    };

    const hibpValues = hibpTimes.map(m => m.value);
    const sseValues = sseTimes.map(m => m.value);

    return {
      hibp: {
        p50: calculatePercentile(hibpValues, 50),
        p95: calculatePercentile(hibpValues, 95),
        fallbacks: hibpFallbacks.length,
        totalCalls: hibpTimes.length
      },
      sse: {
        p50: calculatePercentile(sseValues, 50),
        p95: calculatePercentile(sseValues, 95),
        connections: sseTimes.length,
        avgDuration: sseValues.reduce((a, b) => a + b, 0) / sseValues.length || 0
      },
      errors: {
        totalErrors: errors.length,
        errorRate: errors.length / ((since ? Date.now() - since : 24 * 60 * 60 * 1000) / (60 * 60 * 1000)) // per hour
      },
      healthScore: calculateHealthScore(hibpValues, hibpFallbacks.length, sseValues, errors.length)
    };
  };

  const calculateHealthScore = (
    hibpValues: number[], 
    fallbacks: number, 
    sseValues: number[], 
    errorCount: number
  ): number => {
    const factors = [
      (hibpValues.length === 0 || hibpValues.reduce((a, b) => a + b, 0) / hibpValues.length < 3000) ? 25 : 0,
      fallbacks < 5 ? 25 : 0,
      (sseValues.length === 0 || sseValues.reduce((a, b) => a + b, 0) / sseValues.length < 2000) ? 25 : 0,
      errorCount < 5 ? 25 : 0
    ];
    
    return factors.reduce((sum, score) => sum + score, 0);
  };

  // Auto-collect metrics when canary starts
  useEffect(() => {
    if (canaryState.isActive && !metricsCanary) {
      const now = Date.now();
      const last24h = now - (24 * 60 * 60 * 1000);
      
      // Collect baseline (24h before canary)
      setMetrics24h(collectMetrics(last24h));
    }
    
    if (canaryState.isActive) {
      // Collect canary metrics (since canary start)
      setMetricsCanary(collectMetrics(canaryState.startTime));
    }
  }, [canaryState.isActive, canaryState.startTime]);

  // Periodic updates during canary
  useEffect(() => {
    if (!canaryState.isActive) return;

    const interval = setInterval(() => {
      setMetricsCanary(collectMetrics(canaryState.startTime));
    }, 2 * 60 * 1000); // Update every 2 minutes

    return () => clearInterval(interval);
  }, [canaryState.isActive, canaryState.startTime]);

  const handleCollectEvidence = async () => {
    setIsCollecting(true);
    
    try {
      // Take screenshot of current metrics (simulate)
      const screenshot = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        metrics: metricsCanary,
        canaryState
      };

      // Collect comprehensive evidence
      const evidence = {
        deploymentInfo: {
          buildHash: canaryState.buildHash,
          startTime: new Date(canaryState.startTime).toISOString(),
          phase: canaryState.phase,
          trafficPercentage: canaryState.trafficPercentage
        },
        metrics: {
          before: metrics24h,
          during: metricsCanary
        },
        screenshot,
        qualityGates: canaryState.qualityGatesStatus,
        collectedAt: new Date().toISOString()
      };

      // Store evidence
      localStorage.setItem('canary_complete_evidence', JSON.stringify(evidence, null, 2));
      
      // Auto-download
      const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canary-complete-evidence-${canaryState.buildHash}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } finally {
      setIsCollecting(false);
    }
  };

  const MetricCard = ({ 
    title, 
    icon, 
    before, 
    during, 
    unit, 
    target, 
    inverse = false 
  }: {
    title: string;
    icon: React.ReactNode;
    before?: number;
    during?: number;
    unit: string;
    target: number;
    inverse?: boolean;
  }) => {
    const isImprovement = during !== undefined && before !== undefined ? 
      (inverse ? during < before : during > before) : false;
    
    const meetsTarget = during !== undefined ? 
      (inverse ? during <= target : during >= target) : false;

    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Badge variant={meetsTarget ? "default" : "destructive"}>
            {meetsTarget ? "✅" : "❌"}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Antes:</span>
            <span>{before ? Math.round(before) : '-'}{unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Canário:</span>
            <span className={during !== undefined ? (meetsTarget ? "text-green-600" : "text-red-600") : ""}>
              {during ? Math.round(during) : '-'}{unit}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Target:</span>
            <span>{inverse ? '≤' : '≥'} {target}{unit}</span>
          </div>
        </div>
      </Card>
    );
  };

  if (!canaryState.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Coletor de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Inicie um deploy canário para começar a coleta de métricas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with collection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Evidências do Deploy Canário
            </div>
            <Button 
              onClick={handleCollectEvidence}
              disabled={isCollecting}
              size="sm"
              className="flex items-center gap-1"
            >
              {isCollecting ? <Clock className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              {isCollecting ? 'Coletando...' : 'Coletar Evidências'}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="HIBP P50"
          icon={<Shield className="h-4 w-4" />}
          before={metrics24h?.hibp.p50}
          during={metricsCanary?.hibp.p50}
          unit="ms"
          target={3000}
          inverse={true}
        />
        
        <MetricCard
          title="HIBP P95"
          icon={<Shield className="h-4 w-4" />}
          before={metrics24h?.hibp.p95}
          during={metricsCanary?.hibp.p95}
          unit="ms"
          target={5000}
          inverse={true}
        />
        
        <MetricCard
          title="SSE TTV P50"
          icon={<Zap className="h-4 w-4" />}
          before={metrics24h?.sse.p50}
          during={metricsCanary?.sse.p50}
          unit="ms"
          target={2000}
          inverse={true}
        />
        
        <MetricCard
          title="Error Rate"
          icon={<AlertTriangle className="h-4 w-4" />}
          before={metrics24h?.errors.errorRate}
          during={metricsCanary?.errors.errorRate}
          unit="/h"
          target={5}
          inverse={true}
        />
      </div>

      {/* Health Score Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Health Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Antes (24h)</div>
              <div className="flex items-center gap-2">
                <Progress value={metrics24h?.healthScore || 0} className="flex-1" />
                <span className="text-sm font-medium">{metrics24h?.healthScore || 0}%</span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground mb-1">Canário</div>
              <div className="flex items-center gap-2">
                <Progress value={metricsCanary?.healthScore || 0} className="flex-1" />
                <span className="text-sm font-medium">{metricsCanary?.healthScore || 0}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo Estatístico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold">{metricsCanary?.hibp.totalCalls || 0}</div>
              <div className="text-xs text-muted-foreground">Chamadas HIBP</div>
            </div>
            <div>
              <div className="text-lg font-bold">{metricsCanary?.sse.connections || 0}</div>
              <div className="text-xs text-muted-foreground">Conexões SSE</div>
            </div>
            <div>
              <div className="text-lg font-bold">{metricsCanary?.errors.totalErrors || 0}</div>
              <div className="text-xs text-muted-foreground">Total Erros</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};