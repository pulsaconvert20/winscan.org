/**
 * Number Formatters
 */

/**
 * Format a number with commas
 */
export function formatNumber(value: number | string, decimals?: number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (decimals !== undefined) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatCompactNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  
  return num.toFixed(2);
}
