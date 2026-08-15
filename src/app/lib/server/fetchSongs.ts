import type { Song } from "@/app/types/song";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import type { SongMetadataLookupEntry } from "@/app/lib/songMetadataLookup";
import {
  getRecentSongsBucket,
  songsFreshnessQueryParamKey,
  songsMembersOnlyQueryParamKey,
  songsVersionHeader,
  songsVersionQueryParamKey,
} from "@/app/lib/songsApi";

type FetchSongsOptions = {
  locale?: string;
  includeMembersOnly?: boolean;
  cookie?: string;
  baseUrlOverride?: string;
  freshness?: "default" | "recent";
  version?: string;
};

type FetchSongLookupOptions = {
  locale?: string;
  videoId: string;
  start?: string | number | null;
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
  freshness = "default",
  version,
}: FetchSongsOptions = {}): Promise<Song[]> {
  const headers = cookie ? { cookie } : undefined;

  for (const base of getBaseCandidates(baseUrlOverride)) {
    try {
      const songsUrl = new URL("/api/songs", base);
      songsUrl.searchParams.set("hl", locale);
      if (includeMembersOnly) {
        songsUrl.searchParams.set(songsMembersOnlyQueryParamKey, "true");
      } else if (freshness === "recent") {
        songsUrl.searchParams.set(
          songsFreshnessQueryParamKey,
          getRecentSongsBucket(),
        );
      } else if (version) {
        songsUrl.searchParams.set(songsVersionQueryParamKey, version);
      }

      if (includeMembersOnly) {
        return await fetchSongsJson(songsUrl, { headers });
      }

      const promise = fetchSongsJson(songsUrl);

      return await promise;
    } catch {
      // Try the next base URL.
    }
  }

  throw new Error("Failed to fetch songs from any known base URL");
}

export async function fetchSongsFromApiWithRecentFallback(
  options: FetchSongsOptions,
  hasExpectedSongs: (songs: Song[]) => boolean,
): Promise<Song[]> {
  const songs = await fetchSongsFromApiCached(options);
  if (hasExpectedSongs(songs) || options.includeMembersOnly) return songs;

  return fetchSongsFromApiCached({
    ...options,
    freshness: "recent",
    version: undefined,
  });
}

export async function fetchSongsVersionFromApi({
  locale = "ja",
  baseUrlOverride,
}: Pick<
  FetchSongsOptions,
  "locale" | "baseUrlOverride"
> = {}): Promise<string> {
  for (const base of getBaseCandidates(baseUrlOverride)) {
    try {
      const songsUrl = new URL("/api/songs", base);
      songsUrl.searchParams.set("hl", locale);
      const response = await fetch(songsUrl, {
        method: "HEAD",
      });
      const version = response.headers.get(songsVersionHeader);
      if (response.ok && version) return version;
    } catch {
      // Try the next base URL.
    }
  }

  throw new Error("Failed to fetch the songs version");
}

export async function fetchSongMetadataLookup({
  locale = "ja",
  videoId,
  start,
  baseUrlOverride,
}: FetchSongLookupOptions): Promise<SongMetadataLookupEntry[]> {
  for (const base of getBaseCandidates(baseUrlOverride)) {
    try {
      const lookupUrl = new URL("/api/songs/lookup", base);
      lookupUrl.searchParams.set("hl", locale);
      lookupUrl.searchParams.set("v", videoId);
      if (start !== undefined && start !== null) {
        lookupUrl.searchParams.set("t", String(start));
      }

      const response = await fetch(lookupUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch song lookup: ${response.status}`);
      }

      return (await response.json()) as SongMetadataLookupEntry[];
    } catch {
      // Try the next base URL.
    }
  }

  throw new Error("Failed to fetch song metadata lookup");
}
