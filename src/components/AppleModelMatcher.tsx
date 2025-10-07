import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  matchAppleModel, 
  generateAppleModelSuggestions, 
  normalizeStorage, 
  normalizeAppleColor 
} from "@/lib/apple-catalog-utils";

interface MatchResult {
  brand: string;
  model: string;
  storage?: number;
  color?: string;
  confidence: number;
}

interface AppleModelMatcherProps {
  onMatch?: (result: MatchResult) => void;
}

export const AppleModelMatcher = ({ onMatch }: AppleModelMatcherProps = {}) => {
  const [inputText, setInputText] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleInputChange = (value: string) => {
    setInputText(value);
    
    if (value.length >= 2) {
      const suggestions = generateAppleModelSuggestions(value, 5);
      setSuggestions(suggestions);
      
      const match = matchAppleModel(value);
      setMatchResult(match);
      
      // Se há callback e match com boa confiança, chamar
      if (onMatch && match && match.confidence >= 0.6) {
        onMatch(match);
      }
    } else {
      setSuggestions([]);
      setMatchResult(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    const match = matchAppleModel(suggestion);
    setMatchResult(match);
    setSuggestions([]);
    
    // Chamar callback se disponível
    if (onMatch && match) {
      onMatch(match);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Alta confiança";
    if (confidence >= 0.6) return "Confiança média";
    return "Baixa confiança";
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">🔍 Testador de Matching Apple</h3>
          <p className="text-sm text-muted-foreground">
            Digite um nome de produto Apple para testar o sistema de reconhecimento automático
          </p>
        </div>

        {/* Input com sugestões */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: iPhone 14 Pro Max 256G Dourado, iPhone 13 128GB Azul sierra..."
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sugestões dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resultado do matching */}
        {matchResult && (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Modelo reconhecido com sucesso!</span>
                  <Badge 
                    variant="outline" 
                    className={getConfidenceColor(matchResult.confidence)}
                  >
                    {getConfidenceText(matchResult.confidence)} ({Math.round(matchResult.confidence * 100)}%)
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Marca</label>
                <div className="mt-1">
                  <Badge variant="default">{matchResult.brand}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                <div className="mt-1">
                  <Badge variant="secondary">{matchResult.model}</Badge>
                </div>
              </div>

              {matchResult.storage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Armazenamento</label>
                  <div className="mt-1">
                    <Badge variant="outline">{matchResult.storage}GB</Badge>
                  </div>
                </div>
              )}

              {matchResult.color && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cor</label>
                  <div className="mt-1">
                    <Badge variant="outline">{matchResult.color}</Badge>
                  </div>
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showDetails ? 'Ocultar' : 'Mostrar'} detalhes técnicos
            </Button>

            {showDetails && (
              <div className="bg-muted p-4 rounded-md text-sm font-mono">
                <div className="space-y-2">
                  <div><strong>Input original:</strong> "{inputText}"</div>
                  <div><strong>Matching result:</strong></div>
                  <pre className="ml-4 text-xs">
{JSON.stringify(matchResult, null, 2)}
                  </pre>
                  
                  {/* Demonstrate individual normalization functions */}
                  <div><strong>Normalizações aplicadas:</strong></div>
                  <div className="ml-4 space-y-1">
                    {inputText.match(/\d+\s*(g|gb|tb)/i) && (
                      <div>Storage: "{inputText.match(/\d+\s*(g|gb|tb)/i)?.[0]}" → {normalizeStorage(inputText.match(/\d+\s*(g|gb|tb)/i)?.[0] || "")}GB</div>
                    )}
                    
                    {matchResult.color && (
                      <div>Cor: detectada e normalizada → "{matchResult.color}"</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No match found */}
        {inputText.length >= 3 && !matchResult && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum modelo Apple reconhecido. Tente variações como:
              <ul className="mt-2 text-xs space-y-1 ml-4">
                <li>• "iPhone 14 Pro" em vez de "i14 pro"</li>
                <li>• Inclua capacidade: "iPhone 13 256GB"</li>
                <li>• Use nomes completos: "iPhone SE 3ª geração"</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Exemplos */}
        {!inputText && (
          <div className="space-y-2">
            <label className="text-sm font-medium">💡 Exemplos para testar:</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                "iPhone 14 Pro Max 256G Dourado",
                "iPhone 13 128GB Azul sierra",
                "iPhone SE 3 64GB Vermelho",
                "iPhone 15 Pro 1TB Titanio natural",
                "iphone 12 pro 256gb grafite"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleInputChange(example)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground p-2 border border-border rounded hover:bg-muted transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};