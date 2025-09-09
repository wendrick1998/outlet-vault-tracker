import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, User, Tag } from "lucide-react";
import { 
  MockDataService, 
  MockLoan, 
  mockInventory, 
  mockReasons, 
  mockSellers, 
  mockCustomers 
} from "@/lib/mock-data";

interface ActiveLoansProps {
  onBack: () => void;
}

export const ActiveLoans = ({ onBack }: ActiveLoansProps) => {
  const [activeLoans, setActiveLoans] = useState<MockLoan[]>([]);

  useEffect(() => {
    setActiveLoans(MockDataService.getActiveLoans());
  }, []);

  const getItemById = (id: string) => 
    mockInventory.find(item => item.id === id);

  const getReasonById = (id: string) => 
    mockReasons.find(reason => reason.id === id);

  const getSellerById = (id: string) => 
    mockSellers.find(seller => seller.id === id);

  const getCustomerById = (id: string) => 
    mockCustomers.find(customer => customer.id === id);

  const handleReturn = (loanId: string) => {
    // Mock return action
    const loanIndex = activeLoans.findIndex(loan => loan.id === loanId);
    if (loanIndex !== -1) {
      const updatedLoans = [...activeLoans];
      updatedLoans.splice(loanIndex, 1);
      setActiveLoans(updatedLoans);

      // Update item status
      const loan = activeLoans[loanIndex];
      const item = getItemById(loan.inventoryId);
      if (item) item.status = 'cofre';
    }
  };

  const handleMarkSold = (loanId: string) => {
    // Mock sold action
    const loanIndex = activeLoans.findIndex(loan => loan.id === loanId);
    if (loanIndex !== -1) {
      const updatedLoans = [...activeLoans];
      updatedLoans.splice(loanIndex, 1);
      setActiveLoans(updatedLoans);

      // Update item status
      const loan = activeLoans[loanIndex];
      const item = getItemById(loan.inventoryId);
      if (item) item.status = 'vendido';
    }
  };

  const renderLoanCard = (loan: MockLoan) => {
    const item = getItemById(loan.inventoryId);
    const reason = getReasonById(loan.reasonId);
    const seller = getSellerById(loan.sellerId);
    const customer = loan.customerId ? getCustomerById(loan.customerId) : null;
    const isOverdue = MockDataService.isOverdue(loan);
    const timeElapsed = MockDataService.getTimeElapsed(loan);
    const timeUntilDue = MockDataService.getTimeUntilDue(loan);

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
              <p className="text-muted-foreground">{item.color} • ...{item.imeiSuffix5}</p>
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
                  Fora há {timeElapsed}
                </Badge>
              )}
            </div>
          </div>

          {/* Loan details */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reason.name}</span>
              {loan.dueAt && (
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

            {loan.customerName && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{loan.customerName} (avulso)</span>
              </div>
            )}

            {loan.quickNote && (
              <div className="p-3 bg-muted/30 rounded text-sm">
                <span className="text-muted-foreground">Obs:</span> {loan.quickNote}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleReturn(loan.id)}
              className="flex-1"
            >
              Devolver
            </Button>
            <Button
              onClick={() => handleMarkSold(loan.id)}
              className="flex-1 bg-success hover:bg-success/90"
            >
              Vendido
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
            Fora Agora ({activeLoans.length})
          </h1>
          <p className="text-muted-foreground">
            Itens que estão atualmente fora do cofre
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-warning">
              {activeLoans.length}
            </div>
            <div className="text-muted-foreground text-sm">Itens fora</div>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-destructive">
              {activeLoans.filter(loan => MockDataService.isOverdue(loan)).length}
            </div>
            <div className="text-muted-foreground text-sm">Em atraso</div>
          </div>
        </div>

        {/* Loans list */}
        {activeLoans.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item fora do cofre</h3>
            <p className="text-muted-foreground">
              Todos os itens estão no cofre no momento
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeLoans.map(renderLoanCard)}
          </div>
        )}
      </main>
    </div>
  );
};