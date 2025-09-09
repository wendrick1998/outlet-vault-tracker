import { useState, useRef, useEffect } from "react";
import { Search, Scan, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MockDataService, MockInventory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface BatchItemSelectorProps {
  onItemSelected: (item: MockInventory) => void;
  selectedItems: MockInventory[];
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

  const handleSearch = () => {
    if (!imeiInput.trim()) {
      toast({
        title: "IMEI obrigatório",
        description: "Digite ou escaneie um IMEI para adicionar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const cleanIMEI = imeiInput.trim().replace(/\D/g, '');
      
      if (cleanIMEI.length === 15) {
        // Exact IMEI search
        const item = MockDataService.findItemByIMEI(cleanIMEI);
        if (item) {
          handleItemFound(item);
        } else {
          toast({
            title: "IMEI não encontrado",
            description: "Nenhum item encontrado com este IMEI",
            variant: "destructive"
          });
        }
      } else if (cleanIMEI.length === 5) {
        // Suffix search
        const items = MockDataService.findItemsBySuffix(cleanIMEI);
        if (items.length === 1) {
          handleItemFound(items[0]);
        } else if (items.length > 1) {
          toast({
            title: "Múltiplos resultados",
            description: "Use a busca individual para selecionar entre múltiplos itens",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Nenhum resultado",
            description: "Nenhum item encontrado com estes últimos 5 dígitos",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "IMEI inválido",
          description: "Digite o IMEI completo (15 dígitos) ou últimos 5 dígitos",
          variant: "destructive"
        });
      }
      
      setIsSearching(false);
    }, 300);
  };

  const handleItemFound = (item: MockInventory) => {
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
    if (item.status !== 'cofre') {
      toast({
        title: "Item não disponível",
        description: `${item.model} não está no cofre`,
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

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scan className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Adicionar Itens</h2>
              <p className="text-muted-foreground">Escaneie ou digite os IMEIs dos aparelhos</p>
            </div>
          </div>
          
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>

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
      </div>
    </Card>
  );
};