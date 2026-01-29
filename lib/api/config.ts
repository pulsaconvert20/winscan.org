/**
 * API Client Configuration
 * 
 * Default configuration for the unified API client.
 */

import { ApiClientConfig } from './types';

export const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrls: [
    process.env.NEXT_PUBLIC_API_URL || 'https://ssl.winsnip.xyz',
    process.env.NEXT_PUBLIC_API_URL_FALLBACK || 'https://ssl2.winsnip.xyz'
  ],
  timeout: 15000, // 15 seconds
  retries: 2,
  loadBalancing: true
};

export const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff delays in ms

export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH'
];
