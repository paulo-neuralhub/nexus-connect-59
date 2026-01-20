import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { 
  generateBlurPlaceholder, 
  createLazyImageObserver,
  generateSrcSet,
  generateSizes,
} from '@/lib/performance/ImageOptimizer';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  sizes,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading observer
  useEffect(() => {
    if (priority || shouldLoad) return;

    const observer = createLazyImageObserver((entry) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer?.unobserve(entry.target);
      }
    });

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      // Fallback if IntersectionObserver not available
      setShouldLoad(true);
    }
  }, [priority, shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  const placeholderSrc = blurDataURL || (placeholder === 'blur' 
    ? generateBlurPlaceholder(width || 10, height || 10)
    : undefined
  );

  const containerClasses = cn(
    'relative overflow-hidden',
    fill && 'w-full h-full',
    className
  );

  const imageClasses = cn(
    'transition-opacity duration-300',
    fill && 'absolute inset-0 w-full h-full object-cover',
    !isLoaded && 'opacity-0',
    isLoaded && 'opacity-100'
  );

  const containerStyle = !fill && width && height 
    ? { aspectRatio: `${width}/${height}` }
    : undefined;

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={placeholderSrc ? {
            backgroundImage: `url(${placeholderSrc})`,
            backgroundSize: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          } : undefined}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}

      {/* Main image */}
      {shouldLoad && !isError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          srcSet={generateSrcSet(src)}
          sizes={sizes || generateSizes({
            mobile: '100vw',
            tablet: '50vw',
            default: '33vw',
          })}
          onLoad={handleLoad}
          onError={handleError}
          className={imageClasses}
          {...props}
        />
      )}
    </div>
  );
}

// ==========================================
// AVATAR WITH OPTIMIZATION
// ==========================================

interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}: OptimizedAvatarProps) {
  const [isError, setIsError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const fallbackText = fallback || alt.slice(0, 2).toUpperCase();

  if (!src || isError) {
    return (
      <div 
        className={cn(
          'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <div className={cn('rounded-full overflow-hidden', sizeClasses[size], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        placeholder="empty"
        onError={() => setIsError(true)}
      />
    </div>
  );
}
