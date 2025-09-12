import { Search, List, Clock, BarChart3, Package, AlertTriangle } from "lucide-react";
import { ActionCard } from "@/components/ActionCard";
import { StatsCard } from "@/components/ui/stats-card";
import { useSystemStats } from "@/hooks/useStats";
import { useActiveLoans } from "@/hooks/useLoans";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
  const { data: systemStats, isLoading: statsLoading } = useSystemStats();
  const { data: activeLoans, isLoading: loansLoading } = useActiveLoans();

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
            title="Buscar & Registrar"
            description="Encontre um aparelho e registre saída, devolução ou venda"
            icon={Search}
            onClick={() => onNavigate('search')}
            variant="primary"
          />

          <ActionCard
            title="Saída em Lote"
            description="Registre a saída de múltiplos aparelhos de uma vez"
            icon={Package}
            onClick={() => onNavigate('batch-outflow')}
            variant="default"
          />

          <ActionCard
            title="Fora Agora"
            description="Veja todos os itens que estão fora do cofre no momento"
            icon={Clock}
            onClick={() => onNavigate('active-loans')}
            variant={(activeLoans?.length || 0) > 0 ? 'warning' : 'default'}
            badge={(activeLoans?.length || 0) > 0 ? (activeLoans?.length || 0).toString() : undefined}
          />

          <ActionCard
            title="Histórico"
            description="Consulte o histórico de movimentações dos aparelhos"
            icon={List}
            onClick={() => onNavigate('history')}
            variant="default"
          />

          <ActionCard
            title="Relatórios & Admin"
            description="Painel administrativo e relatórios detalhados do sistema"
            icon={BarChart3}
            onClick={() => onNavigate('admin')}
            variant="primary"
          />
        </div>

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
                value={systemStats.loans.active}
                icon={Clock}
                variant={systemStats.loans.active > 0 ? "warning" : "default"}
              />
              
              <StatsCard
                title="Total de itens"
                value={systemStats.inventory.total}
                icon={Package}
                variant="default"
              />

              <StatsCard
                title="Itens em atraso"
                value={systemStats.loans.overdue}
                icon={AlertTriangle}
                variant={systemStats.loans.overdue > 0 ? "destructive" : "success"}
              />

              <StatsCard
                title="Disponíveis"
                value={systemStats.inventory.available}
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