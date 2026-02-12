/**
 * Unified API Client
 * 
 * Single source of truth for all HTTP requests to blockchain APIs.
 * Features:
 * - Automatic retry with exponential backoff
 * - Load balancing across multiple URLs
 * - Configurable timeouts
 * - Consistent error handling
 * - Request/response interceptors
 */

import { ApiClientConfig, RequestOptions, ApiError, ErrorContext } from './types';
import { DEFAULT_CONFIG, RETRY_DELAYS, RETRYABLE_STATUS_CODES, RETRYABLE_ERROR_CODES } from './config';
import { cacheManager } from '../cache/manager';

export class ApiClient {
  private config: ApiClientConfig;
  private currentUrlIndex: number = 0;
  private failureCount: number = 0;
  private readonly MAX_FAILURES = 3;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make a GET request
   * 
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Promise with response data
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Make a GET request with caching
   * 
   * @param key - Cache key
   * @param fetcher - Function to fetch data
   * @param ttl - Time to live in milliseconds
   * @returns Promise with response data
   */
  async withCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    return cacheManager.wrap(key, fetcher, ttl);
  }

  /**
   * Make a POST request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise with response data
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * Make an HTTP request with retry logic and load balancing
   * 
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise with response data
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const maxRetries = options?.retries ?? this.config.retries;
    const timeout = options?.timeout ?? this.config.timeout;

    // Try all available URLs
    for (let urlIndex = 0; urlIndex < this.config.baseUrls.length; urlIndex++) {
      const baseUrl = this.getNextUrl();

      // Retry logic for each URL
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const context: ErrorContext = {
          endpoint,
          method,
          params: options?.params,
          attempt: attempt + 1,
          url: baseUrl
        };

        try {
          const response = await this.executeRequest<T>(
            method,
            baseUrl,
            endpoint,
            data,
            options,
            timeout
          );

          // Success - reset failure count
          this.failureCount = 0;
          return response;

        } catch (error: any) {
          this.failureCount++;

          const isRetryable = this.isRetryableError(error);
          const isLastAttempt = attempt === maxRetries;
          const isLastUrl = urlIndex === this.config.baseUrls.length - 1;

          // Log the error
          console.warn(
            `[API Client] Request failed (attempt ${attempt + 1}/${maxRetries + 1} on ${baseUrl}):`,
            error.message
          );

          // If this is not retryable or it's the last attempt on the last URL, throw
          if (!isRetryable || (isLastAttempt && isLastUrl)) {
            throw this.createApiError(error, context);
          }

          // Wait before retrying (exponential backoff)
          if (!isLastAttempt) {
            const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
            await this.sleep(delay);
          }
        }
      }
    }

    throw this.createApiError(
      new Error('All API endpoints failed'),
      { endpoint, method, params: options?.params }
    );
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    method: string,
    baseUrl: string,
    endpoint: string,
    data: any,
    options: RequestOptions | undefined,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Build URL with query parameters
      const url = this.buildUrl(baseUrl, endpoint, options?.params);

      // Build request options
      const fetchOptions: RequestInit = {
        method,
        signal: options?.signal || controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers
        },
        cache: 'no-store',
        mode: 'cors'
      };

      // Add body for POST requests
      if (method === 'POST' && data) {
        fetchOptions.body = JSON.stringify(data);
      }

      // Make the request
      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const responseData = await response.json();
      return responseData as T;

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle abort errors
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string {
    // Remove trailing slash from baseUrl and leading slash from endpoint
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    let url = `${cleanBaseUrl}/${cleanEndpoint}`;

    // Add query parameters
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Get next URL for load balancing
   */
  private getNextUrl(): string {
    if (this.config.loadBalancing && this.failureCount >= this.MAX_FAILURES) {
      this.currentUrlIndex = (this.currentUrlIndex + 1) % this.config.baseUrls.length;
      this.failureCount = 0;
      console.log(`[API Client] Switching to URL: ${this.config.baseUrls[this.currentUrlIndex]}`);
    }

    return this.config.baseUrls[this.currentUrlIndex];
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Check for retryable HTTP status codes
    if (error.message && /HTTP (\d+):/.test(error.message)) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        if (RETRYABLE_STATUS_CODES.includes(status)) {
          return true;
        }
      }
    }

    // Check for retryable error codes
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }

    // Check for timeout errors
    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Create a standardized API error
   */
  private createApiError(error: any, context: ErrorContext): ApiError {
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = error.message || 'An unknown error occurred';

    // Extract status code from error message
    if (error.message && /HTTP (\d+):/.test(error.message)) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      if (statusMatch) {
        status = parseInt(statusMatch[1]);
        code = status >= 400 && status < 500 ? 'CLIENT_ERROR' : 'SERVER_ERROR';
      }
    }

    // Handle timeout errors
    if (error.message && error.message.includes('timeout')) {
      status = 408;
      code = 'TIMEOUT';
    }

    // Handle network errors
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      status = 503;
      code = 'NETWORK_ERROR';
    }

    return {
      code,
      message,
      status,
      details: error.details,
      context
    };
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export factory function for creating custom instances
export function createApiClient(config?: Partial<ApiClientConfig>): ApiClient {
  return new ApiClient(config);
}
