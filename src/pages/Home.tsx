import { Search, List, Clock, BarChart3, Package, AlertTriangle, Bot, Brain } from "lucide-react";
import { ActionCard } from "@/components/ActionCard";
import { StatsCard } from "@/components/ui/stats-card";
import { useSystemStats } from "@/hooks/useStats";
import { useActiveLoans } from "@/hooks/useLoans";
import { AIAssistant } from "@/components/AIAssistant";
import { SmartAnalytics } from "@/components/SmartAnalytics";
import { PredictiveAlerts } from "@/components/PredictiveAlerts";
import { SmartNotifications } from "@/components/SmartNotifications";
import { VoiceCommands } from "@/components/VoiceCommands";
import { useState } from "react";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
  const { data: systemStats, isLoading: statsLoading } = useSystemStats();
  const { data: activeLoans, isLoading: loansLoading } = useActiveLoans();
  const [showAI, setShowAI] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);

  const handleVoiceCommand = (action: string, data?: any) => {
    switch (action) {
      case 'buscar_item':
        onNavigate('search');
        break;
      case 'ver_historico':
        onNavigate('history');
        break;
      case 'mostrar_estatisticas':
        setShowAnalytics(true);
        break;
      case 'listar_emprestimos':
        onNavigate('active-loans');
        break;
      case 'registrar_saida':
        onNavigate('search');
        break;
      default:
        console.log('Unknown voice command:', action, data);
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bem-vinda ao Cofre Tracker
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie os aparelhos da loja de forma simples e eficiente
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="🔍 Buscar & Registrar"
            description="Encontre um aparelho com IA e registre saída, devolução ou venda"
            icon={Search}
            onClick={() => onNavigate('search')}
            variant="primary"
          />

          <ActionCard
            title="📦 Saída em Lote"
            description="Registre a saída de múltiplos aparelhos de uma vez"
            icon={Package}
            onClick={() => onNavigate('batch-outflow')}
            variant="default"
          />

          <ActionCard
            title="⏰ Fora Agora"
            description="Veja todos os itens que estão fora do cofre no momento"
            icon={Clock}
            onClick={() => onNavigate('active-loans')}
            variant={(activeLoans?.length || 0) > 0 ? 'warning' : 'default'}
            badge={(activeLoans?.length || 0) > 0 ? (activeLoans?.length || 0).toString() : undefined}
          />

          <ActionCard
            title="📚 Histórico"
            description="Consulte o histórico de movimentações dos aparelhos"
            icon={List}
            onClick={() => onNavigate('history')}
            variant="default"
          />
        </div>

          {/* Smart Notifications */}
          <div className="mt-8">
            <SmartNotifications />
          </div>

          {/* AI Analytics Panel */}
          {showAnalytics && (
            <div className="mt-8">
              <SmartAnalytics />
            </div>
          )}

          {/* AI Predictions Panel */}
          {showPredictions && (
            <div className="mt-8">
              <PredictiveAlerts type="all" />
            </div>
          )}

        {/* Quick stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading || loansLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-20"></div>
              </div>
            ))
          ) : systemStats ? (
            <>
              <StatsCard
                title="Itens fora agora"
                value={systemStats.loans?.active || (systemStats as any).active_loans || 0}
                icon={Clock}
                variant={(systemStats.loans?.active || (systemStats as any).active_loans || 0) > 0 ? "warning" : "default"}
              />
              
              <StatsCard
                title="Total de itens"
                value={systemStats.inventory?.total || (systemStats as any).total_items || 0}
                icon={Package}
                variant="default"
              />

              <StatsCard
                title="Itens em atraso"
                value={systemStats.loans?.overdue || 0}
                icon={AlertTriangle}
                variant={(systemStats.loans?.overdue || 0) > 0 ? "destructive" : "success"}
              />

              <StatsCard
                title="Disponíveis"
                value={systemStats.inventory?.available || 0}
                icon={Package}
                variant="success"
              />
            </>
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              Erro ao carregar estatísticas
            </div>
          )}
        </div>

        {/* AI Assistant */}
        <AIAssistant 
          isMinimized={!showAI}
          onToggleMinimized={() => setShowAI(!showAI)}
        />

        {/* Voice Commands */}
        <VoiceCommands
          onCommand={handleVoiceCommand}
          isVisible={showVoiceCommands}
          onToggle={() => setShowVoiceCommands(!showVoiceCommands)}
        />
      </main>
  );
};