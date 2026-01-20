/**
 * Health Check Service
 * Provides health status information for the application
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  lastChecked: string;
}

// Application start time for uptime calculation
const startTime = Date.now();

// Version from package.json or environment
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Check Supabase connectivity
 */
async function checkSupabase(): Promise<HealthCheck> {
  const start = performance.now();
  const name = 'supabase';
  
  try {
    // Import dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Simple health check query
    const { error } = await supabase.from('organizations').select('id').limit(1);
    
    const responseTime = Math.round(performance.now() - start);
    
    if (error) {
      return {
        name,
        status: 'warn',
        message: `Database query warning: ${error.message}`,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check browser capabilities
 */
function checkBrowser(): HealthCheck {
  const name = 'browser';
  const issues: string[] = [];
  
  // Check essential browser features
  if (!window.fetch) {
    issues.push('Fetch API not supported');
  }
  
  if (!window.localStorage) {
    issues.push('LocalStorage not available');
  }
  
  if (!window.indexedDB) {
    issues.push('IndexedDB not available');
  }
  
  if (!('serviceWorker' in navigator)) {
    issues.push('Service Worker not supported');
  }
  
  if (issues.length > 0) {
    return {
      name,
      status: 'warn',
      message: `Browser limitations: ${issues.join(', ')}`,
      lastChecked: new Date().toISOString(),
    };
  }
  
  return {
    name,
    status: 'pass',
    message: 'All browser features available',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const name = 'memory';
  
  // @ts-ignore - performance.memory is non-standard but available in Chrome
  if (performance.memory) {
    // @ts-ignore
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usagePercent = Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100);
    
    if (usagePercent > 90) {
      return {
        name,
        status: 'fail',
        message: `Memory usage critical: ${usagePercent}%`,
        lastChecked: new Date().toISOString(),
      };
    }
    
    if (usagePercent > 70) {
      return {
        name,
        status: 'warn',
        message: `Memory usage high: ${usagePercent}%`,
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: 'pass',
      message: `Memory usage: ${usagePercent}% (${Math.round(usedJSHeapSize / 1024 / 1024)}MB)`,
      lastChecked: new Date().toISOString(),
    };
  }
  
  return {
    name,
    status: 'pass',
    message: 'Memory metrics not available',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check network connectivity
 */
function checkNetwork(): HealthCheck {
  const name = 'network';
  
  if (!navigator.onLine) {
    return {
      name,
      status: 'fail',
      message: 'Browser reports offline',
      lastChecked: new Date().toISOString(),
    };
  }
  
  // @ts-ignore - navigator.connection is non-standard
  if (navigator.connection) {
    // @ts-ignore
    const { effectiveType, downlink, rtt } = navigator.connection;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        name,
        status: 'warn',
        message: `Slow connection detected: ${effectiveType}`,
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: 'pass',
      message: `Network: ${effectiveType}, ${downlink}Mbps, ${rtt}ms RTT`,
      lastChecked: new Date().toISOString(),
    };
  }
  
  return {
    name,
    status: 'pass',
    message: 'Network online',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check service worker status
 */
async function checkServiceWorker(): Promise<HealthCheck> {
  const name = 'serviceWorker';
  
  if (!('serviceWorker' in navigator)) {
    return {
      name,
      status: 'warn',
      message: 'Service Worker not supported',
      lastChecked: new Date().toISOString(),
    };
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return {
        name,
        status: 'warn',
        message: 'No Service Worker registered',
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: 'pass',
      message: `Service Worker active (scope: ${registration.scope})`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: `Service Worker check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Run all health checks
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkSupabase(),
    Promise.resolve(checkBrowser()),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkNetwork()),
    checkServiceWorker(),
  ]);
  
  // Determine overall status
  const hasFailure = checks.some(c => c.status === 'fail');
  const hasWarning = checks.some(c => c.status === 'warn');
  
  let status: HealthStatus['status'] = 'healthy';
  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: appVersion,
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks,
  };
}

/**
 * Quick liveness check (is the app running?)
 */
export function getLivenessStatus(): { status: 'alive'; timestamp: string } {
  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quick readiness check (is the app ready to serve traffic?)
 */
export async function getReadinessStatus(): Promise<{ status: 'ready' | 'not_ready'; timestamp: string; reason?: string }> {
  try {
    const supabaseCheck = await checkSupabase();
    
    if (supabaseCheck.status === 'fail') {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: supabaseCheck.message,
      };
    }
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
