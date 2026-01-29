/**
 * Date Formatters
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a date with a specific format
 */
export function formatDate(date: string | Date, formatStr: string = 'PPpp'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return format(dateObj, formatStr);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
