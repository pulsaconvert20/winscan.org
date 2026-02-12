/**
 * Route Handler Factory
 * 
 * Generate standardized API route handlers with common patterns.
 * Features:
 * - Automatic parameter validation
 * - Consistent error responses
 * - Automatic cache header application
 * - Request logging
 * - Error logging with context
 */

import { NextRequest, NextResponse } from 'next/server';
import { RouteConfig, NextApiHandler } from './types';
import { validateParams } from './validators';
import { logRequest, applyCacheHeaders } from './middleware';
import { errorHandler } from '../errors/handler';

/**
 * Create a standardized route handler
 * 
 * @param config - Route configuration
 * @returns Next.js API handler function
 * 
 * @example
 * ```typescript
 * export const GET = createRoute({
 *   requiredParams: ['chain'],
 *   optionalParams: ['limit'],
 *   cacheConfig: { ttl: 60000, staleWhileRevalidate: 120000 },
 *   handler: async ({ chain, limit }) => {
 *     return await apiClient.get(`/validators`, { params: { chain, limit } });
 *   }
 * });
 * ```
 */
export function createRoute<T = any>(config: RouteConfig<T>): NextApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const searchParams = request.nextUrl.searchParams;

    try {
      // Validate parameters
      const validation = validateParams(
        searchParams,
        config.requiredParams,
        config.optionalParams
      );

      if (!validation.valid) {
        const error = errorHandler.handle(
          new Error(validation.errors?.join(', ') || 'Validation failed'),
          {
            endpoint: request.nextUrl.pathname,
            method: request.method,
            params: Object.fromEntries(searchParams.entries())
          }
        );
        error.status = 400;
        error.code = 'VALIDATION_ERROR';

        errorHandler.log(error);
        logRequest(request, validation.params || {}, startTime, 400);

        return errorHandler.toResponse(error);
      }

      // Execute handler
      let data = await config.handler(validation.params as T, request);

      // Transform data if transformer provided
      if (config.transform) {
        data = config.transform(data);
      }

      // Apply cache headers
      const headers = config.cacheConfig
        ? applyCacheHeaders(config.cacheConfig.ttl, config.cacheConfig.staleWhileRevalidate)
        : applyCacheHeaders(0);

      // Log successful request
      logRequest(request, validation.params!, startTime, 200);

      return NextResponse.json(data, { headers });

    } catch (error: any) {
      // Handle error
      const apiError = errorHandler.handle(error, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        params: Object.fromEntries(searchParams.entries())
      });

      errorHandler.log(apiError);
      logRequest(request, Object.fromEntries(searchParams.entries()), startTime, apiError.status);

      return errorHandler.toResponse(apiError);
    }
  };
}

/**
 * Create a simple GET route handler
 * 
 * @param handler - Handler function
 * @param cacheConfig - Optional cache configuration
 * @returns Next.js API handler function
 */
export function createGetRoute<T = any>(
  handler: (params: T, request: NextRequest) => Promise<any>,
  cacheConfig?: RouteConfig<T>['cacheConfig']
): NextApiHandler {
  return createRoute({
    requiredParams: [],
    handler,
    cacheConfig
  });
}

/**
 * Create a POST route handler
 * 
 * @param handler - Handler function
 * @returns Next.js API handler function
 */
export function createPostRoute<T = any>(
  handler: (params: T, request: NextRequest) => Promise<any>
): NextApiHandler {
  return createRoute({
    requiredParams: [],
    handler
  });
}
