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

// Mock data for now - will be replaced with real hook
const mockModels = [
  {
    id: '1',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: 'Pro Max',
    storages: [128, 256, 512, 1024],
    colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
    is_active: true,
    created_at: '2024-01-15'
  },
  {
    id: '2',
    brand: 'Samsung',
    model: 'Galaxy S24',
    variant: 'Ultra',
    storages: [256, 512, 1024],
    colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
    is_active: true,
    created_at: '2024-02-01'
  }
];

export const AdminModelsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || model.brand === brandFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && model.is_active) ||
                         (statusFilter === "inactive" && !model.is_active);
    
    return matchesSearch && matchesBrand && matchesStatus;
  });

  const uniqueBrands = [...new Set(mockModels.map(model => model.brand))];

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
                        {model.storages.map(storage => (
                          <Badge key={storage} variant="outline" className="text-xs">
                            {storage}GB
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.colors.slice(0, 3).map(color => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                        {model.colors.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{model.colors.length - 3}
                          </Badge>
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