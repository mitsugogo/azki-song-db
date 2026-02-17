const cache = new Map<string, any>();
const inFlight = new Map<string, Promise<any>>();

export function clearFetchCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

export async function fetchJsonDedup<T = any>(url: string): Promise<T | null> {
  if (cache.has(url)) return cache.get(url) as T;
  if (inFlight.has(url)) return inFlight.get(url) as Promise<T | null>;

  const p = fetch(url)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as T;
      cache.set(url, data);
      return data;
    })
    .catch((e) => {
      console.error(`fetchJsonDedup error for ${url}:`, e);
      return null;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, p);
  return p;
}

export function hasFetchCache(url: string) {
  return cache.has(url);
}
