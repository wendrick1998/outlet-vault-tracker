import { useState, useCallback, useRef, useEffect } from 'react';

interface PerformanceMetrics {
  scanCount: number;
  averageScanTime: number;
  totalScanTime: number;
  errorCount: number;
  duplicateCount: number;
  cacheHitRate: number;
  memoryUsage?: number;
}

export function useAuditPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    scanCount: 0,
    averageScanTime: 0,
    totalScanTime: 0,
    errorCount: 0,
    duplicateCount: 0,
    cacheHitRate: 0
  });

  const scanTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);

  const startScan = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endScan = useCallback((success: boolean = true, isDuplicate: boolean = false) => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    scanTimes.current.push(duration);
    
    setMetrics(prev => {
      const newScanCount = prev.scanCount + 1;
      const newTotalTime = prev.totalScanTime + duration;
      const newAverageTime = newTotalTime / newScanCount;
      
      return {
        ...prev,
        scanCount: newScanCount,
        totalScanTime: newTotalTime,
        averageScanTime: newAverageTime,
        errorCount: success ? prev.errorCount : prev.errorCount + 1,
        duplicateCount: isDuplicate ? prev.duplicateCount + 1 : prev.duplicateCount
      };
    });
  }, []);

  const updateCacheHitRate = useCallback((hitRate: number) => {
    setMetrics(prev => ({ ...prev, cacheHitRate: hitRate }));
  }, []);

  const getPerformanceInsights = useCallback(() => {
    const insights = [];
    
    if (metrics.averageScanTime > 2000) {
      insights.push({
        type: 'warning',
        message: 'Tempo médio de scan está alto (>2s). Considere otimizações.'
      });
    }
    
    if (metrics.errorCount / metrics.scanCount > 0.1) {
      insights.push({
        type: 'error',
        message: 'Taxa de erro alta (>10%). Verifique conectividade ou dados.'
      });
    }
    
    if (metrics.cacheHitRate < 50) {
      insights.push({
        type: 'info',
        message: 'Taxa de cache baixa (<50%). Cache pode ser otimizado.'
      });
    }
    
    if (metrics.duplicateCount / metrics.scanCount > 0.05) {
      insights.push({
        type: 'warning',
        message: 'Muitos duplicados detectados (>5%). Verifique processo.'
      });
    }

    return insights;
  }, [metrics]);

  const reset = useCallback(() => {
    setMetrics({
      scanCount: 0,
      averageScanTime: 0,
      totalScanTime: 0,
      errorCount: 0,
      duplicateCount: 0,
      cacheHitRate: 0
    });
    scanTimes.current = [];
  }, []);

  // Monitor memory usage if available
  useEffect(() => {
    if ('memory' in performance) {
      const interval = setInterval(() => {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / (1024 * 1024) // MB
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return {
    metrics,
    startScan,
    endScan,
    updateCacheHitRate,
    getPerformanceInsights,
    reset
  };
}