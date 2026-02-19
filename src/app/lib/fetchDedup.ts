const cache = new Map<string, any>();
const headersCache = new Map<string, Record<string, string>>();
const inFlightHeaders = new Map<string, Promise<Record<string, string>>>();
const inFlight = new Map<
  string,
  Promise<{ data: any | null; headers: Record<string, string> }>
>();

export function clearFetchCache(url?: string) {
  if (url) {
    cache.delete(url);
    headersCache.delete(url);
  } else {
    cache.clear();
    headersCache.clear();
  }
}

export async function fetchJsonDedup<T = any>(
  url: string,
): Promise<{ data: T | null; headers: Record<string, string> }> {
  // If we have cached data but no headers yet, fetch HEAD to populate headers cache.
  if (cache.has(url) && !headersCache.has(url)) {
    if (inFlightHeaders.has(url)) {
      const ph = inFlightHeaders.get(url)!;
      return ph.then((h) => ({ data: cache.get(url) as T, headers: h }));
    }

    const extractHeaders = (h: Headers) => {
      const obj: Record<string, string> = {};
      h.forEach((v, k) => {
        obj[k.toLowerCase()] = v;
      });
      return obj;
    };

    const ph = fetch(url, { method: "HEAD" })
      .then((res) => {
        const hdrs = extractHeaders(res.headers);
        headersCache.set(url, hdrs);
        return hdrs;
      })
      .catch(() => {
        return {} as Record<string, string>;
      })
      .finally(() => {
        inFlightHeaders.delete(url);
      });

    inFlightHeaders.set(url, ph);
    return ph.then((h) => ({ data: cache.get(url) as T, headers: h }));
  }

  if (inFlight.has(url)) {
    return inFlight.get(url)!;
  }

  const extractHeaders = (h: Headers) => {
    const obj: Record<string, string> = {};
    h.forEach((v, k) => {
      obj[k.toLowerCase()] = v;
    });
    return obj;
  };

  const p = fetch(url)
    .then(async (res) => {
      const hdrs = extractHeaders(res.headers);
      if (!res.ok) return { data: null, headers: hdrs };
      const data = (await res.json()) as T;
      cache.set(url, data);
      headersCache.set(url, hdrs);
      return { data, headers: hdrs };
    })
    .catch((e) => {
      console.error(`fetchJsonDedup error for ${url}:`, e);
      return { data: null, headers: {} };
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
