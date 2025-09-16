import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Search, X } from "lucide-react";
import { useStock } from "@/hooks/useStock";
import { useToast } from "@/hooks/use-toast";
import { StockService } from "@/services/stockService";

interface StockScannerProps {
  onItemFound?: (item: any) => void;
  onClose?: () => void;
}

export const StockScanner = ({ onItemFound, onClose }: StockScannerProps) => {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    if (scannerRef.current && !isScanning) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          handleScanResult(decodedText);
          html5QrcodeScanner.clear();
          setIsScanning(false);
        },
        (errorMessage) => {
          // Ignore erro de scan contínuo
        }
      );

      setScanner(html5QrcodeScanner);
      setIsScanning(true);
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleScanResult = async (code: string) => {
    try {
      // Buscar item por IMEI ou código
      const items = await StockService.searchByIMEI(code);
      
      if (items.length > 0) {
        const item = items[0];
        toast({
          title: "Item encontrado!",
          description: `${item.brand} ${item.model} - ${item.imei}`,
        });
        onItemFound?.(item);
      } else {
        toast({
          title: "Item não encontrado",
          description: `Nenhum item encontrado para o código: ${code}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar item no estoque",
        variant: "destructive",
      });
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
      setManualCode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Scanner de Código</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Scanner de Câmera */}
        <div className="text-center">
          {!isScanning ? (
            <Button onClick={startScanning} className="mb-4">
              <Scan className="w-4 h-4 mr-2" />
              Iniciar Scanner
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopScanning} className="mb-4">
              <X className="w-4 h-4 mr-2" />
              Parar Scanner
            </Button>
          )}
          
          <div id="qr-reader" ref={scannerRef} className="mx-auto max-w-sm"></div>
        </div>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou digite manualmente
            </span>
          </div>
        </div>

        {/* Entrada Manual */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite o IMEI ou código"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleManualSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};