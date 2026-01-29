/**
 * Parameter Validators
 */

/**
 * Validate required parameters exist
 */
export function validateRequired(params: Record<string, any>, required: string[]): string[] {
  const missing: string[] = [];
  
  for (const param of required) {
    if (!(param in params) || params[param] === null || params[param] === undefined) {
      missing.push(param);
    }
  }
  
  return missing;
}

/**
 * Validate parameter types
 */
export function validateTypes(
  params: Record<string, any>,
  types: Record<string, 'string' | 'number' | 'boolean'>
): string[] {
  const errors: string[] = [];
  
  for (const [param, expectedType] of Object.entries(types)) {
    if (param in params) {
      const actualType = typeof params[param];
      if (actualType !== expectedType) {
        errors.push(`Parameter '${param}' should be ${expectedType}, got ${actualType}`);
      }
    }
  }
  
  return errors;
}
