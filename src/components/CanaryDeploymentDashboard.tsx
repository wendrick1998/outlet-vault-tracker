import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Download
} from 'lucide-react';
import { canaryManager, type CanaryState, PRODUCTION_QUALITY_GATES } from '@/lib/canary-deployment';
import { useToast } from '@/hooks/use-toast';

export const CanaryDeploymentDashboard: React.FC = () => {
  const [canaryState, setCanaryState] = useState<CanaryState>(canaryManager.getState());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = canaryManager.subscribe((state) => {
      setCanaryState(state);
      
      // Show toast notifications for important events
      if (state.phase === 'rollback') {
        toast({
          title: "🚨 Rollback Automático Executado",
          description: "Sistema retornou para configuração segura",
          variant: "destructive"
        });
      } else if (state.phase === 'success') {
        toast({
          title: "🎉 Deploy Promovido com Sucesso!",
          description: "Todas as métricas atenderam os critérios de qualidade",
          variant: "default"
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const handleStartCanary = () => {
    const buildHash = `build-${Date.now()}`;
    canaryManager.startCanary(buildHash);
    
    toast({
      title: "🚀 Deploy Canário Iniciado",
      description: `Build: ${buildHash}`,
      variant: "default"
    });
  };

  const handleManualRollback = () => {
    canaryManager.manualRollback("Manual intervention by operator");
    
    toast({
      title: "🔄 Rollback Manual Executado",
      description: "Deploy canário cancelado manualmente",
      variant: "destructive"
    });
  };

  const handleForcePromotion = () => {
    canaryManager.forcePromotion("Manual promotion by operator");
    
    toast({
      title: "⚡ Promoção Forçada",
      description: "Deploy promovido manualmente para 100%",
      variant: "default"
    });
  };

  const downloadEvidence = () => {
    const evidence = localStorage.getItem('canary_evidence');
    const releaseNotes = localStorage.getItem('canary_release_notes');
    
    if (evidence || releaseNotes) {
      const data = {
        evidence: evidence ? JSON.parse(evidence) : null,
        releaseNotes: releaseNotes,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canary-evidence-${canaryState.buildHash || Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "📊 Evidências Exportadas",
        description: "Arquivo de evidências baixado com sucesso",
        variant: "default"
      });
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'canary': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rollback': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'canary': return 'secondary';
      case 'success': return 'default';
      case 'rollback': return 'destructive';
      default: return 'outline';
    }
  };

  const renderQualityGates = () => {
    return PRODUCTION_QUALITY_GATES.map((gate) => {
      const status = canaryState.qualityGatesStatus[gate.name];
      
      return (
        <div key={gate.name} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            {status === true ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : status === false ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">{gate.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {gate.operator} {gate.threshold}{gate.metric.includes('time') ? 'ms' : ''}
          </div>
        </div>
      );
    });
  };

  const elapsedMinutes = canaryState.startTime ? 
    Math.round((Date.now() - canaryState.startTime) / (1000 * 60)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Deploy Canário - Hardening Final
            </div>
            <Badge variant={getPhaseColor(canaryState.phase)} className="flex items-center gap-1">
              {getPhaseIcon(canaryState.phase)}
              {canaryState.phase.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {canaryState.isActive ? (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{canaryState.trafficPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Tráfego Canário</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{elapsedMinutes}min</div>
                  <div className="text-xs text-muted-foreground">Tempo Decorrido</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{canaryState.consecutiveFailures}</div>
                  <div className="text-xs text-muted-foreground">Falhas Consecutivas</div>
                </div>
              </div>

              <Separator />

              {canaryState.trafficPercentage < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso para Promoção (60min)</span>
                    <span>{Math.min(100, Math.round((elapsedMinutes / 60) * 100))}%</span>
                  </div>
                  <Progress value={Math.min(100, (elapsedMinutes / 60) * 100)} />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleManualRollback}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Rollback Manual
                </Button>
                
                {canaryState.phase === 'canary' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleForcePromotion}
                    className="flex items-center gap-1"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Forçar Promoção
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Nenhum deploy canário ativo</p>
              <Button onClick={handleStartCanary} className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Iniciar Deploy Canário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Gates */}
      {canaryState.isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Quality Gates
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {renderQualityGates()}
            </div>
            
            {canaryState.consecutiveFailures >= 1 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ {canaryState.consecutiveFailures} falha(s) consecutiva(s) detectada(s). 
                  Rollback automático será executado na próxima falha.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Build Information */}
      {canaryState.buildHash && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações do Build</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build Hash:</span>
              <code className="font-mono text-xs">{canaryState.buildHash}</code>
            </div>
            
            {canaryState.startTime > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Início:</span>
                <span>{new Date(canaryState.startTime).toLocaleString()}</span>
              </div>
            )}
            
            {canaryState.evidenceCollected && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Evidências:</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={downloadEvidence}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Flags Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuração de Feature Flags</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Password Protection:</span>
              <Badge variant="default">ATIVO</Badge>
            </div>
            <div className="flex justify-between">
              <span>Strict Mode:</span>
              <Badge variant="secondary">PERMISSIVO</Badge>
            </div>
            <div className="flex justify-between">
              <span>SSE Analytics:</span>
              <Badge variant={canaryState.isActive ? "default" : "outline"}>
                {canaryState.isActive ? "ATIVO" : "INATIVO"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Debug Metrics:</span>
              <Badge variant="outline">DESABILITADO</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};