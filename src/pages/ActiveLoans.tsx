import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, User, Tag, Search, Filter, ShoppingCart } from "lucide-react";
import { useActiveLoans, useLoans } from "@/hooks/useLoans";
import { useActiveReasons } from "@/hooks/useReasons";
import { useActiveSellers } from "@/hooks/useSellers";
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
  const { returnLoan, sellLoan } = useLoans();
  const { data: reasons = [] } = useActiveReasons();
  const { data: sellers = [] } = useActiveSellers();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterSeller, setFilterSeller] = useState<string>("all");
  const [filterOverdue, setFilterOverdue] = useState<string>("all");
  
  // Loading states for individual actions
  const [loadingStates, setLoadingStates] = useState<{[key: string]: { returning: boolean; selling: boolean }}>({});

  // Filtered loans
  const filteredLoans = useMemo(() => {
    let filtered = [...loans];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.inventory?.imei.includes(searchTerm) ||
        loan.inventory?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Reason filter
    if (filterReason !== "all") {
      filtered = filtered.filter(loan => loan.reason?.id === filterReason);
    }

    // Seller filter
    if (filterSeller !== "all") {
      filtered = filtered.filter(loan => loan.seller?.id === filterSeller);
    }

    // Overdue filter
    if (filterOverdue !== "all") {
      const now = new Date();
      filtered = filtered.filter(loan => {
        const dueAt = loan.due_at ? new Date(loan.due_at) : null;
        const isOverdue = dueAt ? now > dueAt : false;
        return filterOverdue === "overdue" ? isOverdue : !isOverdue;
      });
    }

    return filtered.sort((a, b) => {
      // Sort overdue items first
      const aOverdue = a.due_at ? new Date() > new Date(a.due_at) : false;
      const bOverdue = b.due_at ? new Date() > new Date(b.due_at) : false;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
    });
  }, [loans, searchTerm, filterReason, filterSeller, filterOverdue]);

  const handleReturn = async (loanId: string) => {
    setLoadingStates(prev => ({ ...prev, [loanId]: { ...prev[loanId], returning: true } }));
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
    } finally {
      setLoadingStates(prev => ({ ...prev, [loanId]: { ...prev[loanId], returning: false } }));
    }
  };

  const handleSale = async (loanId: string) => {
    const saleNumber = prompt("Número da venda (opcional):");
    
    setLoadingStates(prev => ({ ...prev, [loanId]: { ...prev[loanId], selling: true } }));
    try {
      await sellLoan({ 
        id: loanId, 
        saleNumber: saleNumber || undefined,
        notes: saleNumber ? `Venda registrada com número: ${saleNumber}` : "Venda registrada sem número"
      });
      
      toast({
        title: "Venda registrada",
        description: "O item foi marcado como vendido e removido do estoque.",
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar venda",
        description: "Não foi possível registrar a venda",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loanId]: { ...prev[loanId], selling: false } }));
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
              disabled={loadingStates[loan.id]?.returning || loadingStates[loan.id]?.selling}
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              {loadingStates[loan.id]?.returning ? "Devolvendo..." : "Devolver"}
            </Button>
            <Button
              onClick={() => handleSale(loan.id)}
              disabled={loadingStates[loan.id]?.returning || loadingStates[loan.id]?.selling}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {loadingStates[loan.id]?.selling ? "Vendendo..." : "Vendido"}
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
            Fora Agora ({filteredLoans.length} de {loans.length})
          </h1>
          <p className="text-muted-foreground">
            Itens que estão atualmente fora do cofre
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar IMEI, modelo ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger>
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os motivos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motivos</SelectItem>
                {reasons.map(reason => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeller} onValueChange={setFilterSeller}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {sellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOverdue} onValueChange={setFilterOverdue}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="overdue">Apenas em atraso</SelectItem>
                <SelectItem value="normal">Apenas no prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-warning">
              {filteredLoans.length}
            </div>
            <div className="text-muted-foreground text-sm">Filtrados</div>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-destructive">
              {filteredLoans.filter(loan => {
                const dueAt = loan.due_at ? new Date(loan.due_at) : null;
                return dueAt ? new Date() > dueAt : false;
              }).length}
            </div>
            <div className="text-muted-foreground text-sm">Em atraso</div>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-soft">
            <div className="text-2xl font-bold text-primary">
              {loans.length}
            </div>
            <div className="text-muted-foreground text-sm">Total fora</div>
          </div>
        </div>

        {/* Loans list */}
        {isLoading ? (
          <Loading />
        ) : filteredLoans.length === 0 && loans.length > 0 ? (
          <Card className="p-8 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Ajuste os filtros para ver mais resultados
            </p>
          </Card>
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
            {filteredLoans.map(renderLoanCard)}
          </div>
        )}
      </main>
    </div>
  );
};