import { useState } from "react";
import { Plus, Search, Filter, Upload } from "lucide-react";
import { CSVXLSXImportDialog } from "@/components/CSVXLSXImportDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevicesAdmin } from "@/hooks/useDevicesAdmin";
import { Loading } from "@/components/ui/loading";

export const AdminDevicesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { devices: items, isLoading, deleteDevice, isDeleting } = useDevicesAdmin(showArchived);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
    const matchesArchived = showArchived ? true : !item.is_archived;
    
    return matchesSearch && matchesBrand && matchesStatus && matchesCondition && matchesArchived;
  });

  const uniqueBrands = [...new Set(items.map(item => item.brand).filter(Boolean))];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Aparelhos (Inventário)</h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Importar CSV/XLSX
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Aparelho
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por IMEI, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="loaned">Emprestado</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
              <SelectItem value="damaged">Danificado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as condições" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as condições</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="seminovo">Seminovo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-archived" 
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <label htmlFor="show-archived" className="text-sm font-medium">
              Mostrar arquivados
            </label>
          </div>

          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              setSearchTerm("");
              setBrandFilter("all");
              setStatusFilter("all");
              setConditionFilter("all");
              setShowArchived(false);
            }}
          >
            <Filter className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Memória</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum aparelho encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      ...{item.imei.slice(-5)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.brand} {item.model}
                    </TableCell>
                    <TableCell>{item.color || '-'}</TableCell>
                    <TableCell>{item.storage || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.condition || 'novo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.status === 'available' ? 'default' : 
                               item.status === 'loaned' ? 'secondary' : 'destructive'}
                      >
                        {item.status === 'available' ? 'Disponível' :
                         item.status === 'loaned' ? 'Emprestado' : 
                         item.status === 'sold' ? 'Vendido' : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteDevice(item.id)}
                          disabled={isDeleting}
                        >
                          {item.is_archived ? "Restaurar" : "Remover"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Import Dialog */}
        <CSVXLSXImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={(summary) => {
            // Atualizar dados após importação
            window.location.reload(); // Refresh simples por enquanto
          }}
        />
      </div>
    </Card>
  );
};