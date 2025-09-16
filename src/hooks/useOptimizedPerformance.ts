import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Enhanced performance optimization hooks
export function useOptimizedPrefetch() {
  const queryClient = useQueryClient();

  const prefetchData = useCallback(async (queries: Array<{ key: string[]; fn: () => Promise<unknown> }>) => {
    try {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          Promise.all(
            queries.map(query => 
              queryClient.prefetchQuery({
                queryKey: query.key,
                queryFn: query.fn,
                staleTime: 1000 * 60 * 5, // 5 minutes
              })
            )
          );
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          Promise.all(
            queries.map(query => 
              queryClient.prefetchQuery({
                queryKey: query.key,
                queryFn: query.fn,
                staleTime: 1000 * 60 * 5,
              })
            )
          );
        }, 0);
      }
    } catch (error) {
      console.warn('Optimized prefetch failed:', error);
    }
  }, [queryClient]);

  return { prefetchData };
}

export function useOptimizedMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // Only recompute when dependencies actually change (deep comparison for objects)
  const depsRef = useRef<React.DependencyList>();
  const resultRef = useRef<T>();
  
  const depsChanged = !depsRef.current || deps.some((dep, index) => {
    const prevDep = depsRef.current?.[index];
    if (typeof dep === 'object' && typeof prevDep === 'object') {
      return JSON.stringify(dep) !== JSON.stringify(prevDep);
    }
    return dep !== prevDep;
  });
  
  if (depsChanged) {
    depsRef.current = deps;
    resultRef.current = factory();
  }
  
  return resultRef.current!;
}

export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Optimized virtual scrolling with intersection observer
export function useOptimizedVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);

  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

// Optimized image lazy loading with IntersectionObserver
export function useOptimizedLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          setImageSrc(src);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Load images 50px before they come into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    // Fallback to placeholder on error
    if (placeholder && imageSrc !== placeholder) {
      setImageSrc(placeholder);
    }
  }, [placeholder, imageSrc]);

  return { 
    imgRef, 
    imageSrc, 
    isLoaded, 
    isInView,
    handleLoad, 
    handleError 
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Only log if render time is significant (> 16ms for 60fps)
      if (renderTime > 16) {
        console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  });

  return {
    logRender: useCallback((additionalData?: Record<string, unknown>) => {
      console.log(`${componentName} rendered`, {
        renderCount: renderCount.current,
        timestamp: Date.now(),
        ...additionalData
      });
    }, [componentName])
  };
}