/**
 * Client-side Cache System
 * Provides in-memory and localStorage caching for API responses
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
  staleUntil: number;
}

interface CacheOptions {
  ttl?: number;        // Time to live in seconds
  staleTime?: number;  // Time to serve stale content while revalidating
  storage?: 'memory' | 'local' | 'session';
}

class ClientCacheClass {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly DEFAULT_STALE_TIME = 60; // 1 minute

  // ==========================================
  // BASIC OPERATIONS
  // ==========================================

  get<T>(key: string, options: CacheOptions = {}): T | null {
    const storage = options.storage || 'memory';
    const entry = this.getEntry<T>(key, storage);

    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now > entry.staleUntil) {
      this.delete(key, storage);
      return null;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const storage = options.storage || 'memory';
    const ttl = (options.ttl || this.DEFAULT_TTL) * 1000;
    const staleTime = (options.staleTime || this.DEFAULT_STALE_TIME) * 1000;

    const entry: CacheEntry<T> = {
      value,
      expires: Date.now() + ttl,
      staleUntil: Date.now() + ttl + staleTime,
    };

    this.setEntry(key, entry, storage);
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const storage = options.storage || 'memory';
    const entry = this.getEntry<T>(key, storage);
    const now = Date.now();

    if (entry) {
      // Fresh data
      if (now < entry.expires) {
        return entry.value;
      }

      // Stale data - return but revalidate in background
      if (now < entry.staleUntil) {
        this.revalidate(key, fetcher, options);
        return entry.value;
      }
    }

    // No cache or fully expired - fetch fresh
    const value = await fetcher();
    this.set(key, value, options);
    return value;
  }

  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const value = await fetcher();
      this.set(key, value, options);
    } catch (error) {
      console.warn(`[ClientCache] Revalidation failed for key: ${key}`, error);
    }
  }

  delete(key: string, storage: 'memory' | 'local' | 'session' = 'memory'): void {
    switch (storage) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'local':
        try {
          localStorage.removeItem(`cache:${key}`);
        } catch {}
        break;
      case 'session':
        try {
          sessionStorage.removeItem(`cache:${key}`);
        } catch {}
        break;
    }
  }

  clear(storage?: 'memory' | 'local' | 'session'): void {
    if (!storage || storage === 'memory') {
      this.memoryCache.clear();
    }

    if (!storage || storage === 'local') {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
        keys.forEach(k => localStorage.removeItem(k));
      } catch {}
    }

    if (!storage || storage === 'session') {
      try {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'));
        keys.forEach(k => sessionStorage.removeItem(k));
      } catch {}
    }
  }

  // ==========================================
  // PATTERN-BASED OPERATIONS
  // ==========================================

  deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Local storage
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cache:') && regex.test(key.slice(6))) {
          localStorage.removeItem(key);
          count++;
        }
      }
    } catch {}

    return count;
  }

  // ==========================================
  // INTERNAL HELPERS
  // ==========================================

  private getEntry<T>(
    key: string,
    storage: 'memory' | 'local' | 'session'
  ): CacheEntry<T> | null {
    switch (storage) {
      case 'memory':
        return this.memoryCache.get(key) || null;

      case 'local':
        try {
          const data = localStorage.getItem(`cache:${key}`);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }

      case 'session':
        try {
          const data = sessionStorage.getItem(`cache:${key}`);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
    }
  }

  private setEntry<T>(
    key: string,
    entry: CacheEntry<T>,
    storage: 'memory' | 'local' | 'session'
  ): void {
    switch (storage) {
      case 'memory':
        this.memoryCache.set(key, entry);
        break;

      case 'local':
        try {
          localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        } catch (error) {
          // Storage full - clear old entries
          this.evictOldEntries('local');
          try {
            localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
          } catch {}
        }
        break;

      case 'session':
        try {
          sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        } catch (error) {
          this.evictOldEntries('session');
          try {
            sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
          } catch {}
        }
        break;
    }
  }

  private evictOldEntries(storage: 'local' | 'session'): void {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    const entries: { key: string; expires: number }[] = [];

    try {
      for (const key of Object.keys(storageObj)) {
        if (key.startsWith('cache:')) {
          const data = JSON.parse(storageObj.getItem(key) || '{}');
          entries.push({ key, expires: data.expires || 0 });
        }
      }

      // Sort by expiration and remove oldest 20%
      entries.sort((a, b) => a.expires - b.expires);
      const toRemove = Math.ceil(entries.length * 0.2);
      
      for (let i = 0; i < toRemove; i++) {
        storageObj.removeItem(entries[i].key);
      }
    } catch {}
  }

  // ==========================================
  // STATS
  // ==========================================

  getStats(): {
    memorySize: number;
    localSize: number;
    sessionSize: number;
  } {
    let localSize = 0;
    let sessionSize = 0;

    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cache:')) localSize++;
      }
    } catch {}

    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('cache:')) sessionSize++;
      }
    } catch {}

    return {
      memorySize: this.memoryCache.size,
      localSize,
      sessionSize,
    };
  }
}

export const ClientCache = new ClientCacheClass();

// ==========================================
// CACHE KEY BUILDERS
// ==========================================

export const CacheKeys = {
  // User related
  user: (id: string) => `user:${id}`,
  userPreferences: (id: string) => `user:${id}:preferences`,
  
  // Organization related
  org: (id: string) => `org:${id}`,
  orgMembers: (id: string) => `org:${id}:members`,
  orgSettings: (id: string) => `org:${id}:settings`,
  
  // Matters/Assets
  matter: (id: string) => `matter:${id}`,
  mattersList: (orgId: string, filters: string) => `matters:${orgId}:${filters}`,
  mattersCount: (orgId: string) => `matters:${orgId}:count`,
  
  // Dashboard
  dashboard: (orgId: string) => `dashboard:${orgId}`,
  dashboardStats: (orgId: string) => `dashboard:${orgId}:stats`,
  
  // Search
  searchResults: (query: string) => `search:${btoa(query).slice(0, 50)}`,
};
