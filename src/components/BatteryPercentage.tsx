import { useState, useEffect } from "react";
import { Battery, BatteryLow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";

interface BatteryPercentageProps {
  itemId: string;
  currentPercentage: number | null;
  disabled?: boolean;
}

export const BatteryPercentage = ({ 
  itemId, 
  currentPercentage, 
  disabled = false 
}: BatteryPercentageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [percentage, setPercentage] = useState(currentPercentage || 100);
  const [inputValue, setInputValue] = useState(String(currentPercentage || 100));
  const { updateItem, isUpdating } = useInventory();
  const { toast } = useToast();

  useEffect(() => {
    setPercentage(currentPercentage || 100);
    setInputValue(String(currentPercentage || 100));
  }, [currentPercentage]);

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return Battery;
    if (level <= 20) return BatteryLow;
    return Battery;
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return "text-muted-foreground";
    if (level <= 20) return "text-destructive";
    if (level <= 50) return "text-warning";
    return "text-success";
  };

  const handleSave = async () => {
    const newPercentage = Math.max(0, Math.min(100, percentage));
    
    try {
      await updateItem({
        id: itemId,
        data: { battery_pct: newPercentage }
      });
      
      toast({
        title: "Bateria atualizada",
        description: `Bateria definida para ${newPercentage}%`,
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a bateria",
        variant: "destructive"
      });
    }
  };

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setPercentage(newValue);
    setInputValue(String(newValue));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setPercentage(Math.max(0, Math.min(100, numValue)));
    }
  };

  const BatteryIcon = getBatteryIcon(currentPercentage);

  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
      <div className="flex items-center gap-2">
        <BatteryIcon className={`h-4 w-4 ${getBatteryColor(currentPercentage)}`} />
        <span className="text-sm font-medium">
          {currentPercentage ? `${currentPercentage}%` : "N/A"}
        </span>
      </div>

      {!disabled && (
        <Popover open={isEditing} onOpenChange={setIsEditing}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Zap className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Ajustar Bateria</h4>
                <p className="text-sm text-muted-foreground">
                  Defina o percentual de bateria do aparelho
                </p>
              </div>

              <div className="space-y-3">
                <div className="px-3">
                  <Slider
                    value={[percentage]}
                    onValueChange={handleSliderChange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    min={0}
                    max={100}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    size="sm"
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};