/**
 * Error Types
 * 
 * Type definitions for error handling.
 */

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
  context?: ErrorContext;
  timestamp?: string;
}

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  params?: Record<string, any>;
  chain?: string;
  userId?: string;
  attempt?: number;
  url?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
  timestamp: string;
  path?: string;
}

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn';
  code: string;
  message: string;
  context: ErrorContext;
  stack?: string;
  duration?: number;
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  API = 'API',
  CACHE = 'CACHE',
  INTERNAL = 'INTERNAL'
}

export const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /\/home\//,
  /\/users\//,
  /\/root\//,
  /C:\\Users\\/,
  /D:\\APLIKASI\\/
];
