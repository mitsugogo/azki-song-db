import type { Song } from "@/app/types/song";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import { songsMembersOnlyQueryParamKey } from "@/app/lib/songsApi";

type FetchSongsOptions = {
  locale?: string;
  includeMembersOnly?: boolean;
  cookie?: string;
  baseUrlOverride?: string;
};

const getBaseCandidates = (baseUrlOverride?: string) => {
  const candidates = [
    baseUrlOverride,
    baseUrl,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.NODE_ENV === "development"
      ? `http://127.0.0.1:${process.env.PORT ?? 3000}`
      : undefined,
    siteConfig.siteUrl,
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates));
};

const globalForSongs = globalThis as typeof globalThis & {
  __azkiSongsFetchCache?: Map<string, Promise<Song[]>>;
};

const songsFetchCache =
  globalForSongs.__azkiSongsFetchCache ??
  (globalForSongs.__azkiSongsFetchCache = new Map());

const fetchSongsJson = async (
  url: URL,
  init?: RequestInit,
): Promise<Song[]> => {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch songs: ${response.status}`);
  }

  return (await response.json()) as Song[];
};

export async function fetchSongsFromApiCached({
  locale = "ja",
  includeMembersOnly = false,
  cookie,
  baseUrlOverride,
}: FetchSongsOptions = {}): Promise<Song[]> {
  const headers = cookie ? { cookie } : undefined;

  for (const base of getBaseCandidates(baseUrlOverride)) {
    try {
      const songsUrl = new URL("/api/songs", base);
      songsUrl.searchParams.set("hl", locale);
      if (includeMembersOnly) {
        songsUrl.searchParams.set(songsMembersOnlyQueryParamKey, "true");
      }

      if (includeMembersOnly) {
        return await fetchSongsJson(songsUrl, { headers });
      }

      const cacheKey = songsUrl.toString();
      const cached = songsFetchCache.get(cacheKey);
      if (cached) {
        return await cached;
      }

      const promise = fetchSongsJson(songsUrl);
      songsFetchCache.set(cacheKey, promise);
      promise.catch(() => {
        songsFetchCache.delete(cacheKey);
      });

      return await promise;
    } catch {
      // Try the next base URL.
    }
  }

  throw new Error("Failed to fetch songs from any known base URL");
}
