import { useState } from "react";
import { ArrowLeft, Package, ShoppingCart, MapPin, TrendingUp, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockItemCard } from "./StockItemCard";
import { StockItemDialog } from "./StockItemDialog";
import { StockSearch } from "./StockSearch";
import { StockConferenceCard } from "./StockConferenceCard";
import { useStock, useStockStats, useStockConferences } from "@/hooks/useStock";
import { useLabels } from "@/hooks/useCatalogs";
import { Loading } from "@/components/ui/loading";

interface StockDashboardProps {
  onBack: () => void;
}

export const StockDashboard = ({ onBack }: StockDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { items, isLoading: isLoadingItems } = useStock({
    status: statusFilter !== "all" ? statusFilter : undefined,
    location: locationFilter !== "all" ? locationFilter : undefined,
  });

  const { data: stats, isLoading: isLoadingStats } = useStockStats();
  const { conferences, isLoading: isLoadingConferences } = useStockConferences();
  const { data: labels = [] } = useLabels();

  const filteredItems = items.filter(item => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.imei?.toLowerCase().includes(searchLower) ||
      item.model?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower) ||
      item.serial_number?.toLowerCase().includes(searchLower)
    );
  });

  const isLoading = isLoadingItems || isLoadingStats;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Estoque de iPhones
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus produtos, etiquetas e conferências
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setIsItemDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponível</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.available || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservado</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.reserved || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vitrine</CardTitle>
              <MapPin className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.vitrine || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque</CardTitle>
              <Package className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats?.estoque || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="conferences">Conferências</TabsTrigger>
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">Todos os Status</option>
                <option value="disponivel">Disponível</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
                <option value="defeituoso">Defeituoso</option>
              </select>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">Todas as Localizações</option>
                <option value="vitrine">Vitrine</option>
                <option value="estoque">Estoque</option>
                <option value="assistencia">Assistência</option>
                <option value="deposito">Depósito</option>
              </select>
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

          <TabsContent value="conferences">
            <div className="space-y-4">
              {conferences.map((conference) => (
                <StockConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <StockItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
      />
    </div>
  );
};