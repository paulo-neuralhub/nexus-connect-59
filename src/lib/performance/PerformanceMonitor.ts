/**
 * Performance Monitoring System
 * Tracks Web Vitals, resource timing, and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: number;
  userId?: string;
  url: string;
}

class PerformanceMonitorClass {
  private metrics: PerformanceMetric[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos
  private initialized = false;

  init(): void {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    // Web Vitals
    this.observeWebVitals();
    
    // Resource timing
    this.observeResources();
    
    // Long tasks
    this.observeLongTasks();
    
    // Errors
    this.observeErrors();

    // Flush periódico
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  // ==========================================
  // WEB VITALS
  // ==========================================

  private observeWebVitals(): void {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.record('LCP', lastEntry.startTime, 'ms');
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as any;
        if (firstInput) {
          this.record('FID', firstInput.processingStart - firstInput.startTime, 'ms');
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.record('CLS', clsValue, 'count');
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Time to First Byte
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming;
        this.record('TTFB', navigationEntry.responseStart - navigationEntry.requestStart, 'ms');
        this.record('DOMContentLoaded', navigationEntry.domContentLoadedEventEnd, 'ms');
        this.record('Load', navigationEntry.loadEventEnd, 'ms');
      }
    } catch (error) {
      // PerformanceObserver might not be supported
      console.warn('[PerformanceMonitor] Web Vitals not supported:', error);
    }
  }

  // ==========================================
  // RESOURCE TIMING
  // ==========================================

  private observeResources(): void {
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as PerformanceResourceTiming[]) {
          const duration = entry.responseEnd - entry.startTime;
          
          // Ignorar recursos pequeños
          if (duration < 50) continue;

          const resourceType = this.getResourceType(entry.initiatorType, entry.name);
          
          this.record(`resource_${resourceType}`, duration, 'ms', {
            url: entry.name.slice(0, 100),
            size: entry.transferSize?.toString() || '0',
          });
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.warn('[PerformanceMonitor] Resource timing not supported:', error);
    }
  }

  private getResourceType(initiatorType: string, name: string): string {
    if (name.includes('/api/') || name.includes('/functions/')) return 'api';
    if (initiatorType === 'script') return 'script';
    if (initiatorType === 'css' || initiatorType === 'link') return 'style';
    if (initiatorType === 'img') return 'image';
    if (initiatorType === 'fetch' || initiatorType === 'xmlhttprequest') return 'fetch';
    return 'other';
  }

  // ==========================================
  // LONG TASKS
  // ==========================================

  private observeLongTasks(): void {
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.record('long_task', entry.duration, 'ms', {
            name: entry.name,
          });
        }
      });
      longTaskObserver.observe({ type: 'longtask' });
    } catch (error) {
      // longtask might not be supported
    }
  }

  // ==========================================
  // ERRORS
  // ==========================================

  private observeErrors(): void {
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        context: { type: 'unhandledrejection' },
        timestamp: Date.now(),
        url: window.location.href,
      });
    });
  }

  // ==========================================
  // CUSTOM METRICS
  // ==========================================

  record(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    tags?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value: Math.round(value * 100) / 100,
      unit,
      timestamp: Date.now(),
      tags,
    });

    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.record(name, duration, 'ms', tags);
    }
  }

  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.record(name, duration, 'ms', tags);
    }
  }

  // ==========================================
  // ERROR REPORTING
  // ==========================================

  reportError(error: ErrorReport): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[PerformanceMonitor] Error:', error);
    }

    // In production, could send to monitoring service
    // For now, just log
    this.record('error', 1, 'count', {
      message: error.message.slice(0, 100),
    });
  }

  // ==========================================
  // FLUSH
  // ==========================================

  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToLog = [...this.metrics];
    this.metrics = [];

    // In development, log summary
    if (import.meta.env.DEV) {
      const summary = this.summarizeMetrics(metricsToLog);
      if (Object.keys(summary).length > 0) {
        console.log('[PerformanceMonitor] Metrics:', summary);
      }
    }

    // In production, could send to analytics service
  }

  private summarizeMetrics(metrics: PerformanceMetric[]): Record<string, any> {
    const summary: Record<string, { values: number[] }> = {};

    for (const metric of metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [] };
      }
      summary[metric.name].values.push(metric.value);
    }

    const result: Record<string, any> = {};
    for (const [name, data] of Object.entries(summary)) {
      const values = data.values;
      result[name] = {
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return result;
  }

  // ==========================================
  // REPORTING
  // ==========================================

  getMetricsSummary(): Record<string, {
    avg: number;
    min: number;
    max: number;
    count: number;
  }> {
    return this.summarizeMetrics(this.metrics);
  }

  getWebVitals(): Record<string, number> {
    const vitals: Record<string, number> = {};
    
    for (const metric of this.metrics) {
      if (['LCP', 'FID', 'CLS', 'TTFB'].includes(metric.name)) {
        vitals[metric.name] = metric.value;
      }
    }

    return vitals;
  }
}

export const PerformanceMonitor = new PerformanceMonitorClass();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  PerformanceMonitor.init();
}
