export async function fetchKeybaseAvatar(identity: string): Promise<string | null> {
  if (!identity || identity.length < 16) {
    return null;
  }
  try {
    const response = await fetch(`/api/keybase?identity=${identity}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.avatarUrl) {
      return data.avatarUrl;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Batch fetch multiple keybase avatars at once
export async function fetchKeybaseAvatarsBatch(identities: string[]): Promise<Record<string, string | null>> {
  if (!identities || identities.length === 0) {
    return {};
  }

  // Filter valid identities
  const validIdentities = identities.filter(id => id && id.length >= 16);
  
  if (validIdentities.length === 0) {
    return {};
  }

  try {
    const response = await fetch('/api/keybase/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identities: validIdentities }),
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    return data.results || {};
  } catch (error) {
    console.error('[Keybase Batch] Error:', error);
    return {};
  }
}

export function getCachedAvatar(identity: string): string | null {
  try {
    const cacheKey = `keybase_avatar_${identity}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const { url, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function cacheAvatar(identity: string, url: string): void {
  try {
    const cacheKey = `keybase_avatar_${identity}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      url,
      timestamp: Date.now()
    }));
  } catch (error) {}
}

export function cacheAvatarsBatch(results: Record<string, string | null>): void {
  try {
    Object.entries(results).forEach(([identity, url]) => {
      if (url) {
        cacheAvatar(identity, url);
      }
    });
  } catch (error) {
    console.error('[Keybase Cache] Error:', error);
  }
}

export async function getValidatorAvatar(identity: string): Promise<string | null> {
  const cached = getCachedAvatar(identity);
  if (cached) return cached;
  const url = await fetchKeybaseAvatar(identity);
  if (url) {
    cacheAvatar(identity, url);
  }
  return url;
}

// Get multiple validator avatars at once with caching
export async function getValidatorAvatarsBatch(identities: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  const uncachedIdentities: string[] = [];

  // Check cache first
  identities.forEach(identity => {
    if (!identity || identity.length < 16) return;
    
    const cached = getCachedAvatar(identity);
    if (cached) {
      results[identity] = cached;
    } else {
      uncachedIdentities.push(identity);
    }
  });

  // Fetch uncached ones in batch
  if (uncachedIdentities.length > 0) {
    const fetchedResults = await fetchKeybaseAvatarsBatch(uncachedIdentities);
    
    // Cache and merge results
    cacheAvatarsBatch(fetchedResults);
    Object.assign(results, fetchedResults);
  }

  return results;
}
