import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { MockInventory } from "@/lib/mock-data";

interface ItemCardProps {
  item: MockInventory;
  onRegisterOutflow?: () => void;
  onReturn?: () => void;
  onMarkSold?: () => void;
  onViewNotes?: () => void;
  onAddNote?: () => void;
  showActions?: boolean;
}

export const ItemCard = ({ 
  item, 
  onRegisterOutflow, 
  onReturn, 
  onMarkSold, 
  onViewNotes, 
  onAddNote,
  showActions = true 
}: ItemCardProps) => {
  const getStatusBadge = () => {
    const statusConfig = {
      cofre: { 
        label: "No Cofre", 
        className: "bg-success text-success-foreground",
        icon: CheckCircle 
      },
      fora: { 
        label: "Fora do Cofre", 
        className: "bg-warning text-warning-foreground",
        icon: Clock 
      },
      vendido: { 
        label: "Vendido", 
        className: "bg-muted text-muted-foreground",
        icon: CheckCircle 
      }
    };

    const config = statusConfig[item.status];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1 font-medium`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionButtons = () => {
    if (!showActions) return null;

    switch (item.status) {
      case 'cofre':
        return (
          <Button 
            onClick={onRegisterOutflow}
            className="w-full bg-primary hover:bg-primary-hover text-lg h-12"
          >
            Registrar Saída
          </Button>
        );
      
      case 'fora':
        return (
          <div className="flex gap-3">
            <Button 
              onClick={onReturn}
              variant="outline"
              className="flex-1 h-12 text-base"
            >
              Devolver
            </Button>
            <Button 
              onClick={onMarkSold}
              className="flex-1 bg-success hover:bg-success/90 h-12 text-base"
            >
              Vendido
            </Button>
          </div>
        );
        
      case 'vendido':
        return (
          <div className="text-center text-muted-foreground text-base">
            Item já foi vendido
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-gradient-card hover:shadow-medium transition-all duration-200">
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{item.model}</h3>
            <p className="text-muted-foreground text-base">{item.color}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* IMEI Info */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-sm text-muted-foreground">IMEI</div>
          <div className="font-mono text-base">
            ...{item.imeiSuffix5}
            <span className="text-xs text-muted-foreground ml-2">
              ({item.imei})
            </span>
          </div>
        </div>

        {/* Notes indicator */}
        {item.notes.length > 0 && (
          <div className="flex items-center justify-between bg-warning/10 rounded-lg p-3 border border-warning/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning-foreground">
                {item.notes.length} observação{item.notes.length > 1 ? 'ões' : ''}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewNotes}
              className="text-warning hover:bg-warning/10"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Ver
            </Button>
          </div>
        )}

        {/* Add note button */}
        <Button
          variant="ghost"
          onClick={onAddNote}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Adicionar Observação
        </Button>

        {/* Action buttons */}
        {getActionButtons()}
      </div>
    </Card>
  );
};