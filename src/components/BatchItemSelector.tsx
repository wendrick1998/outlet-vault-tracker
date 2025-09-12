import { useState, useRef, useEffect } from "react";
import { Search, Scan, Plus, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIMEISearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/use-toast";
import { CSVImporter } from "./CSVImporter";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface BatchItemSelectorProps {
  onItemSelected: (item: InventoryItem) => void;
  selectedItems: InventoryItem[];
}

export const BatchItemSelector = ({ onItemSelected, selectedItems }: BatchItemSelectorProps) => {
  const [imeiInput, setImeiInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-focus for continuous scanning
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedItems]);

  const { refetch: searchByIMEI } = useIMEISearch(imeiInput);

  const handleSearch = async () => {
    if (!imeiInput.trim()) {
      toast({
        title: "IMEI obrigatório",
        description: "Digite ou escaneie um IMEI para adicionar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const cleanIMEI = imeiInput.trim().replace(/\D/g, '');
      const result = await searchByIMEI();
      
      if (result.data?.exactMatch) {
        handleItemFound(result.data.exactMatch);
      } else if (result.data?.items && result.data.items.length === 1) {
        handleItemFound(result.data.items[0]);
      } else if (result.data?.items && result.data.items.length > 1) {
        toast({
          title: "Múltiplos resultados",
          description: "Use a busca individual para selecionar entre múltiplos itens",
          variant: "destructive"
        });
      } else {
        toast({
          title: "IMEI não encontrado",
          description: "Nenhum item encontrado com este IMEI",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar o item",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleItemFound = (item: InventoryItem) => {
    // Check if already selected
    if (selectedItems.find(i => i.imei === item.imei)) {
      toast({
        title: "Item já selecionado",
        description: `${item.model} já está na lista`,
        variant: "destructive"
      });
      setImeiInput("");
      return;
    }

    // Check if item is available
    if (item.status !== 'available') {
      toast({
        title: "Item não disponível",
        description: `${item.model} não está disponível`,
        variant: "destructive"
      });
      setImeiInput("");
      return;
    }

    // Add to selection
    onItemSelected(item);
    toast({
      title: "Item adicionado",
      description: `${item.model} foi adicionado à lista`,
    });
    
    // Clear input for next scan
    setImeiInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/\D/g, '');
    setImeiInput(cleanValue);
  };

  const handleCSVImportComplete = (result: any) => {
    toast({
      title: "Importação concluída",
      description: `${result.created} itens foram importados e estão disponíveis no inventário`,
    });
    
    // Refresh the page or emit an event to update inventory lists
    window.location.reload();
  };

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scan className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Adicionar Itens</h2>
              <p className="text-muted-foreground">Escaneie IMEIs individuais ou importe em lote via CSV</p>
            </div>
          </div>
          
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="gap-2">
              <Scan className="h-4 w-4" />
              Buscar por IMEI
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar CSV
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={imeiInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite ou escaneie o próximo IMEI..."
                  className="
                    w-full px-4 py-3 text-lg rounded-lg border border-border
                    bg-input focus:ring-2 focus:ring-ring focus:border-transparent
                    placeholder:text-muted-foreground transition-all
                  "
                  maxLength={15}
                  autoComplete="off"
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  {imeiInput.length > 0 && (
                    <>
                      {imeiInput.length}/15 dígitos
                      {imeiInput.length === 5 && " (busca por sufixo)"}
                      {imeiInput.length === 15 && " (busca exata)"}
                    </>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleSearch}
                disabled={isSearching || !imeiInput.trim()}
                className="px-6 py-3 h-auto text-lg bg-primary hover:bg-primary-hover"
              >
                <Plus className="h-5 w-5 mr-2" />
                {isSearching ? "Buscando..." : "Adicionar"}
              </Button>
            </div>

            {selectedItems.length > 0 && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Continue adicionando itens ou clique em "Prosseguir" quando terminar
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="csv">
            <CSVImporter onImportComplete={handleCSVImportComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};