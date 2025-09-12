import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeviceModelsAdmin } from "@/hooks/useDeviceModelsAdmin";
import { Loading } from "@/components/ui/loading";

export const AdminModelsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { models, isLoading, toggleModelStatus, isUpdating } = useDeviceModelsAdmin();

  const filteredModels = models.filter(model => {
    const matchesSearch = model.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || model.brand === brandFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && model.is_active) ||
                         (statusFilter === "inactive" && !model.is_active);
    
    return matchesSearch && matchesBrand && matchesStatus;
  });

  const uniqueBrands = [...new Set(models.map(model => model.brand))];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Modelos de Aparelhos</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Modelo
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca ou modelo..."
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
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Armazenamentos</TableHead>
                <TableHead>Cores Disponíveis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum modelo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.brand}</TableCell>
                    <TableCell>{model.model}</TableCell>
                    <TableCell>{model.variant || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.supported_storage?.map(storage => (
                          <Badge key={storage} variant="outline" className="text-xs">
                            {storage}GB
                          </Badge>
                        )) || <span className="text-muted-foreground">N/A</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.available_colors?.slice(0, 3).map(color => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                        {(model.available_colors?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(model.available_colors?.length || 0) - 3}
                          </Badge>
                        )}
                        {(!model.available_colors || model.available_colors.length === 0) && (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.is_active ? 'default' : 'secondary'}>
                        {model.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button 
                          variant={model.is_active ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => toggleModelStatus(model.id, model.is_active)}
                          disabled={isUpdating}
                        >
                          {model.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};