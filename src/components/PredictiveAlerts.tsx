import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, TrendingUp, Clock, Target, Brain, RefreshCw } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Prediction {
  type: 'demand' | 'risk' | 'performance' | 'alert';
  item: string | null;
  prediction: string;
  probability: number;
  timeline: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface PredictiveAnalysis {
  predictions: Prediction[];
  insights: string[];
  nextActions: string[];
  confidence: number;
}

interface PredictiveAlertsProps {
  className?: string;
  type?: 'demand' | 'risk' | 'performance' | 'all';
  itemId?: string;
}

export function PredictiveAlerts({ className, type = 'all', itemId }: PredictiveAlertsProps) {
  const [analysis, setAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>(type);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadPredictions = async (analysisType = activeFilter) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictions', {
        body: {
          type: analysisType,
          itemId,
          userId: user.id,
          period: '30d'
        }
      });

      if (error) throw error;

      setAnalysis(data.predictions);
      
      // Show important alerts as toast
      if (data.predictions?.predictions) {
        const highImpactAlerts = data.predictions.predictions.filter(
          (p: Prediction) => p.impact === 'high' && p.probability > 0.7
        );
        
        if (highImpactAlerts.length > 0) {
          toast({
            title: "🚨 Alertas importantes detectados",
            description: `${highImpactAlerts.length} previsões de alto impacto`,
          });
        }
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar previsões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [user?.id, itemId, activeFilter]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'demand': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'performance': return <Target className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.6) return 'text-orange-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filters = [
    { key: 'all', label: 'Todas', icon: Brain },
    { key: 'demand', label: 'Demanda', icon: TrendingUp },
    { key: 'risk', label: 'Riscos', icon: AlertTriangle },
    { key: 'performance', label: 'Performance', icon: Target }
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Previsões Inteligentes</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {filters.map((filter) => (
                  <Button
                    key={filter.key}
                    size="sm"
                    variant={activeFilter === filter.key ? "default" : "ghost"}
                    onClick={() => {
                      setActiveFilter(filter.key);
                      loadPredictions(filter.key);
                    }}
                    className="text-xs"
                  >
                    <filter.icon className="h-3 w-3 mr-1" />
                    {filter.label}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPredictions()}
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
              {/* Confidence Score */}
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm font-medium">Confiança das previsões:</span>
                <Badge variant="outline" className="text-sm">
                  {Math.round(analysis.confidence * 100)}%
                </Badge>
              </div>

              {/* Predictions */}
              {analysis.predictions && analysis.predictions.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Previsões ({analysis.predictions.length})
                  </h4>
                  <div className="space-y-3">
                    {analysis.predictions.map((prediction, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:bg-secondary/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2">
                            {getPredictionIcon(prediction.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {prediction.item && (
                                  <span className="text-primary mr-2">[{prediction.item}]</span>
                                )}
                                {prediction.prediction}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {prediction.timeline}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${getProbabilityColor(prediction.probability)}`}>
                              {Math.round(prediction.probability * 100)}%
                            </span>
                            <Badge variant={getImpactColor(prediction.impact)} className="text-xs">
                              {prediction.impact === 'high' ? 'Alto' :
                               prediction.impact === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <span className="font-medium text-blue-800">💡 Recomendação:</span>
                          <span className="text-blue-700 ml-1">{prediction.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma previsão disponível para este período</p>
                </div>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Insights Identificados
                  </h4>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Actions */}
              {analysis.nextActions && analysis.nextActions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Próximas Ações Recomendadas
                  </h4>
                  <div className="space-y-2">
                    {analysis.nextActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-orange-50 rounded">
                        <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                        <span className="text-sm flex-1">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Clique em atualizar para gerar previsões</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}