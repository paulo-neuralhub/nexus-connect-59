import { useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';

/**
 * Hook to monitor component lifetime
 */
export function usePerformanceMonitor(componentName: string): void {
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      const duration = performance.now() - startTimeRef.current;
      PerformanceMonitor.record('component_lifetime', duration, 'ms', {
        component: componentName,
      });
    };
  }, [componentName]);
}

/**
 * Hook to measure render time
 */
export function useRenderTime(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now();
    
    PerformanceMonitor.record('component_render', 0, 'count', {
      component: componentName,
      renderNumber: renderCount.current.toString(),
    });
  });
}

/**
 * Hook for measuring async operation performance
 */
export function useMeasureAsync<T>(name: string) {
  const measure = useCallback(
    async (fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> => {
      return PerformanceMonitor.measureAsync(name, fn, tags);
    },
    [name]
  );

  return measure;
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracker(interactionName: string) {
  const track = useCallback(
    (details?: Record<string, string>) => {
      PerformanceMonitor.record('interaction', 1, 'count', {
        name: interactionName,
        ...details,
      });
    },
    [interactionName]
  );

  return track;
}

/**
 * Hook to get current Web Vitals
 */
export function useWebVitals() {
  return PerformanceMonitor.getWebVitals();
}
