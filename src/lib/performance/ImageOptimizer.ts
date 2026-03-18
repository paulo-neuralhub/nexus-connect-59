/**
 * Client-side Image Optimization Utilities
 * For lazy loading, responsive images, and format detection
 */

// ==========================================
// IMAGE VARIANTS
// ==========================================

export const IMAGE_BREAKPOINTS = [320, 640, 768, 1024, 1280, 1536, 1920];

export interface ImageVariant {
  width: number;
  suffix: string;
}

export const IMAGE_VARIANTS: ImageVariant[] = [
  { width: 80, suffix: 'thumb' },
  { width: 320, suffix: 'sm' },
  { width: 640, suffix: 'md' },
  { width: 1280, suffix: 'lg' },
  { width: 1920, suffix: 'xl' },
];

// ==========================================
// FORMAT DETECTION
// ==========================================

export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

export function supportsAvif(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check via CSS
  return CSS.supports('image-rendering', 'crisp-edges');
}

export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (supportsAvif()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}

// ==========================================
// RESPONSIVE IMAGE HELPERS
// ==========================================

export function getResponsiveUrl(baseUrl: string, width: number): string {
  // Find the appropriate variant
  const variant = IMAGE_VARIANTS.find(v => v.width >= width) 
    || IMAGE_VARIANTS[IMAGE_VARIANTS.length - 1];
  
  // Replace extension with variant suffix
  return baseUrl.replace(/\.(webp|jpg|jpeg|png)$/i, `-${variant.suffix}.webp`);
}

export function generateSrcSet(baseUrl: string): string {
  return IMAGE_VARIANTS
    .map(v => {
      const url = baseUrl.replace(/\.(webp|jpg|jpeg|png)$/i, `-${v.suffix}.webp`);
      return `${url} ${v.width}w`;
    })
    .join(', ');
}

export function generateSizes(config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default: string;
}): string {
  const parts: string[] = [];
  
  if (config.mobile) {
    parts.push(`(max-width: 640px) ${config.mobile}`);
  }
  if (config.tablet) {
    parts.push(`(max-width: 1024px) ${config.tablet}`);
  }
  if (config.desktop) {
    parts.push(`(min-width: 1025px) ${config.desktop}`);
  }
  
  parts.push(config.default);
  
  return parts.join(', ');
}

// ==========================================
// LAZY LOADING
// ==========================================

export function createLazyImageObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '200px',
      threshold: 0.1,
      ...options,
    }
  );
}

// ==========================================
// BLUR PLACEHOLDER
// ==========================================

export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10
): string {
  // Create a small SVG blur placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="blur" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="2" edgeMode="duplicate"/>
      </filter>
      <rect width="${width}" height="${height}" fill="hsl(var(--muted))" filter="url(#blur)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ==========================================
// IMAGE PRELOADING
// ==========================================

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

// ==========================================
// SUPABASE STORAGE HELPER
// ==========================================

export function getSupabaseImageUrl(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'origin' | 'webp';
  }
): string {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  
  if (!options) return baseUrl;

  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
