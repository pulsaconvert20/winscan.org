/**
 * Route Middleware
 */

import { NextRequest } from 'next/server';

export interface RequestLog {
  timestamp: string;
  method: string;
  endpoint: string;
  params: Record<string, string>;
  duration?: number;
  status?: number;
}

/**
 * Log request details
 */
export function logRequest(
  request: NextRequest,
  params: Record<string, string>,
  startTime: number,
  status: number
): void {
  const duration = Date.now() - startTime;
  const endpoint = request.nextUrl.pathname;

  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: request.method,
    endpoint,
    params,
    duration,
    status
  };

  console.log('[Route Handler]', JSON.stringify(log));
}

/**
 * Apply cache headers to response
 */
export function applyCacheHeaders(ttl: number, staleWhileRevalidate?: number): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (ttl > 0) {
    const swr = staleWhileRevalidate || ttl * 2;
    headers['Cache-Control'] = `public, s-maxage=${Math.floor(ttl / 1000)}, stale-while-revalidate=${Math.floor(swr / 1000)}`;
  } else {
    headers['Cache-Control'] = 'no-store';
  }

  return headers;
}
