import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useStock } from "@/hooks/useStock";
import { CheckCircle, Package, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";

interface DeviceData {
  model: string;
  storage: string;
  color: string;
  condition: string;
  battery_pct: number;
  imei: string;
  imei2?: string;
  serial_number?: string;
  price?: number;
  warranty_months?: number;
}

const PREDEFINED_DEVICES: DeviceData[] = [
  { model: "iPhone 11", storage: "128GB", color: "branco", condition: "seminovo", battery_pct: 100, imei: "351594955657173", price: 1115.00 },
  { model: "iPhone 11", storage: "128GB", color: "branco", condition: "seminovo", battery_pct: 100, imei: "350320526724412" },
  { model: "iPhone 15 Pro Max", storage: "256GB", color: "titânio branco", condition: "seminovo", battery_pct: 100, imei: "354689822016830", price: 4045.00 },
  { model: "iPhone 14 Pro Max", storage: "128GB", color: "roxo-profundo", condition: "seminovo", battery_pct: 100, imei: "356163578404994", price: 2970.00 },
  { model: "iPhone 14 Pro Max", storage: "128GB", color: "preto-espacial", condition: "seminovo", battery_pct: 100, imei: "357938436757314", price: 2970.00 },
  { model: "iPhone 14 Pro Max", storage: "128GB", color: "prateado", condition: "seminovo", battery_pct: 100, imei: "353742536633332", price: 2970.00 },
  { model: "iPhone 13", storage: "128GB", color: "meia-noite", condition: "seminovo", battery_pct: 100, imei: "358110349472832", price: 1695.00 },
  { model: "iPhone 13", storage: "128GB", color: "meia-noite", condition: "seminovo", battery_pct: 100, imei: "357167828587093", price: 1695.00 },
  { model: "iPhone 13", storage: "128GB", color: "estelar", condition: "seminovo", battery_pct: 100, imei: "352180445097185", price: 1695.00 },
  { model: "iPhone 13", storage: "128GB", color: "estelar", condition: "seminovo", battery_pct: 100, imei: "357084348902654", price: 1695.00 },
  { model: "iPhone 12 Pro Max", storage: "128GB", color: "azul-Pacífico", condition: "seminovo", battery_pct: 100, imei: "356712117507962", price: 1815.00 },
  { model: "iPhone 12 Pro Max", storage: "128GB", color: "grafite", condition: "seminovo", battery_pct: 100, imei: "352117350848830", price: 1815.00 },
  { model: "iPhone 12", storage: "128GB", color: "preto", condition: "seminovo", battery_pct: 100, imei: "358259427864707" },
  { model: "iPhone 14 Pro", storage: "128GB", color: "prateado", condition: "seminovo", battery_pct: 100, imei: "354672349449429", price: 2700.00 },
  { model: "iPhone 15 Pro", storage: "256GB", color: "titânio preto", condition: "seminovo", battery_pct: 100, imei: "355473492331269", price: 3825.00 },
  { model: "iPhone 12", storage: "128GB", color: "roxo", condition: "seminovo", battery_pct: 100, imei: "353726511428172", price: 1230.00 },
  { model: "iPhone 12", storage: "128GB", color: "azul", condition: "seminovo", battery_pct: 100, imei: "351793391734428" },
  { 
    model: "iPhone 16 Pro Max", 
    storage: "256GB", 
    color: "Titânio preto", 
    condition: "novo", 
    battery_pct: 100, 
    imei: "353393814179455", 
    imei2: "353393814127066",
    serial_number: "SM9XM4D7255",
    price: 6270.00,
    warranty_months: 12 
  },
  { 
    model: "iPhone 16 Pro Max", 
    storage: "256GB", 
    color: "Titânio natural", 
    condition: "novo", 
    battery_pct: 100, 
    imei: "353393813862648", 
    imei2: "353393813779461",
    serial_number: "SH44JJP6P64",
    price: 6270.00,
    warranty_months: 12 
  },
  { 
    model: "iPad 11th", 
    storage: "128GB", 
    color: "Silver", 
    condition: "novo", 
    battery_pct: 100, 
    imei: "SJXMXP6ND93", 
    serial_number: "SJXMXP6ND93",
    price: 1990.00,
    warranty_months: 12 
  },
  { 
    model: "iPhone 14", 
    storage: "128GB", 
    color: "estelar", 
    condition: "novo", 
    battery_pct: 100, 
    imei: "357012201491663", 
    imei2: "357012201305939",
    serial_number: "SCXF6VYY9X4",
    price: 2855.00,
    warranty_months: 12 
  }
];

export const BatchStockImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
    completed: boolean;
  }>({
    success: 0,
    errors: [],
    completed: false
  });

  const { createItem } = useStock();

  const calculateWarrantyDate = (months: number = 3): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const handleBatchImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportResults({ success: 0, errors: [], completed: false });

    const total = PREDEFINED_DEVICES.length;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < PREDEFINED_DEVICES.length; i++) {
      const device = PREDEFINED_DEVICES[i];
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        await createItem({
          imei: device.imei,
          model: device.model,
          brand: device.model.startsWith('iPad') ? 'Apple' : 'Apple',
          color: device.color,
          storage: device.storage,
          condition: device.condition,
          battery_pct: device.battery_pct,
          price: device.price || null,
          status: "disponivel" as const,
          location: "estoque" as const,
          acquisition_date: today,
          warranty_until: calculateWarrantyDate(device.warranty_months || 3),
          serial_number: device.serial_number || null,
          notes: device.imei2 ? `IMEI 2: ${device.imei2}` : null
        });

        successCount++;
        
        setImportResults(prev => ({ 
          ...prev, 
          success: successCount 
        }));
        
      } catch (error) {
        const errorMessage = `Erro ao importar ${device.model} (${device.imei}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(errorMessage);
        console.error(errorMessage, error);
      }
      
      setProgress(((i + 1) / total) * 100);
    }

    setImportResults({
      success: successCount,
      errors,
      completed: true
    });

    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} aparelhos importados com sucesso!`);
    }
    
    if (errors.length > 0) {
      toast.error(`${errors.length} erros durante a importação`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Importação em Lote - Entrada de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{PREDEFINED_DEVICES.length}</div>
                <div className="text-sm text-muted-foreground">Aparelhos para importar</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                <div className="text-sm text-muted-foreground">Importados com sucesso</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Aparelhos que serão importados:</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {PREDEFINED_DEVICES.map((device, index) => (
              <div key={device.imei} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {device.model} {device.storage} {device.color}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    IMEI: {device.imei} {device.imei2 && `• IMEI2: ${device.imei2}`}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={device.condition === 'novo' ? 'default' : 'secondary'}>
                    {device.condition.toUpperCase()}
                  </Badge>
                  {device.price && (
                    <div className="text-sm font-medium text-green-600">
                      R$ {device.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importando aparelhos...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {importResults.completed && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Importação concluída! {importResults.success} aparelhos foram adicionados ao estoque como disponíveis.
              {importResults.errors.length > 0 && ` ${importResults.errors.length} erros ocorreram.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {importResults.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Erros durante a importação:</div>
                {importResults.errors.map((error, index) => (
                  <div key={index} className="text-xs">{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleBatchImport} 
            disabled={isImporting || importResults.completed}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importando...' : importResults.completed ? 'Importação Concluída' : 'Importar Todos os Aparelhos'}
          </Button>
          
          {importResults.completed && (
            <Button 
              variant="outline" 
              onClick={() => {
                setImportResults({ success: 0, errors: [], completed: false });
                setProgress(0);
              }}
            >
              Nova Importação
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};