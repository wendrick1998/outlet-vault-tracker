import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Clock, AlertTriangle, User, Tag } from "lucide-react";
import { useActiveLoans, useLoans } from "@/hooks/useLoans";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

interface ActiveLoansProps {
  onBack: () => void;
}

type LoanWithDetails = Database['public']['Tables']['loans']['Row'] & {
  inventory?: Database['public']['Tables']['inventory']['Row'];
  reason?: Database['public']['Tables']['reasons']['Row'];
  seller?: Database['public']['Tables']['sellers']['Row'];
  customer?: Database['public']['Tables']['customers']['Row'];
};

export const ActiveLoans = ({ onBack }: ActiveLoansProps) => {
  const { toast } = useToast();
  const { data: loans = [], isLoading } = useActiveLoans();
  const { returnLoan } = useLoans();

  const handleReturn = async (loanId: string) => {
    try {
      await returnLoan({ id: loanId });
      toast({
        title: "Item devolvido",
        description: "O item foi devolvido com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao devolver",
        description: "Não foi possível devolver o item",
        variant: "destructive"
      });
    }
  };

  const renderLoanCard = (loan: LoanWithDetails) => {
    const item = loan.inventory;
    const reason = loan.reason;
    const seller = loan.seller;
    const customer = loan.customer;
    
    // Calculate time-related info
    const issuedAt = new Date(loan.issued_at);
    const dueAt = loan.due_at ? new Date(loan.due_at) : null;
    const now = new Date();
    
    const isOverdue = dueAt ? now > dueAt : false;
    const timeElapsed = Math.floor((now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));
    const timeUntilDue = dueAt 
      ? isOverdue 
        ? `${Math.floor((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60 * 24))} dias de atraso`
        : `${Math.floor((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias restantes`
      : "";

    if (!item || !reason || !seller) return null;

    return (
      <Card 
        key={loan.id} 
        className={`p-6 ${
          isOverdue 
            ? 'border-destructive bg-destructive/5' 
            : 'bg-gradient-card'
        }`}
      >
        <div className="space-y-4">
          {/* Header with status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">{item.model}</h3>
              <p className="text-muted-foreground">{item.color} • ...{item.imei.slice(-5)}</p>
            </div>
            
            <div className="text-right space-y-1">
              {isOverdue ? (
                <Badge className="bg-destructive text-destructive-foreground">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  ATRASADO
                </Badge>
              ) : (
                <Badge className="bg-warning text-warning-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Fora há {timeElapsed} {timeElapsed === 1 ? 'dia' : 'dias'}
                </Badge>
              )}
            </div>
          </div>

          {/* Loan details */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reason.name}</span>
              {loan.due_at && (
                <span className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  • {timeUntilDue}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{seller.name}</span>
            </div>

            {customer && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{customer.name}</span>
              </div>
            )}

            {loan.notes && (
              <div className="p-3 bg-muted/30 rounded text-sm">
                <span className="text-muted-foreground">Obs:</span> {loan.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleReturn(loan.id)}
              className="flex-1 bg-success hover:bg-success/90"
            >
              Devolver
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Itens Fora do Cofre"
        showBack={true}
        onBack={onBack}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Fora Agora ({loans.length})
            </h1>
          <p className="text-muted-foreground">
            Itens que estão atualmente fora do cofre
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-warning">
              {loans.length}
            </div>
            <div className="text-muted-foreground text-sm">Itens fora</div>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-destructive">
              {loans.filter(loan => {
                const dueAt = loan.due_at ? new Date(loan.due_at) : null;
                return dueAt ? new Date() > dueAt : false;
              }).length}
            </div>
            <div className="text-muted-foreground text-sm">Em atraso</div>
          </div>
        </div>

        {/* Loans list */}
        {isLoading ? (
          <Loading />
        ) : loans.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item fora do cofre</h3>
            <p className="text-muted-foreground">
              Todos os itens estão no cofre no momento
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map(renderLoanCard)}
          </div>
        )}
      </main>
    </div>
  );
};