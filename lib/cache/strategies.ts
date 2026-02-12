/**
 * Cache Strategies
 * 
 * Different caching strategies for various use cases.
 */

import { CacheConfig } from './types';

/**
 * Short-lived cache for frequently changing data
 */
export const SHORT_CACHE: CacheConfig = {
  ttl: 30 * 1000, // 30 seconds
  staleWhileRevalidate: 60 * 1000 // 1 minute
};

/**
 * Medium-lived cache for moderately changing data
 */
export const MEDIUM_CACHE: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: 10 * 60 * 1000 // 10 minutes
};

/**
 * Long-lived cache for rarely changing data
 */
export const LONG_CACHE: CacheConfig = {
  ttl: 60 * 60 * 1000, // 1 hour
  staleWhileRevalidate: 2 * 60 * 60 * 1000 // 2 hours
};

/**
 * Static cache for data that never changes
 */
export const STATIC_CACHE: CacheConfig = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  staleWhileRevalidate: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Get cache config for API routes
 */
export function getRouteCacheConfig(route: string): CacheConfig {
  // Validators change frequently
  if (route.includes('/validators')) {
    return SHORT_CACHE;
  }

  // Blocks change very frequently
  if (route.includes('/blocks') || route.includes('/transactions')) {
    return SHORT_CACHE;
  }

  // Proposals change moderately
  if (route.includes('/proposals')) {
    return MEDIUM_CACHE;
  }

  // Chain info is relatively static
  if (route.includes('/chains') || route.includes('/parameters')) {
    return LONG_CACHE;
  }

  // Default to medium cache
  return MEDIUM_CACHE;
}
