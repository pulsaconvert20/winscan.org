/**
 * Cache Types
 * 
 * Type definitions for caching system.
 */

export interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export enum CacheStrategy {
  MEMORY = 'MEMORY',
  INDEXED_DB = 'INDEXED_DB',
  HYBRID = 'HYBRID'
}
