import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimized stale times based on data type
      staleTime: 1000 * 60 * 5, // 5 minutes default
      
      // Increased cache time for better performance
      gcTime: 1000 * 60 * 30, // 30 minutes
      
      // Smart retry logic
      retry: (failureCount, error: unknown) => {
        const errorObj = error as Record<string, unknown>;
        
        // Don't retry on 4xx errors (client errors) 
        if (typeof errorObj?.status === 'number' && errorObj.status >= 400 && errorObj.status < 500) {
          return false;
        }
        
        // Don't retry on network errors immediately
        if (errorObj?.name === 'NetworkError' && failureCount === 1) {
          return true;
        }
        
        // Retry up to 2 times for other errors (reduced from 3 for faster failure)
        return failureCount < 2;
      },
      
      // Optimized retry delay with faster initial retry
      retryDelay: (attemptIndex) => {
        // First retry after 500ms, then exponential backoff
        if (attemptIndex === 1) return 500;
        return Math.min(1000 * 2 ** (attemptIndex - 1), 10000); // Max 10s instead of 30s
      },
      
      // Selective window focus refetching (only for critical data)
      refetchOnWindowFocus: (query) => {
        // Only refetch critical queries on window focus
        const criticalQueries = ['stats', 'inventory', 'loans'];
        return criticalQueries.some(key => query.queryKey.includes(key));
      },
      
      // Smart reconnect refetching
      refetchOnReconnect: (query) => {
        // Only refetch if data is stale
        return query.state.isInvalidated || 
               (query.state.dataUpdatedAt && Date.now() - query.state.dataUpdatedAt > 1000 * 60 * 2);
      },

      // Network mode optimization
      networkMode: 'online',
      
      // Enable background refetching for better UX
      refetchOnMount: (query) => {
        // Don't refetch if data is fresh (less than 1 minute old)
        return !query.state.dataUpdatedAt || 
               Date.now() - query.state.dataUpdatedAt > 1000 * 60;
      },
    },
    mutations: {
      // Retry failed mutations with smart logic
      retry: (failureCount, error: unknown) => {
        const errorObj = error as Record<string, unknown>;
        
        // Don't retry client errors
        if (typeof errorObj?.status === 'number' && errorObj.status >= 400 && errorObj.status < 500) {
          return false;
        }
        
        // Retry once for network issues
        return failureCount < 1;
      },
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}