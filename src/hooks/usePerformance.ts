import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Performance optimization hooks
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchData = useCallback(async (queries: Array<{ key: string[]; fn: () => Promise<any> }>) => {
    try {
      await Promise.all(
        queries.map(query => 
          queryClient.prefetchQuery({
            queryKey: query.key,
            queryFn: query.fn,
            staleTime: 1000 * 60 * 5, // 5 minutes
          })
        )
      );
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [queryClient]);

  return { prefetchData };
}

export function useMemorizedData<T>(data: T, deps: React.DependencyList): T {
  return useMemo(() => data, deps);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => setIsLoaded(true);

  return { imgRef, imageSrc, isLoaded, handleLoad };
}