import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, AlertTriangle, BarChart3, Bot } from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";
import { SmartAnalytics } from "@/components/SmartAnalytics";
import { PredictiveAlerts } from "@/components/PredictiveAlerts";
import { StockIntelligence } from "@/components/StockIntelligence";

interface AIInsightsProps {
  onBack: () => void;
}

export const AIInsights = ({ onBack }: AIInsightsProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Insights de IA
          </h1>
          <p className="text-muted-foreground">
            Análises inteligentes e predições para otimizar sua operação
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Voltar
        </Button>
      </div>

      {/* Status Alert */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Status:</strong> As funcionalidades de IA estão temporariamente indisponíveis devido a limitações da quota da OpenAI. 
          Esta página ficará disponível para quando o serviço for reativado.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-medium mb-2">Analytics Inteligente</h3>
                <p className="text-sm text-muted-foreground">
                  Análise de padrões e tendências usando IA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Alertas Preditivos</h3>
                <p className="text-sm text-muted-foreground">
                  Previsões e alertas baseados em dados históricos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Inteligência de Estoque</h3>
                <p className="text-sm text-muted-foreground">
                  Recomendações inteligentes para gestão de inventário
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistente de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Converse com o assistente inteligente para obter insights personalizados sobre sua operação.
              </p>
              <Button 
                onClick={() => setShowAI(!showAI)}
                variant={showAI ? "secondary" : "default"}
              >
                {showAI ? "Minimizar Assistente" : "Ativar Assistente"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SmartAnalytics />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAlerts type="all" />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <StockIntelligence />
        </TabsContent>
      </Tabs>

      {/* AI Assistant */}
      <AIAssistant 
        isMinimized={!showAI}
        onToggleMinimized={() => setShowAI(!showAI)}
      />
    </div>
  );
};