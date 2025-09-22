import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockStats {
  totalItems: number;
  availableItems: number;
  reservedItems: number;
  soldItems: number;
  defectiveItems: number;
  valueInStock: number;
  averageBatteryLevel: number;
  byBrand: Record<string, number>;
  byLocation: Record<string, number>;
  byCondition: Record<string, number>;
  lowBatteryCount: number;
  highValueItems: number;
}

export const useStockStats = () => {
  return useQuery({
    queryKey: ['stock-stats'],
    queryFn: async (): Promise<StockStats> => {
      const { data: stockItems, error } = await supabase
        .from('stock_items')
        .select('*');

      if (error) throw error;

      const stats: StockStats = {
        totalItems: stockItems?.length || 0,
        availableItems: stockItems?.filter(item => item.status === 'disponivel').length || 0,
        reservedItems: stockItems?.filter(item => item.status === 'reservado').length || 0,
        soldItems: stockItems?.filter(item => item.status === 'vendido').length || 0,
        defectiveItems: stockItems?.filter(item => item.status === 'defeituoso').length || 0,
        valueInStock: 0,
        averageBatteryLevel: 0,
        byBrand: {},
        byLocation: {},
        byCondition: {},
        lowBatteryCount: 0,
        highValueItems: 0
      };

      if (stockItems?.length) {
        // Calculate value in stock
        stats.valueInStock = stockItems.reduce((sum, item) => {
          return sum + (item.cost ? Number(item.cost) : 0);
        }, 0);

        // Calculate average battery level
        const batteryLevels = stockItems
          .map(item => item.battery_pct || 100)
          .filter(level => level > 0);
        
        stats.averageBatteryLevel = batteryLevels.length > 0 
          ? Math.round(batteryLevels.reduce((sum, level) => sum + level, 0) / batteryLevels.length)
          : 100;

        // Count low battery items
        stats.lowBatteryCount = stockItems.filter(item => (item.battery_pct || 100) < 30).length;

        // Count high value items
        stats.highValueItems = stockItems.filter(item => 
          item.cost && Number(item.cost) > 1000
        ).length;

        // Group by brand
        stockItems.forEach(item => {
          const brand = item.brand || 'Desconhecido';
          stats.byBrand[brand] = (stats.byBrand[brand] || 0) + 1;
        });

        // Group by location
        stockItems.forEach(item => {
          const location = item.location || 'estoque';
          stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
        });

        // Group by condition
        stockItems.forEach(item => {
          const condition = item.condition || 'novo';
          stats.byCondition[condition] = (stats.byCondition[condition] || 0) + 1;
        });
      }

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};