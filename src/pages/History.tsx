import { useState, useMemo } from "react";
import { Calendar, Search, Filter, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoans } from "@/hooks/useLoans";
import { useActiveReasons } from "@/hooks/useReasons";
import { useActiveSellers } from "@/hooks/useSellers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

interface HistoryProps {
  onBack: () => void;
}

type FilterPeriod = "all" | "today" | "7d" | "30d";
type FilterStatus = "all" | "active" | "returned" | "sold";

type LoanWithDetails = Database['public']['Tables']['loans']['Row'] & {
  inventory?: Database['public']['Tables']['inventory']['Row'];
  reason?: Database['public']['Tables']['reasons']['Row'];
  seller?: Database['public']['Tables']['sellers']['Row'];
  customer?: Database['public']['Tables']['customers']['Row'];
};

export const History = ({ onBack }: HistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterSeller, setFilterSeller] = useState<string>("all");

  const { loans, isLoading } = useLoans();
  const { data: reasons = [] } = useActiveReasons();
  const { data: sellers = [] } = useActiveSellers();

  const filteredLoans = useMemo(() => {
    let filtered = [...loans];

    // Filter by search term (IMEI or model)
    if (searchTerm) {
      filtered = filtered.filter(loan => 
        loan.inventory?.imei.includes(searchTerm) ||
        loan.inventory?.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by period
    if (filterPeriod !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterPeriod) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "7d":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(loan => new Date(loan.issued_at) >= cutoffDate);
    }

    // Filter by status
    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "active":
          filtered = filtered.filter(loan => loan.status === 'active');
          break;
        case "returned":
          filtered = filtered.filter(loan => loan.status === 'returned');
          break;
        case "sold":
          filtered = filtered.filter(loan => (loan.status as any) === 'sold');
          break;
      }
    }

    // Filter by reason
    if (filterReason !== "all") {
      filtered = filtered.filter(loan => loan.reason?.id === filterReason);
    }

    // Filter by seller
    if (filterSeller !== "all") {
      filtered = filtered.filter(loan => loan.seller?.id === filterSeller);
    }

    return filtered.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }, [loans, searchTerm, filterPeriod, filterStatus, filterReason, filterSeller]);

  const getStatusBadge = (loan: LoanWithDetails) => {
    const status = loan.status as any;
    switch (status) {
      case 'returned':
        return <Badge variant="secondary">Devolvido</Badge>;
      case 'sold':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Vendido</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em Atraso</Badge>;
      case 'active':
      default:
        return <Badge variant="secondary">Em aberto</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const exportToCSV = () => {
    const headers = ["Data Saída", "IMEI", "Modelo", "Motivo", "Vendedor", "Cliente", "Status", "Data Retorno"];
    const rows = filteredLoans.map(loan => [
      formatDate(loan.issued_at),
      loan.inventory?.imei || "N/A",
      loan.inventory?.model || "N/A",
      loan.reason?.name || "N/A",
      loan.seller?.name || "N/A",
      loan.customer?.name || "N/A",
      (loan.status as any) === 'returned' ? "Devolvido" : 
      (loan.status as any) === 'sold' ? "Vendido" :
      loan.status === 'overdue' ? "Em Atraso" : "Em aberto",
      loan.returned_at ? formatDate(loan.returned_at) : "N/A"
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico-cofre-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Histórico de Movimentações" 
        showBack={true} 
        onBack={onBack} 
      />
      
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <Loading />
        ) : (
        <>
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IMEI ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Em aberto</SelectItem>
                <SelectItem value="returned">Devolvidos</SelectItem>
                <SelectItem value="sold">Vendidos</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por motivo" />
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
                <SelectValue placeholder="Filtrar por vendedor" />
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
          </div>
        </Card>

        {/* Results */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Registros encontrados: {filteredLoans.length}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora Saída</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Finalização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(loan.issued_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{loan.inventory?.model || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">
                            ...{loan.inventory?.imei.slice(-5) || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{loan.reason?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{loan.seller?.name || "N/A"}</TableCell>
                      <TableCell>{loan.customer?.name || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(loan)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {loan.returned_at ? formatDate(loan.returned_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredLoans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado com os filtros aplicados
                </div>
              )}
            </div>
          </div>
        </Card>
        </>
        )}
      </main>
    </div>
  );
};