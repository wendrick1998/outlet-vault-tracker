import { useState } from "react";
import { 
  Battery, 
  MapPin, 
  Eye, 
  Star, 
  Edit, 
  Tag,
  Smartphone,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { StockItemDialog } from "./StockItemDialog";
import { StockLabelManager } from "./StockLabelManager";
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_item_labels?: Array<{
    id: string;
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
};

type Label = Database['public']['Tables']['labels']['Row'];

interface StockItemCardProps {
  item: StockItem;
  labels: Label[];
}

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-green-500' },
  reservado: { label: 'Reservado', color: 'bg-orange-500' },
  vendido: { label: 'Vendido', color: 'bg-blue-500' },
  defeituoso: { label: 'Defeituoso', color: 'bg-red-500' },
  manutencao: { label: 'Manutenção', color: 'bg-yellow-500' },
  promocao: { label: 'Promoção', color: 'bg-purple-500' },
};

const locationConfig = {
  vitrine: { label: 'Vitrine', icon: Star },
  estoque: { label: 'Estoque', icon: Smartphone },
  assistencia: { label: 'Assistência', icon: Edit },
  deposito: { label: 'Depósito', icon: MapPin },
  loja_online: { label: 'Loja Online', icon: Eye },
  conserto: { label: 'Conserto', icon: Edit },
};

export const StockItemCard = ({ item, labels }: StockItemCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

  const statusInfo = statusConfig[item.status as keyof typeof statusConfig];
  const locationInfo = locationConfig[item.location as keyof typeof locationConfig];
  const LocationIcon = locationInfo?.icon || MapPin;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-primary">
              {item.brand} {item.model}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              IMEI: {item.imei}
            </p>
          </div>
          
          {item.is_featured && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            className={`text-white text-xs ${statusInfo?.color}`}
          >
            {statusInfo?.label}
          </Badge>
          
          <Badge variant="outline" className="text-xs gap-1">
            <LocationIcon className="h-3 w-3" />
            {locationInfo?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Cor:</span>
            <p className="font-medium">{item.color || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Armazenamento:</span>
            <p className="font-medium">{item.storage || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Condição:</span>
            <p className="font-medium capitalize">{item.condition}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Bateria:</span>
            <BatteryIndicator percentage={item.battery_pct || 100} />
          </div>
        </div>

        {/* Price Information */}
        {item.price && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {formatPrice(Number(item.price))}
              </span>
            </div>
            {item.cost && (
              <span className="text-sm text-muted-foreground">
                Custo: {formatPrice(Number(item.cost))}
              </span>
            )}
          </div>
        )}

        {/* Labels */}
        {item.stock_item_labels && item.stock_item_labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.stock_item_labels.map((stockLabel) => (
              <Badge 
                key={stockLabel.id}
                variant="outline"
                style={{ 
                  borderColor: stockLabel.label.color,
                  color: stockLabel.label.color 
                }}
                className="text-xs"
              >
                {stockLabel.label.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{item.view_count || 0} visualizações</span>
          </div>
          {item.shelf_position && (
            <span>Posição: {item.shelf_position}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLabelManagerOpen(true)}
            className="flex-1"
          >
            <Tag className="h-3 w-3 mr-1" />
            Etiquetas
          </Button>
        </div>
      </CardContent>

      <StockItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={item}
      />

      <StockLabelManager
        open={isLabelManagerOpen}
        onOpenChange={setIsLabelManagerOpen}
        stockItem={item}
        availableLabels={labels}
      />
    </Card>
  );
};