import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/monitoring';

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startMark = `${componentName}_start`;
    const endMark = `${componentName}_end`;
    
    // Mark component mount
    performanceMonitor.mark(startMark);
    
    return () => {
      // Mark component unmount and measure render time
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(`${componentName}_render`, startMark, endMark);
    };
  }, [componentName]);
  
  const measureAction = (actionName: string, action: () => void) => {
    const startMark = `${componentName}_${actionName}_start`;
    const endMark = `${componentName}_${actionName}_end`;
    
    performanceMonitor.mark(startMark);
    action();
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${componentName}_${actionName}`, startMark, endMark);
  };
  
  return { measureAction };
};