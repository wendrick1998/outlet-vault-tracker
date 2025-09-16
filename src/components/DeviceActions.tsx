import { Edit, Archive, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeviceItem, DeviceActionData } from "@/types/api";

interface DeviceActionsProps {
  item: DeviceItem;
  onAction: (action: DeviceActionData) => void;
}

export const DeviceActions = ({ item, onAction }: DeviceActionsProps) => {
  const handleAction = (type: 'archive' | 'delete' | 'restore') => {
    onAction({ isOpen: true, type, item });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        <Edit className="h-3 w-3 mr-1" />
        Editar
      </Button>
      
      {!item.is_archived ? (
        <Button variant="secondary" size="sm" onClick={() => handleAction('archive')}>
          <Archive className="h-3 w-3 mr-1" />
          Arquivar
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => handleAction('restore')}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleAction('delete')}>
            <Trash2 className="h-3 w-3 mr-1" />
            Excluir
          </Button>
        </div>
      )}
    </div>
  );
};