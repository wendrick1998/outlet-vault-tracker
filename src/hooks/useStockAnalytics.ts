import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StockAnalytics {
  movementsByPeriod: Array<{ date: string; entries: number; transfers: number; sales: number }>;
  topItemsByLocation: Array<{ location: string; count: number }>;
  topBrandsByCount: Array<{ brand: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number; percentage: number }>;
  statusTrends: Array<{ status: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  demonstrationMetrics: {
    totalDemonstrations: number;
    averageDaysInShowroom: number;
    topDemonstrationModels: Array<{ model: string; count: number }>;
  };
}

const ANALYTICS_QUERY_KEYS = {
  analytics: ['stock', 'analytics'] as const,
  movements: (days: number) => [...ANALYTICS_QUERY_KEYS.analytics, 'movements', days] as const,
};

export function useStockAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics,
    queryFn: async (): Promise<StockAnalytics> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Movimentações por período
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('movement_type, performed_at')
        .gte('performed_at', startDate.toISOString())
        .order('performed_at', { ascending: true });

      const movementsByPeriod = movements?.reduce((acc, movement) => {
        const date = new Date(movement.performed_at).toISOString().split('T')[0];
        const existing = acc.find(m => m.date === date);
        
        if (existing) {
          if (movement.movement_type === 'entrada') existing.entries++;
          else if (movement.movement_type === 'transferencia') existing.transfers++;
          else if (movement.movement_type === 'venda') existing.sales++;
        } else {
          acc.push({
            date,
            entries: movement.movement_type === 'entrada' ? 1 : 0,
            transfers: movement.movement_type === 'transferencia' ? 1 : 0,
            sales: movement.movement_type === 'venda' ? 1 : 0,
          });
        }
        return acc;
      }, [] as Array<{ date: string; entries: number; transfers: number; sales: number }>) || [];

      // Distribuição por localização
      const { data: locationData } = await supabase
        .from('stock_items')
        .select('location');

      const locationCounts = locationData?.reduce((acc, item) => {
        acc[item.location] = (acc[item.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const total = Object.values(locationCounts).reduce((sum, count) => sum + count, 0);
      const locationDistribution = Object.entries(locationCounts).map(([location, count]) => ({
        location,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      // Top marcas
      const { data: brandData } = await supabase
        .from('stock_items')
        .select('brand');

      const brandCounts = brandData?.reduce((acc, item) => {
        acc[item.brand] = (acc[item.brand] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topBrandsByCount = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Itens por localização
      const topItemsByLocation = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);

      // Métricas de demonstração
      const { data: demonstrationData } = await supabase
        .from('stock_items')
        .select('model, location, created_at')
        .eq('location', 'vitrine');

      const demonstrationMetrics = {
        totalDemonstrations: demonstrationData?.length || 0,
        averageDaysInShowroom: demonstrationData?.reduce((acc, item) => {
          const days = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return acc + days;
        }, 0) / (demonstrationData?.length || 1) || 0,
        topDemonstrationModels: demonstrationData?.reduce((acc, item) => {
          const existing = acc.find(m => m.model === item.model);
          if (existing) existing.count++;
          else acc.push({ model: item.model, count: 1 });
          return acc;
        }, [] as Array<{ model: string; count: number }>) || [],
      };

      // Tendências de status (simplificado)
      const statusTrends = [
        { status: 'disponivel', count: locationCounts.estoque || 0, trend: 'stable' as const },
        { status: 'vitrine', count: locationCounts.vitrine || 0, trend: 'up' as const },
        { status: 'reservado', count: 0, trend: 'stable' as const }, // Will be populated with actual loan data
      ];

      return {
        movementsByPeriod,
        topItemsByLocation,
        topBrandsByCount,
        locationDistribution,
        statusTrends,
        demonstrationMetrics,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMovementAnalytics(days: number = 7) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.movements(days),
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: movements } = await supabase
        .from('stock_movements')
        .select(`
          *,
          stock_item:stock_items(id, model, brand, imei)
        `)
        .gte('performed_at', startDate.toISOString())
        .order('performed_at', { ascending: false });

      return movements || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}