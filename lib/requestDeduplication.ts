/**
 * Request Deduplication
 * Prevents duplicate API calls for the same endpoint
 */

const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = `${url}_${JSON.stringify(options || {})}`;
  
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  // Create new request
  const promise = fetch(url, options)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .finally(() => {
      // Remove from pending after completion
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Clear all pending requests (useful for cleanup)
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}
