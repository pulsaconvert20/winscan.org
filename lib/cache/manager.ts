/**
 * Cache Manager
 * 
 * Centralized caching with multiple strategies.
 * Features:
 * - In-memory caching
 * - TTL support
 * - Stale-while-revalidate
 * - Pattern-based invalidation
 * - Tag-based invalidation
 */

import { CacheConfig, CacheEntry, CacheStats } from './types';

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private refreshCallbacks: Map<string, Promise<any>>;

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    };
    this.refreshCallbacks = new Map();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry is fresh
    if (age < entry.ttl) {
      this.stats.hits++;
      this.updateHitRate();
      return entry.data as T;
    }

    // Check if entry is in stale-while-revalidate window
    if (entry.staleWhileRevalidate && age < entry.ttl + entry.staleWhileRevalidate) {
      this.stats.hits++;
      this.updateHitRate();
      // Return stale data but mark for refresh
      return entry.data as T;
    }

    // Entry is expired
    this.cache.delete(key);
    this.stats.misses++;
    this.stats.size = this.cache.size;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number, config?: Partial<CacheConfig>): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      staleWhileRevalidate: config?.staleWhileRevalidate,
      tags: config?.tags
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;

    console.log(`[Cache Manager] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;

    console.log(`[Cache Manager] Invalidated ${keysToDelete.length} entries with tag: ${tag}`);
  }

  /**
   * Wrap a fetcher function with caching
   */
  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      // Check if we need to refresh in background
      const entry = this.cache.get(key);
      if (entry) {
        const age = Date.now() - entry.timestamp;
        const isStale = age >= entry.ttl;
        const isInRevalidateWindow = entry.staleWhileRevalidate && 
          age < entry.ttl + entry.staleWhileRevalidate;

        if (isStale && isInRevalidateWindow) {
          // Trigger background refresh
          this.refreshInBackground(key, fetcher, ttl, config);
        }
      }

      return cached;
    }

    // Not in cache, fetch and cache
    const data = await fetcher();
    await this.set(key, data, ttl, config);
    return data;
  }

  /**
   * Refresh cache entry in background
   */
  private refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    config?: Partial<CacheConfig>
  ): void {
    // Prevent multiple simultaneous refreshes
    if (this.refreshCallbacks.has(key)) {
      return;
    }

    const refreshPromise = fetcher()
      .then(data => {
        this.set(key, data, ttl, config);
        this.refreshCallbacks.delete(key);
      })
      .catch(error => {
        console.error(`[Cache Manager] Background refresh failed for key: ${key}`, error);
        this.refreshCallbacks.delete(key);
      });

    this.refreshCallbacks.set(key, refreshPromise);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
    console.log('[Cache Manager] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export factory function
export function createCacheManager(): CacheManager {
  return new CacheManager();
}
