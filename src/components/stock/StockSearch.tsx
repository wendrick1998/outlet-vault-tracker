import { useState } from "react";
import { Search, ScanLine, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockItemCard } from "./StockItemCard";
import { useStockSearch } from "@/hooks/useStock";
import { useLabels } from "@/hooks/useCatalogs";

export const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const { data: searchResults = [], isLoading } = useStockSearch(searchTerm);
  const { data: labels = [] } = useLabels();

  const handleScan = () => {
    // Implementar scanner QR/código de barras
    console.log("Scanner not implemented yet");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Trigger search or scanner
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca Inteligente no Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite IMEI, modelo, marca, número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 text-base"
              />
            </div>
            <Button onClick={handleScan} variant="outline" className="gap-2">
              <ScanLine className="h-4 w-4" />
              Scanner
            </Button>
            <Button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              variant="outline" 
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Busca rápida:</span>
            {['iPhone 15', 'iPhone 14 Pro', 'disponivel', 'vitrine', '256GB'].map((suggestion) => (
              <Badge 
                key={suggestion}
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSearchTerm(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>

          {/* Advanced Search */}
          {showAdvancedSearch && (
            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="font-medium">Filtros Avançados</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md bg-background">
                    <option value="">Todos</option>
                    <option value="disponivel">Disponível</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                    <option value="defeituoso">Defeituoso</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md bg-background">
                    <option value="">Todas</option>
                    <option value="vitrine">Vitrine</option>
                    <option value="estoque">Estoque</option>
                    <option value="assistencia">Assistência</option>
                    <option value="deposito">Depósito</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Armazenamento</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md bg-background">
                    <option value="">Todos</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Preço mínimo</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Preço máximo</label>
                  <Input type="number" placeholder="99999" className="mt-1" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      <div>
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Buscando...</p>
          </div>
        )}

        {!isLoading && searchTerm.trim() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Resultados da busca ({searchResults.length})
              </h3>
              {searchResults.length > 0 && (
                <Badge variant="outline">
                  {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente buscar por IMEI, modelo, marca ou número de série
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((item) => (
                  <StockItemCard 
                    key={item.id} 
                    item={item}
                    labels={labels}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchTerm.trim() && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Digite para buscar</h3>
              <p className="text-muted-foreground">
                Busque por IMEI, modelo, marca, cor ou qualquer informação do produto
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};