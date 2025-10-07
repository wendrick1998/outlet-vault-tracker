import { Search, List, Clock, BarChart3, Package, AlertTriangle, Plus } from "lucide-react";
import { ActionCard } from "@/components/ActionCard";
import { StatsCard } from "@/components/ui/stats-card";
import { PendingSalesManager } from "@/components/PendingSalesManager";
import { AddDeviceFlow } from "@/components/AddDeviceFlow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSystemStats } from "@/hooks/useStats";
import { useActiveLoans } from "@/hooks/useLoans";
import { usePendingSalesStats } from "@/hooks/usePendingSales";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
  const { data: systemStats, isLoading: statsLoading } = useSystemStats();
  const { data: activeLoans, isLoading: loansLoading } = useActiveLoans();
  const { data: pendingStats, isLoading: pendingStatsLoading } = usePendingSalesStats();
  const queryClient = useQueryClient();
  
  const [showPendingSales, setShowPendingSales] = useState(false);
  const [showAddDeviceFlow, setShowAddDeviceFlow] = useState(false);


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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title="🔍 Buscar & Operar"
            description="Busque aparelhos e realize operações individuais ou em lote"
            icon={Search}
            onClick={() => onNavigate('search-and-operate')}
            variant="primary"
          />

          <ActionCard
            title="➕ Adicionar Aparelho"
            description="Cadastre novos aparelhos no sistema"
            icon={Plus}
            onClick={() => setShowAddDeviceFlow(true)}
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

        {/* Add Device Modal */}
        <Dialog open={showAddDeviceFlow} onOpenChange={setShowAddDeviceFlow}>
          <DialogContent className="max-w-3xl">
            <AddDeviceFlow
              onDeviceAdded={() => {
                setShowAddDeviceFlow(false);
                queryClient.invalidateQueries({ queryKey: ['stats'] });
                queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['stock'], exact: false });
              }}
            />
          </DialogContent>
        </Dialog>

          {/* Vendas Pendentes */}
      {showPendingSales && (
        <div className="mt-6">
          <PendingSalesManager />
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
              
              <div 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowPendingSales(!showPendingSales)}
              >
                <StatsCard
                  title="Pendências"
                  value={pendingStats?.total_pending || 0}
                  icon={AlertTriangle}
                  variant={pendingStats?.total_pending ? "destructive" : "default"}
                />
              </div>

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

      </main>
  );
};