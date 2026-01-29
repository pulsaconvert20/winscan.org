/**
 * Route Parameter Validators
 */

import { ValidationResult } from './types';

/**
 * Validate required and optional parameters
 */
export function validateParams(
  searchParams: URLSearchParams,
  requiredParams: string[],
  optionalParams: string[] = []
): ValidationResult {
  const errors: string[] = [];
  const params: Record<string, string> = {};

  // Check required parameters
  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (!value) {
      errors.push(`Missing required parameter: ${param}`);
    } else {
      params[param] = value;
    }
  }

  // Get optional parameters
  for (const param of optionalParams) {
    const value = searchParams.get(param);
    if (value) {
      params[param] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    params
  };
}

/**
 * Validate chain parameter
 */
export function validateChain(chain: string | null): boolean {
  if (!chain) return false;
  // Chain name should be alphanumeric with hyphens
  return /^[a-zA-Z0-9-]+$/.test(chain);
}

/**
 * Validate numeric parameter
 */
export function validateNumeric(value: string | null): boolean {
  if (!value) return false;
  return /^\d+$/.test(value);
}

/**
 * Validate address parameter
 */
export function validateAddress(address: string | null): boolean {
  if (!address) return false;
  // Basic validation - should start with a prefix and contain alphanumeric characters
  return /^[a-z]+1[a-z0-9]{38,}$/.test(address);
}
