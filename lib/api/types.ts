/**
 * API Client Types
 * 
 * Type definitions for the unified API client.
 */

export interface ApiClientConfig {
  baseUrls: string[];
  timeout: number;
  retries: number;
  loadBalancing: boolean;
}

export interface RequestOptions {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: CacheOptions;
  signal?: AbortSignal;
}

export interface CacheOptions {
  ttl: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
  context?: ErrorContext;
}

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  params?: Record<string, any>;
  chain?: string;
  attempt?: number;
  url?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  cached: boolean;
  timestamp: number;
  source: string;
  duration?: number;
}
