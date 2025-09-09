import { useState } from "react";
import { Search, List, Clock, BarChart3 } from "lucide-react";
import { Header } from "@/components/Header";
import { ActionCard } from "@/components/ActionCard";
import { MockDataService } from "@/lib/mock-data";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
  const [activeLoansCount] = useState(() => MockDataService.getActiveLoans().length);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
            title="Fora Agora"
            description="Veja todos os itens que estão fora do cofre no momento"
            icon={Clock}
            onClick={() => onNavigate('active-loans')}
            variant={activeLoansCount > 0 ? 'warning' : 'default'}
            badge={activeLoansCount > 0 ? activeLoansCount.toString() : undefined}
          />

          <ActionCard
            title="Histórico"
            description="Consulte o histórico de movimentações dos aparelhos"
            icon={List}
            onClick={() => onNavigate('history')}
          />

          {/* Future: Admin only */}
          <ActionCard
            title="Relatórios"
            description="Visualize estatísticas e relatórios detalhados"
            icon={BarChart3}
            onClick={() => onNavigate('admin')}
          />
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-success">
              {MockDataService.getActiveLoans().length}
            </div>
            <div className="text-muted-foreground">Itens fora agora</div>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-primary">8</div>
            <div className="text-muted-foreground">Total de itens</div>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-warning">
              {MockDataService.getActiveLoans().filter(loan => MockDataService.isOverdue(loan)).length}
            </div>
            <div className="text-muted-foreground">Itens em atraso</div>
          </div>
        </div>
      </main>
    </div>
  );
};