/**
 * Cosmos Denomination Utilities
 */

/**
 * Format denomination with proper decimals
 * 
 * @param amount - Amount in base units
 * @param denom - Denomination symbol
 * @param exponent - Number of decimal places
 * @returns Formatted string
 */
export function formatDenom(amount: string, denom: string, exponent: number): string {
  const num = BigInt(amount);
  const divisor = BigInt(10 ** exponent);
  
  const integerPart = num / divisor;
  const fractionalPart = num % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(exponent, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return `${integerPart} ${denom.toUpperCase()}`;
  }
  
  return `${integerPart}.${trimmedFractional} ${denom.toUpperCase()}`;
}

/**
 * Parse formatted denomination back to base units
 * 
 * @param formatted - Formatted string (e.g., "1.5 ATOM")
 * @returns Object with amount and denom
 */
export function parseDenom(formatted: string): { amount: string; denom: string } {
  const parts = formatted.trim().split(' ');
  
  if (parts.length !== 2) {
    throw new Error('Invalid denomination format');
  }
  
  const [amountStr, denom] = parts;
  
  return {
    amount: amountStr,
    denom: denom.toLowerCase()
  };
}

/**
 * Convert base denom to display denom
 * 
 * @param baseDenom - Base denomination (e.g., "uatom")
 * @returns Display denomination (e.g., "ATOM")
 */
export function baseToDisplay(baseDenom: string): string {
  // Remove 'u' prefix if present
  if (baseDenom.startsWith('u')) {
    return baseDenom.substring(1).toUpperCase();
  }
  
  return baseDenom.toUpperCase();
}

/**
 * Get exponent for common denominations
 * 
 * @param denom - Denomination
 * @returns Exponent (number of decimals)
 */
export function getExponent(denom: string): number {
  const lowerDenom = denom.toLowerCase();
  
  // Most Cosmos tokens use 6 decimals
  if (lowerDenom.startsWith('u')) {
    return 6;
  }
  
  // Some tokens use 18 decimals (like Ethereum)
  if (lowerDenom.includes('wei')) {
    return 18;
  }
  
  // Default to 6
  return 6;
}
