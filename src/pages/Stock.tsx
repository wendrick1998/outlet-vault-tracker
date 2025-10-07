import { StockDashboard } from "@/components/stock/StockDashboard";
import { QuickImportCard } from "@/components/stock/QuickImportCard";
import { ImportHistory } from "@/components/stock/ImportHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";

interface StockProps {
  onBack: () => void;
}

export const Stock = ({ onBack }: StockProps) => {
  return (
    <div className="space-y-6">
      {/* Import Alert Banner */}
      <Alert className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <Upload className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Importação em Massa Disponível!</span> Cadastre múltiplos aparelhos de uma vez usando arquivos CSV ou XLSX.
        </AlertDescription>
      </Alert>

      {/* Quick Import Card */}
      <QuickImportCard />

      {/* Import History */}
      <ImportHistory />

      {/* Stock Dashboard */}
      <StockDashboard onBack={onBack} />
    </div>
  );
};