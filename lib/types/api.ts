/**
 * API Type Definitions
 */

import { ApiError } from '../errors/types';

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

export type { ApiError };

