import { useState, useMemo } from 'react';
import { Search, Package, TrendingUp, Battery } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatteryIndicator } from '@/components/BatteryIndicator';

interface UnifiedItem {
  inventory_id: string;
  stock_id: string | null;
  imei: string;
  model: string;
  brand: string;
  color: string | null;
  storage: string | null;
  condition: string | null;
  battery_pct: number | null;
  inventory_status: string;
  stock_status: string | null;
  price: number | null;
  location: string | null;
  notes: string | null;
}

interface UnifiedItemSelectorProps {
  onSelect: (item: UnifiedItem) => void;
  selectedId?: string;
}

export const UnifiedItemSelector = ({ onSelect, selectedId }: UnifiedItemSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['unified-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_inventory')
        .select('*')
        .eq('inventory_status', 'available')
        .order('inventory_created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UnifiedItem[];
    },
  });

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.imei.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      item.brand.toLowerCase().includes(term) ||
      (item.color && item.color.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por IMEI, modelo, marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="h-4 w-4" />
          {filteredItems.length} disponíveis
        </span>
        {filteredItems.some(i => i.stock_id) && (
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            {filteredItems.filter(i => i.stock_id).length} com preço
          </span>
        )}
      </div>

      {/* Items List */}
      <ScrollArea className="h-[400px] rounded-md border">
        <div className="space-y-2 p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item disponível'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.inventory_id}
                className={`p-4 cursor-pointer transition-all hover:border-primary ${
                  selectedId === item.inventory_id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.brand} {item.model}</h4>
                      {item.stock_id && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Integrado
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">...{item.imei.slice(-5)}</span>
                      {item.color && <span>• {item.color}</span>}
                      {item.storage && <span>• {item.storage}</span>}
                      {item.condition && (
                        <Badge variant="secondary" className="text-xs">
                          {item.condition}
                        </Badge>
                      )}
                    </div>

                    {/* Price & Location (if synced) */}
                    {item.stock_id && (
                      <div className="flex items-center gap-3 text-sm">
                        {item.price && (
                          <span className="font-semibold text-green-600">
                            R$ {item.price.toFixed(2)}
                          </span>
                        )}
                        {item.location && (
                          <Badge variant="outline" className="text-xs">
                            {item.location}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Battery */}
                  {item.battery_pct !== null && (
                    <div className="flex items-center gap-2">
                      <BatteryIndicator battery={item.battery_pct} />
                      <Battery className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};