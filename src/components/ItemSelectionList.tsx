import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface ItemSelectionListProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onBack: () => void;
}

export const ItemSelectionList = ({ items, onSelectItem, onBack }: ItemSelectionListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Selecione o Item</h2>
        <Button variant="ghost" onClick={onBack}>
          Voltar à Busca
        </Button>
      </div>

      <p className="text-muted-foreground">
        Encontrados {items.length} itens com estes últimos 5 dígitos:
      </p>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className="p-4 cursor-pointer hover:shadow-medium transition-all duration-200 hover:-translate-y-1"
            onClick={() => onSelectItem(item)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{item.model}</h3>
                <p className="text-muted-foreground">{item.color}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  ...{item.suffix || item.imei.slice(-5)} ({item.imei})
                </p>
              </div>
              
              <div className="text-right">
                <div className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${item.status === 'available' ? 'bg-success/20 text-success' : ''}
                  ${item.status === 'loaned' ? 'bg-warning/20 text-warning' : ''}
                  ${item.status === 'sold' ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {item.status === 'available' && 'Disponível'}
                  {item.status === 'loaned' && 'Emprestado'}
                  {item.status === 'sold' && 'Vendido'}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};