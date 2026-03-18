import { lazy, Suspense, ComponentType, ReactNode, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// ==========================================
// LOADING FALLBACKS
// ==========================================

interface LoadingFallbackProps {
  height?: string;
  className?: string;
}

export function LoadingFallback({ height = '200px', className = '' }: LoadingFallbackProps) {
  return (
    <div 
      className={`flex items-center justify-center bg-muted/20 rounded-lg animate-pulse ${className}`}
      style={{ height }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin text-muted-foreground ${sizeClasses[size]}`} />
    </div>
  );
}

// ==========================================
// LAZY LOADING WRAPPER
// ==========================================

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  height?: string;
}

export function LazyWrapper({ children, fallback, height = '200px' }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback height={height} />}>
      {children}
    </Suspense>
  );
}

// ==========================================
// CREATE LAZY COMPONENT
// ==========================================

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallbackHeight?: string;
    preload?: boolean;
  } = {}
) {
  const LazyComponent = lazy(importFn);

  // Preload if specified
  if (options.preload && typeof window !== 'undefined') {
    preloadComponent(importFn);
  }

  // Return wrapped component
  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingFallback height={options.fallbackHeight || '200px'} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `Lazy(${LazyComponent.name || 'Component'})`;
  WrappedComponent.preload = () => preloadComponent(importFn);

  return WrappedComponent;
}

// ==========================================
// PRELOAD UTILITIES
// ==========================================

export function preloadComponent(importFn: () => Promise<any>): void {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback for non-critical preloading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFn(), { timeout: 2000 });
  } else {
    // Fallback to setTimeout
    setTimeout(() => importFn(), 200);
  }
}

export function preloadOnHover(importFn: () => Promise<any>) {
  let preloaded = false;

  return {
    onMouseEnter: () => {
      if (!preloaded) {
        preloaded = true;
        importFn();
      }
    },
    onFocus: () => {
      if (!preloaded) {
        preloaded = true;
        importFn();
      }
    },
  };
}

// ==========================================
// INTERSECTION OBSERVER LAZY LOAD
// ==========================================

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  onVisible?: () => void;
}

export function LazyLoad({
  children,
  placeholder = <LoadingFallback />,
  rootMargin = '200px',
  threshold = 0,
  onVisible,
}: LazyLoadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, onVisible]);

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  );
}

// ==========================================
// DEFERRED RENDER
// ==========================================

interface DeferredRenderProps {
  children: ReactNode;
  delay?: number;
}

export function DeferredRender({ children, delay = 0 }: DeferredRenderProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return shouldRender ? <>{children}</> : null;
}

// ==========================================
// PROGRESSIVE HYDRATION
// ==========================================

interface ProgressiveHydrationProps {
  children: ReactNode;
  priority?: 'high' | 'normal' | 'low';
}

export function ProgressiveHydration({ 
  children, 
  priority = 'normal' 
}: ProgressiveHydrationProps) {
  const [hydrated, setHydrated] = useState(priority === 'high');

  useEffect(() => {
    if (priority === 'high') return;

    const delay = priority === 'normal' ? 0 : 100;

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setHydrated(true), { timeout: 1000 + delay });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setHydrated(true), delay);
      return () => clearTimeout(timer);
    }
  }, [priority]);

  if (!hydrated) {
    return <div className="animate-pulse">{children}</div>;
  }

  return <>{children}</>;
}
