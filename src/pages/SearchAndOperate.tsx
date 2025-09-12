import { useState, useEffect } from "react";
import { Search, ShoppingCart, Filter, Archive } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ItemSearchResults } from "@/components/ItemSearchResults";
import { OperationCart } from "@/components/OperationCart";
import { BulkOperationModal } from "@/components/BulkOperationModal";
import { AdvancedSearchModal } from "@/components/AdvancedSearchModal";
import { SearchService } from "@/services/searchService";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/PermissionGuard";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface SearchAndOperateProps {
  onBack: () => void;
}

export const SearchAndOperate = ({ onBack }: SearchAndOperateProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const { toast } = useToast();

  // Auto-open cart when items are added
  useEffect(() => {
    if (selectedItems.length > 0) {
      setShowCart(true);
    }
  }, [selectedItems.length]);

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await SearchService.searchByIMEI(query);
      let items = result.exactMatch ? [result.exactMatch] : result.items;
      
      // Apply archive filter
      if (!showArchived) {
        items = items.filter(item => !item.is_archived);
      }
      
      setSearchResults(items);
      
      if (items.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Nenhum item encontrado com este termo",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar itens",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async (filters: any) => {
    setIsSearching(true);
    setSearchFilters(filters);
    
    try {
      let items = await SearchService.advancedSearch(filters);
      
      // Apply archive filter
      if (!showArchived) {
        items = items.filter(item => !item.is_archived);
      }
      
      setSearchResults(items);
      setShowAdvancedSearch(false);
      
      toast({
        title: "Busca avançada",
        description: `${items.length} item(s) encontrado(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao executar busca avançada",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = (item: InventoryItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      toast({
        title: "Item já selecionado",
        description: `${item.model} já está no carrinho`,
        variant: "destructive"
      });
      return;
    }

    setSelectedItems(prev => [...prev, item]);
    toast({
      title: "Item adicionado",
      description: `${item.model} foi adicionado ao carrinho`,
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    
    if (selectedItems.length === 1) {
      setShowCart(false);
    }
  };

  const handleClearCart = () => {
    setSelectedItems([]);
    setShowCart(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <PermissionGuard permission="movements.create">
      <div className="min-h-screen bg-background">
        <Header 
          showBack={true} 
          onBack={onBack}
          title="Buscar & Operar"
        />
        
        <main className="container mx-auto px-4 py-6">
          {/* Header com busca e filtros */}
          <div className="space-y-4 mb-6">
            {/* Barra de busca principal */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar por IMEI, modelo, cor, condição..."
                  className="w-full pl-10 pr-4 py-3 text-lg rounded-lg border border-border bg-input focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              
              <Button onClick={() => handleSearch()} disabled={isSearching}>
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowCart(!showCart)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrinho
                {selectedItems.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {selectedItems.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Controles de filtro */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="show-archived" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Mostrar arquivados
                </Label>
              </div>
              
              {searchResults.length > 0 && (
                <Badge variant="secondary">
                  {searchResults.length} resultado(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Resultados da busca */}
          <ItemSearchResults
            items={searchResults}
            selectedItems={selectedItems}
            onAddToCart={handleAddToCart}
            showArchived={showArchived}
            isLoading={isSearching}
          />

          {/* Carrinho lateral */}
          <OperationCart
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            items={selectedItems}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onChooseAction={() => setShowOperationModal(true)}
          />

          {/* Modal de busca avançada */}
          <AdvancedSearchModal
            isOpen={showAdvancedSearch}
            onClose={() => setShowAdvancedSearch(false)}
            onSearch={handleAdvancedSearch}
            includeArchived={showArchived}
          />

          {/* Modal de operações em lote */}
          <BulkOperationModal
            isOpen={showOperationModal}
            onClose={() => setShowOperationModal(false)}
            items={selectedItems}
            onComplete={() => {
              setSelectedItems([]);
              setShowCart(false);
              setShowOperationModal(false);
              // Refresh search results
              if (searchQuery || Object.keys(searchFilters).length > 0) {
                if (searchQuery) {
                  handleSearch();
                } else {
                  handleAdvancedSearch(searchFilters);
                }
              }
            }}
          />
        </main>
      </div>
    </PermissionGuard>
  );
};