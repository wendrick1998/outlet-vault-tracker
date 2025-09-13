import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { Database } from '@/integrations/supabase/types';
import { useItemNotes } from "@/hooks/useItemNotes";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface ItemCardProps {
  item: InventoryItem;
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
  const { notes } = useItemNotes(item.id);
  const getStatusBadge = () => {
    const statusConfig = {
      available: { 
        label: "Disponível", 
        className: "bg-success text-success-foreground",
        icon: CheckCircle 
      },
      loaned: { 
        label: "Emprestado", 
        className: "bg-warning text-warning-foreground",
        icon: Clock 
      },
      sold: { 
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
      case 'available':
        return (
          <Button 
            onClick={onRegisterOutflow}
            className="w-full bg-primary hover:bg-primary-hover text-lg h-12"
          >
            Registrar Saída
          </Button>
        );
      
      case 'loaned':
        return (
          <Button 
            onClick={onReturn}
            className="w-full bg-primary hover:bg-primary-hover text-lg h-12"
          >
            Processar Devolução
          </Button>
        );
        
      case 'sold':
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
            ...{item.suffix || item.imei.slice(-5)}
            <span className="text-xs text-muted-foreground ml-2">
              ({item.imei})
            </span>
          </div>
        </div>

        {/* Notes indicator */}
        {notes && notes.length > 0 && (
          <div className="flex items-center justify-between bg-warning/10 rounded-lg p-3 border border-warning/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning-foreground">
                {notes.length} observação{notes.length > 1 ? 'ões' : ''}
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