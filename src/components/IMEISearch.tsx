import { useState, useRef, useEffect } from "react";
import { Search, Scan } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchService, type SearchResult, type AISearchResult } from "@/services/searchService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface IMEISearchProps {
  onItemFound: (item: InventoryItem) => void;
  onMultipleFound: (items: InventoryItem[]) => void;
}

export const IMEISearch = ({ onItemFound, onMultipleFound }: IMEISearchProps) => {
  const [imeiInput, setImeiInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [correctedTerm, setCorrectedTerm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-focus for USB scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (useAI = true) => {
    if (!imeiInput.trim()) {
      toast({
        title: "IMEI obrigatório",
        description: "Digite ou escaneie um IMEI para buscar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const cleanIMEI = imeiInput.trim().replace(/\D/g, ''); // Remove non-digits
      
      let result: SearchResult;
      
      if (useAI) {
        // Try AI-enhanced search first
        const aiResult: AISearchResult = await SearchService.aiSearchByIMEI(cleanIMEI);
        
        // Update suggestions and corrected term
        setAiSuggestions(aiResult.suggestions);
        setCorrectedTerm(aiResult.correctedTerm);
        
        // Show AI insights if available
        if (aiResult.reasoning && aiResult.confidence > 0.7) {
          toast({
            title: "💡 Sugestão da IA",
            description: aiResult.reasoning,
          });
        }
        
        // Convert AI result to regular SearchResult format
        result = {
          items: aiResult.results,
          exactMatch: aiResult.results.length === 1 ? aiResult.results[0] : undefined,
          hasMultiple: aiResult.results.length > 1
        };
      } else {
        // Fallback to regular search
        result = await SearchService.searchByIMEI(cleanIMEI);
      }
      
      if (result.exactMatch) {
        onItemFound(result.exactMatch);
        toast({
          title: "✅ Item encontrado!",
          description: `${result.exactMatch.brand} ${result.exactMatch.model}`,
        });
      } else if (result.hasMultiple) {
        onMultipleFound(result.items);
        toast({
          title: "🔍 Múltiplos itens encontrados",
          description: `Encontrados ${result.items.length} itens similares`,
        });
      } else if (result.items.length === 1) {
        onItemFound(result.items[0]);
        toast({
          title: "✅ Item encontrado!",
          description: `${result.items[0].brand} ${result.items[0].model}`,
        });
      } else {
        toast({
          title: "❌ Nenhum resultado",
          description: "Nenhum item encontrado com este termo de busca",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar o item. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers for IMEI
    const cleanValue = value.replace(/\D/g, '');
    setImeiInput(cleanValue);
  };

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scan className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Buscar Item</h2>
            <p className="text-muted-foreground">IMEI completo ou últimos 5 dígitos</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={imeiInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite ou escaneie o IMEI..."
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
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleSearch(true)}
              disabled={isSearching || !imeiInput.trim()}
              className="px-6 py-3 h-auto text-lg bg-primary hover:bg-primary-hover"
            >
              <Search className="h-5 w-5 mr-2" />
              {isSearching ? "🤖 Buscando..." : "🤖 Busca IA"}
            </Button>
            <Button
              onClick={() => handleSearch(false)}
              disabled={isSearching || !imeiInput.trim()}
              variant="outline"
              className="px-3 py-1 text-sm"
            >
              Simples
            </Button>
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">💡 Sugestões da IA:</p>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setImeiInput(suggestion)}
                  className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Corrected Term */}
        {correctedTerm && correctedTerm !== imeiInput && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              🔧 Você quis dizer:{" "}
              <button 
                onClick={() => setImeiInput(correctedTerm)} 
                className="font-medium underline hover:no-underline"
              >
                {correctedTerm}
              </button>
              ?
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};