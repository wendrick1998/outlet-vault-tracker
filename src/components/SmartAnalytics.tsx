import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface AIAnalysis {
  insights: {
    patterns: string[];
    predictions: string[];
    recommendations: string[];
    alerts: string[];
  };
  metrics: {
    utilizationTrend: 'up' | 'down' | 'stable';
    demandForecast: 'high' | 'medium' | 'low';
    riskLevel: 'low' | 'medium' | 'high';
  };
  summary: string;
}

interface SmartAnalyticsProps {
  className?: string;
}

export function SmartAnalytics({ className }: SmartAnalyticsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('7d');
  const { toast } = useToast();

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analytics', {
        body: {
          type: 'general',
          period
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      toast({
        title: "✅ Análise atualizada",
        description: "Insights de IA carregados com sucesso",
      });
    } catch (error) {
      console.error('Error loading AI analysis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a análise de IA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [period]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Análise Inteligente</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="1d">24h</option>
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={loadAnalysis}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading text="Analisando dados com IA..." />
          ) : analysis ? (
            <div className="space-y-6">
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-2xl">{getTrendIcon(analysis.metrics.utilizationTrend)}</span>
                  <div>
                    <p className="text-sm font-medium">Tendência de Uso</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {analysis.metrics.utilizationTrend === 'up' ? 'Crescente' :
                       analysis.metrics.utilizationTrend === 'down' ? 'Decrescente' : 'Estável'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Previsão Demanda</p>
                    <Badge variant={getDemandColor(analysis.metrics.demandForecast)}>
                      {analysis.metrics.demandForecast === 'high' ? 'Alta' :
                       analysis.metrics.demandForecast === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="text-sm font-medium">Nível de Risco</p>
                    <Badge variant={getRiskColor(analysis.metrics.riskLevel)}>
                      {analysis.metrics.riskLevel === 'high' ? 'Alto' :
                       analysis.metrics.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Resumo Executivo
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>

              {/* Insights Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patterns */}
                {analysis.insights.patterns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Padrões Identificados
                    </h4>
                    <ul className="space-y-2">
                      {analysis.insights.patterns.map((pattern, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Predictions */}
                {analysis.insights.predictions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <span className="text-purple-600">🔮</span>
                      Previsões
                    </h4>
                    <ul className="space-y-2">
                      {analysis.insights.predictions.map((prediction, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{prediction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-green-600" />
                      Recomendações
                    </h4>
                    <ul className="space-y-2">
                      {analysis.insights.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alerts */}
                {analysis.insights.alerts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Alertas
                    </h4>
                    <ul className="space-y-2">
                      {analysis.insights.alerts.map((alert, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Clique em atualizar para gerar análise de IA</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}