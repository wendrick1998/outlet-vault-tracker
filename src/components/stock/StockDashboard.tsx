import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatsCard } from "@/components/ui/stats-card";
import { StockItemCard } from "./StockItemCard";
import { StockItemDialog } from "./StockItemDialog";
import { StockSearch } from "./StockSearch";
import { StockConferenceCard } from "./StockConferenceCard";
import { StockScanner } from "./StockScanner";
import { StockConferenceWorkflow } from "./StockConferenceWorkflow";
import { StockReports } from "./StockReports";
import { useStock, useStockStats, useStockConferences } from "@/hooks/useStock";
import { useLabels } from "@/hooks/useCatalogs";
import { ArrowLeft, Plus, Search, Scan, Package, Store, ShoppingCart, AlertCircle, TrendingUp, BarChart3, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StockDashboardProps {
  onBack: () => void;
}

export const StockDashboard = ({ onBack }: StockDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { items, isLoading } = useStock({
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    location: selectedLocation !== "all" ? selectedLocation : undefined,
  });

  const { data: stats, isLoading: isLoadingStats } = useStockStats();
  const { conferences, isLoading: isLoadingConferences } = useStockConferences();
  const { data: labels = [] } = useLabels();

  // Filter items based on search term
  const filteredItems = items?.filter(item =>
    item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || isLoadingStats) {
    return <Loading />;
  }

  const handleScanAction = () => {
    toast.info("Funcionalidade de scanner será implementada em breve!");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">Controle completo do estoque de iPhones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanAction}
            className="gap-2"
          >
            <Scan className="h-4 w-4" />
            Scanner
          </Button>
          <Button
            onClick={() => setIsItemDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total de Itens"
          value={stats?.total || 0}
          icon={Package}
          className="lg:col-span-1"
        />
        <StatsCard
          title="Disponíveis"
          value={stats?.available || 0}
          icon={Package}
          variant="success"
          subtitle="Pronto para empréstimo"
          className="lg:col-span-1"
        />
        <StatsCard
          title="Sincronizados"
          value={stats?.synced_with_inventory || 0}
          icon={RefreshCw}
          variant="default"
          subtitle="Vinculados ao cofre"
          className="lg:col-span-1"
        />
        <StatsCard
          title="Reservados"
          value={stats?.reserved || 0}
          icon={AlertCircle}
          variant="warning"
          subtitle="Em empréstimo"
          className="lg:col-span-1"
        />
        <StatsCard
          title="Demonstração"
          value={stats?.demonstration || 0}
          icon={Store}
          variant="default"
          subtitle="Etiquetas automáticas"
          className="lg:col-span-1"
        />
        <StatsCard
          title="Em Estoque"
          value={stats?.estoque || 0}
          icon={Package}
          variant="default"
          subtitle="Armazenados"
          className="lg:col-span-1"
        />
      </div>

      {/* Sync Status Alert */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>
              <strong>Sistema Integrado:</strong> Estoque 100% integrado com cofre ({stats?.synced_with_inventory || 0}/{stats?.total || 0} sincronizados). 
              Empréstimos automáticos • Etiquetas inteligentes ({stats?.demonstration || 0} demonstração) • Sincronização em tempo real.
            </span>
            <RefreshCw className="h-4 w-4 text-green-600" />
          </div>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="search">Buscar</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="conferences">Conferências</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Recent Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.slice(0, 6).map((item) => (
                  <StockItemCard 
                    key={item.id} 
                    item={item}
                    labels={labels}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Conferences */}
          <Card>
            <CardHeader>
              <CardTitle>Conferências Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conferences.slice(0, 3).map((conference) => (
                  <StockConferenceCard key={conference.id} conference={conference} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IMEI, modelo, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="defeituoso">Defeituoso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Localizações</SelectItem>
                <SelectItem value="vitrine">Vitrine</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="assistencia">Assistência</SelectItem>
                <SelectItem value="deposito">Depósito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <StockItemCard 
                key={item.id} 
                item={item}
                labels={labels}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <StockSearch />
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <StockScanner 
            onItemFound={(item) => {
              console.log("Item encontrado:", item);
              // Aqui você pode adicionar lógica adicional quando um item for encontrado
            }} 
          />
        </TabsContent>

        <TabsContent value="conferences" className="space-y-6">
          <StockConferenceWorkflow />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Histórico de Conferências</h3>
            </div>
            
            <div className="grid gap-4">
              {conferences?.map((conference) => (
                <StockConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <StockReports />
        </TabsContent>
      </Tabs>

      <StockItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
      />
    </div>
  );
};