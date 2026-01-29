/**
 * Error Handler
 * 
 * Centralized error handling, categorization, and formatting.
 * Features:
 * - Error categorization
 * - Error sanitization
 * - Consistent error formatting
 * - Structured logging
 */

import { NextResponse } from 'next/server';
import { ApiError, ErrorContext, ErrorResponse, ErrorLog, ErrorCategory, SENSITIVE_PATTERNS } from './types';

export class ErrorHandler {
  /**
   * Handle an error and convert it to ApiError
   */
  handle(error: unknown, context?: ErrorContext): ApiError {
    const timestamp = new Date().toISOString();

    // If it's already an ApiError, return it
    if (this.isApiError(error)) {
      return { ...error, context: { ...error.context, ...context }, timestamp };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return this.handleStandardError(error, context, timestamp);
    }

    // Handle unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      status: 500,
      context,
      timestamp
    };
  }

  /**
   * Log an error with structured format
   */
  log(error: ApiError): void {
    const log: ErrorLog = {
      timestamp: error.timestamp || new Date().toISOString(),
      level: error.status >= 500 ? 'error' : 'warn',
      code: error.code,
      message: error.message,
      context: error.context || {},
      stack: error.details?.stack
    };

    // Log to console with appropriate level
    if (log.level === 'error') {
      console.error('[Error Handler]', JSON.stringify(log, null, 2));
    } else {
      console.warn('[Error Handler]', JSON.stringify(log, null, 2));
    }
  }

  /**
   * Convert ApiError to NextResponse
   */
  toResponse(error: ApiError): NextResponse {
    const sanitizedMessage = this.sanitizeMessage(error.message);
    
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: sanitizedMessage,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined
      },
      status: error.status,
      timestamp: error.timestamp || new Date().toISOString(),
      path: error.context?.endpoint
    };

    return NextResponse.json(response, { status: error.status });
  }

  /**
   * Categorize an error
   */
  categorize(error: any): ErrorCategory {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toUpperCase() || '';

    // Network errors
    if (
      code.includes('ECONNRESET') ||
      code.includes('ECONNREFUSED') ||
      code.includes('ETIMEDOUT') ||
      code.includes('ENOTFOUND') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection')
    ) {
      return ErrorCategory.NETWORK;
    }

    // Validation errors
    if (
      message.includes('required') ||
      message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('missing parameter')
    ) {
      return ErrorCategory.VALIDATION;
    }

    // API errors
    if (
      message.includes('http') ||
      message.includes('api') ||
      message.includes('endpoint')
    ) {
      return ErrorCategory.API;
    }

    // Cache errors
    if (
      message.includes('cache') ||
      message.includes('redis') ||
      message.includes('storage')
    ) {
      return ErrorCategory.CACHE;
    }

    // Default to internal error
    return ErrorCategory.INTERNAL;
  }

  /**
   * Determine HTTP status code from error
   */
  getStatusCode(error: any, category: ErrorCategory): number {
    // Check if error message contains HTTP status
    if (error.message && /HTTP (\d+):/.test(error.message)) {
      const match = error.message.match(/HTTP (\d+):/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Determine status based on category
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.NETWORK:
        return 503;
      case ErrorCategory.API:
        return 502;
      case ErrorCategory.CACHE:
        return 500;
      case ErrorCategory.INTERNAL:
      default:
        return 500;
    }
  }

  /**
   * Sanitize error message to remove sensitive information
   */
  sanitizeMessage(message: string): string {
    let sanitized = message;

    // Remove sensitive patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Remove file paths
    sanitized = sanitized.replace(/[A-Z]:\\[\w\\]+/g, '[PATH]');
    sanitized = sanitized.replace(/\/[\w\/]+/g, '[PATH]');

    // Remove potential API keys or tokens (long alphanumeric strings)
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[TOKEN]');

    return sanitized;
  }

  /**
   * Check if error is already an ApiError
   */
  private isApiError(error: any): error is ApiError {
    return (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      'status' in error
    );
  }

  /**
   * Handle standard Error objects
   */
  private handleStandardError(error: Error, context?: ErrorContext, timestamp?: string): ApiError {
    const category = this.categorize(error);
    const status = this.getStatusCode(error, category);
    
    let code: string = category;
    
    // More specific codes based on message
    if (error.message.includes('timeout')) {
      code = 'NETWORK_TIMEOUT';
    } else if (error.message.includes('not found')) {
      code = 'API_NOT_FOUND';
    } else if (error.message.includes('unauthorized')) {
      code = 'API_UNAUTHORIZED';
    } else if (error.message.includes('forbidden')) {
      code = 'API_FORBIDDEN';
    }

    return {
      code,
      message: error.message,
      status,
      details: {
        name: error.name,
        stack: error.stack
      },
      context,
      timestamp
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export factory function
export function createErrorHandler(): ErrorHandler {
  return new ErrorHandler();
}
