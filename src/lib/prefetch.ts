import { queryClient } from './react-query';
import { InventoryService } from '@/services/inventoryService';
import { LoanService } from '@/services/loanService';
import { StatsService } from '@/services/statsService';

export const prefetchStrategies = {
  // Prefetch common data when user hovers over navigation links
  dashboard: async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['stats'],
        queryFn: () => StatsService.getSystemStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: ['inventory', { limit: 10 }],
        queryFn: () => InventoryService.getAll(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }),
    ]);
  },

  activeLoans: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['loans', 'active'],
      queryFn: () => LoanService.getActive(),
      staleTime: 1000 * 60 * 3, // 3 minutes
    });
  },

  history: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['loans', 'history', { page: 1, limit: 20 }],
      queryFn: () => LoanService.getHistory(20),
      staleTime: 1000 * 60 * 10, // 10 minutes (history changes less frequently)
    });
  },

  // Prefetch critical data on app startup
  criticalData: async () => {
    try {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['stats'],
          queryFn: () => StatsService.getSystemStats(),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: ['inventory', 'recent'],
          queryFn: () => InventoryService.getAll(),
          staleTime: 1000 * 60 * 5,
        })
      ]);
    } catch (error) {
      console.warn('Failed to prefetch critical data:', error);
    }
  },

  // Prefetch next page data for pagination
  nextPage: async (currentPage: number, queryKey: string[], queryFn: () => Promise<any>) => {
    const nextPageKey = [...queryKey, { page: currentPage + 1 }];
    
    // Only prefetch if not already cached
    if (!queryClient.getQueryData(nextPageKey)) {
      await queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn,
        staleTime: 1000 * 60 * 3,
      });
    }
  },
};

// Hook up prefetching to navigation events
export const setupPrefetching = () => {
  // Prefetch critical data immediately
  setTimeout(() => {
    prefetchStrategies.criticalData().catch(console.warn);
  }, 100);

  // Set up hover-based prefetching for navigation links
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Prefetch based on route
    if (href.includes('/active-loans')) {
      prefetchStrategies.activeLoans().catch(console.warn);
    } else if (href.includes('/history')) {
      prefetchStrategies.history().catch(console.warn);
    } else if (href === '/') {
      prefetchStrategies.dashboard().catch(console.warn);
    }
  }, { once: false, passive: true });
};