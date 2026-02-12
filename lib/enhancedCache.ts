/**
 * Enhanced Client-Side Cache
 * Aggressive caching with stale-while-revalidate strategy
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

class EnhancedCache {
  private storage: Storage;

  constructor() {
    this.storage = typeof window !== 'undefined' ? localStorage : ({} as Storage);
  }

  /**
   * Get cached data
   * Returns stale data immediately, triggers background refresh if needed
   */
  get<T>(key: string, staleTime: number = 5 * 60 * 1000): T | null {
    try {
      const cached = this.storage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      // Return data even if stale (stale-while-revalidate)
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Check if cache is stale and needs refresh
   */
  isStale(key: string, staleTime: number = 5 * 60 * 1000): boolean {
    try {
      const cached = this.storage.getItem(key);
      if (!cached) return true;

      const entry: CacheEntry<any> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      return age > staleTime;
    } catch {
      return true;
    }
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, staleTime: number = 5 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        staleTime,
      };
      this.storage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // Storage full or disabled - fail silently
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Clear specific cache key
   */
  clear(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {}
  }

  /**
   * Clear all cache with prefix
   */
  clearPrefix(prefix: string): void {
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          this.storage.removeItem(key);
        }
      });
    } catch {}
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    try {
      const keys = Object.keys(this.storage);
      const now = Date.now();

      keys.forEach(key => {
        try {
          const cached = this.storage.getItem(key);
          if (!cached) return;

          const entry: CacheEntry<any> = JSON.parse(cached);
          const age = now - entry.timestamp;

          // Clear if older than 1 hour
          if (age > 60 * 60 * 1000) {
            this.storage.removeItem(key);
          }
        } catch {}
      });
    } catch {}
  }
}

export const enhancedCache = new EnhancedCache();

// Clear expired cache on load
if (typeof window !== 'undefined') {
  enhancedCache.clearExpired();
}
