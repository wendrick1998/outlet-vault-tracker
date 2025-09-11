import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data stays fresh
      staleTime: 1000 * 60 * 5, // 5 minutes default
      
      // Cache time - how long data stays in cache after being unused  
      gcTime: 1000 * 60 * 30, // 30 minutes (was previously 'cacheTime')
      
      // Retry failed requests
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors) 
        const errorObj = error as any;
        if (errorObj?.status >= 400 && errorObj?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for critical data
      refetchOnWindowFocus: 'always',
      
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: 'always',

      // Network mode optimization
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
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