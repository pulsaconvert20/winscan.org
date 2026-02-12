/**
 * IBC Transfer Utilities
 */

/**
 * Build IBC transfer path
 * 
 * @param sourceChannel - Source channel ID
 * @param destChannel - Destination channel ID
 * @returns IBC path
 */
export function buildIbcPath(sourceChannel: string, destChannel: string): string {
  return `${sourceChannel}/${destChannel}`;
}

/**
 * Parse IBC transfer memo
 * 
 * @param memo - Transfer memo
 * @returns Parsed memo object
 */
export function parseTransferMemo(memo: string): any {
  try {
    return JSON.parse(memo);
  } catch {
    return { raw: memo };
  }
}

/**
 * Calculate IBC timeout timestamp
 * 
 * @param minutes - Minutes from now
 * @returns Timeout timestamp in nanoseconds
 */
export function calculateTimeout(minutes: number = 10): string {
  const now = Date.now();
  const timeout = now + (minutes * 60 * 1000);
  return (timeout * 1_000_000).toString(); // Convert to nanoseconds
}
