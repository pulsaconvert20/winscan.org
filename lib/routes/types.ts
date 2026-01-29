/**
 * Route Handler Types
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheConfig } from '../cache/types';

export interface RouteConfig<T = any> {
  requiredParams: string[];
  optionalParams?: string[];
  cacheConfig?: CacheConfig;
  handler: (params: T, request: NextRequest) => Promise<any>;
  transform?: (data: any) => any;
}

export type NextApiHandler = (request: NextRequest) => Promise<NextResponse>;

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  params?: Record<string, string>;
}
