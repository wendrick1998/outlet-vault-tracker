import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/hooks/useAI';
import { isPreview } from '@/lib/environment';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShoppingCart, 
  BarChart3, 
  Brain,
  RefreshCw,
  Package,
  Target
} from 'lucide-react';

interface StockIntelligenceProps {
  className?: string;
}

interface StockPrediction {
  type: 'low_stock_alert' | 'purchase_recommendation' | 'rotation_insight' | 'business_opportunity';
  item: string | null;
  prediction: string;
  probability: number;
  timeline: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  quantity?: string | null;
}

interface StockAnalysis {
  predictions: StockPrediction[];
  insights: string[];
  nextActions: string[];
  confidence: number;
  summary: string;
}

export function StockIntelligence({ className }: StockIntelligenceProps) {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { executeAIAction, isLoading } = useAI();
  const { toast } = useToast();

  const loadStockAnalysis = async (analysisType = 'stock_analysis') => {
    if (isRateLimited) return;
    
    try {
      const result = await executeAIAction({
        type: 'predict',
        data: { 
          type: analysisType,
          period: '30d'
        }
      });

      if (result.success && result.data?.predictions) {
        setAnalysis(result.data.predictions);
        setIsRateLimited(false);
        setRetryAfter(0);
        
        // Show high-impact alerts
        const highImpactAlerts = result.data.predictions.predictions?.filter(
          (p: StockPrediction) => p.impact === 'high' && p.type === 'low_stock_alert'
        );
        
        if (highImpactAlerts?.length > 0) {
          toast({
            title: "🚨 Alertas de Estoque Crítico",
            description: `${highImpactAlerts.length} item(s) precisam de atenção urgente`,
            variant: "destructive",
          });
        }
      } else if (result.error?.includes('Muitas solicitações')) {
        const retrySeconds = parseInt(result.error.match(/\d+/)?.[0] || '30');
        setIsRateLimited(true);
        setRetryAfter(retrySeconds);
        
        // Auto-retry after the specified time
        setTimeout(() => {
          setIsRateLimited(false);
          setRetryAfter(0);
        }, retrySeconds * 1000);
      }
    } catch (error) {
      console.error('Error loading stock analysis:', error);
      if (error instanceof Error && error.message.includes('Muitas solicitações')) {
        setIsRateLimited(true);
        const retrySeconds = parseInt(error.message.match(/\d+/)?.[0] || '30');
        setRetryAfter(retrySeconds);
        setTimeout(() => {
          setIsRateLimited(false);
          setRetryAfter(0);
        }, retrySeconds * 1000);
      } else {
        toast({
          title: "Erro na análise",
          description: "Não foi possível carregar a análise de estoque",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    // Don't auto-load in preview to avoid rate limiting
    if (!isPreview) {
      loadStockAnalysis();
    }
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'purchase_recommendation': return <ShoppingCart className="h-4 w-4" />;
      case 'rotation_insight': return <BarChart3 className="h-4 w-4" />;
      case 'business_opportunity': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const filterPredictionsByType = (type: string) => {
    return analysis?.predictions?.filter(p => p.type === type) || [];
  };

  if (!analysis && !isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          {isPreview ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Análise de IA indisponível no preview
              </p>
              <p className="text-sm text-muted-foreground">
                Funcionalidade disponível apenas em produção
              </p>
            </div>
          ) : isRateLimited ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Muitas solicitações. Tente novamente em {retryAfter}s
              </p>
              <Button 
                onClick={() => loadStockAnalysis()} 
                disabled={retryAfter > 0}
                className="mt-4"
              >
                {retryAfter > 0 ? `Aguarde ${retryAfter}s` : 'Tentar Novamente'}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground text-center mb-4">
                Nenhuma análise disponível no momento
              </p>
              <Button onClick={() => loadStockAnalysis()} className="mt-4">
                Carregar Análise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Inteligência de Estoque</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <Badge variant="outline">
                Confiança: {Math.round((analysis.confidence || 0) * 100)}%
              </Badge>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => loadStockAnalysis()}
              disabled={isLoading || isRateLimited}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {isRateLimited && (
              <Badge variant="destructive">
                Aguarde {retryAfter}s
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Analisando estoque...</span>
            </div>
          </div>
        ) : analysis ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumo</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              <TabsTrigger value="recommendations">Compras</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {analysis.summary && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>{analysis.summary}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {filterPredictionsByType('low_stock_alert').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {filterPredictionsByType('purchase_recommendation').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Recomendações</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {filterPredictionsByType('business_opportunity').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Oportunidades</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {filterPredictionsByType('low_stock_alert').map((prediction, index) => (
                <Alert key={index} className={getImpactColor(prediction.impact)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{prediction.item || 'Alerta Geral'}</span>
                        <Badge variant="outline">{prediction.timeline}</Badge>
                      </div>
                      <p>{prediction.prediction}</p>
                      <p className="text-sm font-medium">💡 {prediction.recommendation}</p>
                      {prediction.quantity && (
                        <p className="text-sm">📦 Quantidade sugerida: {prediction.quantity}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              
              {filterPredictionsByType('low_stock_alert').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta crítico de estoque no momento</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {filterPredictionsByType('purchase_recommendation').map((prediction, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="font-medium">{prediction.item || 'Recomendação Geral'}</span>
                          <Badge variant={prediction.impact === 'high' ? 'destructive' : 'secondary'}>
                            {prediction.impact}
                          </Badge>
                        </div>
                        <p className="text-sm">{prediction.prediction}</p>
                        <p className="text-sm font-medium text-primary">
                          💡 {prediction.recommendation}
                        </p>
                        {prediction.quantity && (
                          <p className="text-sm">
                            📦 Quantidade: {prediction.quantity}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{prediction.timeline}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filterPredictionsByType('purchase_recommendation').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma recomendação de compra disponível</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Insights de Negócio
                  </h4>
                  {analysis.insights.map((insight, index) => (
                    <Alert key={index}>
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {analysis.nextActions && analysis.nextActions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Próximas Ações
                  </h4>
                  {analysis.nextActions.map((action, index) => (
                    <Alert key={index}>
                      <AlertDescription>📋 {action}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Additional Analysis Options */}
              <div className="space-y-2">
                <h4 className="font-medium">Análises Específicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => loadStockAnalysis('purchase_recommendations')}
                    disabled={isLoading}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Recomendações de Compra
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => loadStockAnalysis('rotation_analysis')}
                    disabled={isLoading}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Análise de Rotatividade
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar análise de estoque</p>
            <Button onClick={() => loadStockAnalysis()} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}