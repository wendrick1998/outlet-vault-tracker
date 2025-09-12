import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSystemStats } from '@/hooks/useStats';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock, 
  RefreshCw,
  Zap,
  BarChart3
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { SmartAnalytics } from '@/components/SmartAnalytics';
import { PredictiveAlerts } from '@/components/PredictiveAlerts';

interface SmartInsight {
  type: 'tip' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface SmartDashboardProps {
  className?: string;
}

export function SmartDashboard({ className }: SmartDashboardProps) {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const { user } = useAuth();
  const { data: stats } = useSystemStats();
  const { toast } = useToast();

  const generateSmartInsights = async () => {
    if (!user || !stats) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analytics', {
        body: {
          type: 'insights',
          period: '7d'
        }
      });

      if (error) throw error;

      // Transform AI analysis into smart insights
      const generatedInsights: SmartInsight[] = [];

      // Add utilization insights
      if (stats.inventory.utilizationRate > 80) {
        generatedInsights.push({
          type: 'warning',
          title: 'Alta utilização detectada',
          description: `${stats.inventory.utilizationRate}% dos itens estão em uso. Considere aumentar o estoque.`,
          action: 'Revisar inventário',
          priority: 'high'
        });
      } else if (stats.inventory.utilizationRate < 30) {
        generatedInsights.push({
          type: 'opportunity',
          title: 'Oportunidade de otimização',
          description: `Apenas ${stats.inventory.utilizationRate}% dos itens em uso. Avalie redução de estoque.`,
          action: 'Analisar demanda',
          priority: 'medium'
        });
      }

      // Add overdue insights
      if (stats.loans.overdue > 0) {
        generatedInsights.push({
          type: 'warning',
          title: 'Itens em atraso',
          description: `${stats.loans.overdue} empréstimos estão atrasados. Ação necessária.`,
          action: 'Contatar clientes',
          priority: 'high'
        });
      }

      // Add trend insights from AI
      if (data.analysis?.insights) {
        data.analysis.insights.forEach((insight: string, index: number) => {
          generatedInsights.push({
            type: 'trend',
            title: `Tendência identificada ${index + 1}`,
            description: insight,
            priority: 'medium'
          });
        });
      }

      setInsights(generatedInsights);

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar insights inteligentes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (stats) {
      generateSmartInsights();
    }
  }, [stats]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'opportunity': return <Target className="h-4 w-4 text-green-600" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <Zap className="h-4 w-4 text-purple-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'trend': return 'border-blue-200 bg-blue-50';
      default: return 'border-purple-200 bg-purple-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
              <CardTitle>Dashboard Inteligente</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={generateSmartInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">
                <Zap className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Análises
              </TabsTrigger>
              <TabsTrigger value="predictions">
                <TrendingUp className="h-4 w-4 mr-2" />
                Previsões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-6">
              {isLoading ? (
                <Loading text="Gerando insights inteligentes..." />
              ) : insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            {insight.action && (
                              <Button size="sm" variant="outline" className="text-xs">
                                {insight.action}
                              </Button>
                            )}
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                          {insight.priority === 'high' ? 'Alto' :
                           insight.priority === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Clique em atualizar para gerar insights inteligentes
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <SmartAnalytics />
            </TabsContent>

            <TabsContent value="predictions" className="mt-6">
              <PredictiveAlerts type="all" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}