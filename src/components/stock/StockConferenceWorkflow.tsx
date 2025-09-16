import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Check, 
  X, 
  FileText, 
  Package,
  AlertCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStockConferences } from "@/hooks/useStock";
import { StockScanner } from "./StockScanner";
import { StatsCard } from "@/components/ui/stats-card";
import { formatDate } from "date-fns";

interface ConferenceItem {
  id: string;
  imei: string;
  model: string;
  brand: string;
  status: 'pending' | 'found' | 'missing' | 'discrepant';
  expectedLocation: string;
  foundLocation?: string;
  scannedAt?: Date;
  notes?: string;
}

interface StockConferenceWorkflowProps {
  conferenceId?: string;
  location?: string;
  onComplete?: () => void;
}

export const StockConferenceWorkflow = ({ 
  conferenceId, 
  location = 'estoque',
  onComplete 
}: StockConferenceWorkflowProps) => {
  const [isActive, setIsActive] = useState(false);
  const [items, setItems] = useState<ConferenceItem[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const [notes, setNotes] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const { createConference, isCreating } = useStockConferences();

  // Simular carregamento de itens esperados (baseado na localização)
  useEffect(() => {
    loadExpectedItems();
  }, [location]);

  const loadExpectedItems = async () => {
    // Aqui você carregaria os itens esperados na localização da conferência
    // Por enquanto, vamos simular alguns itens
    const mockItems: ConferenceItem[] = [
      {
        id: '1',
        imei: '123456789012345',
        model: 'iPhone 14 Pro',
        brand: 'Apple',
        status: 'pending',
        expectedLocation: location
      },
      {
        id: '2',
        imei: '123456789012346',
        model: 'iPhone 13',
        brand: 'Apple', 
        status: 'pending',
        expectedLocation: location
      }
    ];
    setItems(mockItems);
  };

  const startConference = async () => {
    try {
      await createConference({
        title: `Conferência - ${location}`,
        description: `Conferência física do estoque na localização: ${location}`,
        location: location as any
      });
      
      setIsActive(true);
      toast({
        title: "Conferência iniciada",
        description: `Conferência da ${location} foi iniciada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao iniciar conferência",
        variant: "destructive",
      });
    }
  };

  const pauseConference = () => {
    setIsActive(false);
    toast({
      title: "Conferência pausada",
      description: "Você pode continuar depois",
    });
  };

  const handleItemScanned = (scannedItem: any) => {
    const imei = scannedItem.imei;
    setCurrentScan(imei);
    
    // Verificar se o item era esperado
    const expectedItem = items.find(item => item.imei === imei);
    
    if (expectedItem) {
      // Item encontrado - marcar como found
      setItems(prev => prev.map(item => 
        item.imei === imei 
          ? { 
              ...item, 
              status: 'found',
              scannedAt: new Date(),
              foundLocation: scannedItem.location || location
            }
          : item
      ));
      
      toast({
        title: "Item confirmado",
        description: `${expectedItem.brand} ${expectedItem.model} encontrado!`,
      });
    } else {
      // Item não esperado - adicionar como discrepante
      const newItem: ConferenceItem = {
        id: Date.now().toString(),
        imei,
        model: scannedItem.model,
        brand: scannedItem.brand,
        status: 'discrepant',
        expectedLocation: location,
        foundLocation: scannedItem.location || location,
        scannedAt: new Date(),
        notes: "Item encontrado mas não esperado nesta localização"
      };
      
      setItems(prev => [...prev, newItem]);
      
      toast({
        title: "Discrepância encontrada",
        description: "Item não esperado nesta localização",
        variant: "destructive",
      });
    }
    
    setCurrentScan("");
  };

  const handleManualScan = () => {
    if (currentScan.trim()) {
      // Simular busca do item pelo IMEI
      handleItemScanned({
        imei: currentScan,
        model: "Item Manual",
        brand: "Desconhecido",
        location: location
      });
    }
  };

  const markItemAsMissing = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: 'missing', notes: notes || "Item não encontrado na conferência" }
        : item
    ));
    setNotes("");
  };

  const completeConference = () => {
    const foundCount = items.filter(item => item.status === 'found').length;
    const missingCount = items.filter(item => item.status === 'missing').length;
    const discrepantCount = items.filter(item => item.status === 'discrepant').length;
    
    toast({
      title: "Conferência finalizada",
      description: `${foundCount} encontrados, ${missingCount} faltando, ${discrepantCount} discrepantes`,
    });
    
    onComplete?.();
    setIsActive(false);
  };

  const stats = {
    total: items.length,
    found: items.filter(item => item.status === 'found').length,
    missing: items.filter(item => item.status === 'missing').length,
    pending: items.filter(item => item.status === 'pending').length,
    discrepant: items.filter(item => item.status === 'discrepant').length
  };

  const progress = stats.total > 0 ? ((stats.found + stats.missing + stats.discrepant) / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Conferência */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Conferência de Estoque</h2>
            <p className="text-muted-foreground">Localização: {location}</p>
          </div>
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startConference} disabled={isCreating}>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Conferência
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={pauseConference}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
                <Button onClick={completeConference}>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso da Conferência</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={Package}
          variant="default"
        />
        <StatsCard
          title="Encontrados"
          value={stats.found}
          icon={Check}
          variant="success"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Faltando"
          value={stats.missing}
          icon={X}
          variant="destructive"
        />
        <StatsCard
          title="Discrepantes"
          value={stats.discrepant}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      {isActive && (
        <>
          {/* Scanner */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scanner de Itens</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowScanner(!showScanner)}
              >
                {showScanner ? "Ocultar Scanner" : "Mostrar Scanner"}
              </Button>
            </div>

            {showScanner && (
              <StockScanner onItemFound={handleItemScanned} />
            )}

            {/* Entrada manual */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Digite IMEI manualmente"
                value={currentScan}
                onChange={(e) => setCurrentScan(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
              />
              <Button onClick={handleManualScan}>
                Adicionar
              </Button>
            </div>
          </Card>

          {/* Lista de Itens */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Itens da Conferência</h3>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.brand} {item.model}</span>
                      <Badge 
                        variant={
                          item.status === 'found' ? 'default' :
                          item.status === 'missing' ? 'destructive' :
                          item.status === 'discrepant' ? 'secondary' : 'outline'
                        }
                      >
                        {item.status === 'found' ? 'Encontrado' :
                         item.status === 'missing' ? 'Faltando' :
                         item.status === 'discrepant' ? 'Discrepante' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">IMEI: {item.imei}</p>
                    {item.scannedAt && (
                      <p className="text-xs text-muted-foreground">
                        Escaneado em: {formatDate(item.scannedAt, 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => markItemAsMissing(item.id)}
                      >
                        Marcar Faltando
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notas para item faltando */}
            {items.some(item => item.status === 'pending') && (
              <div className="mt-4 space-y-2">
                <Label>Notas (para itens faltando)</Label>
                <Textarea
                  placeholder="Adicione observações sobre itens faltando..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};