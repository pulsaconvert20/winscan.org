/**
 * Response Transformers
 */

/**
 * Transform API response to standard format
 */
export function transformApiResponse<T>(data: T, cached: boolean = false): any {
  return {
    data,
    meta: {
      cached,
      timestamp: Date.now(),
      source: 'api'
    }
  };
}

/**
 * Transform error to standard format
 */
export function transformError(error: any): any {
  return {
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An error occurred',
      details: error.details
    },
    status: error.status || 500,
    timestamp: new Date().toISOString()
  };
}
