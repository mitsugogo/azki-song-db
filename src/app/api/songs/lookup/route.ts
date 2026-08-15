import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import {
  filterSongMetadataLookupEntries,
  toSongMetadataLookupEntry,
  type SongMetadataLookupEntry,
} from "@/app/lib/songMetadataLookup";
import {
  fetchSongsFromApiCached,
  fetchSongsVersionFromApi,
} from "@/app/lib/server/fetchSongs";
import {
  getRecentSongsBucket,
  noStoreCacheControl,
  publicSongsCacheControl,
  songsVersionHeader,
} from "@/app/lib/songsApi";

type SongMetadataIndex = {
  version: string;
  byVideoId: Map<string, SongMetadataLookupEntry[]>;
};

declare global {
  var __azkiSongMetadataIndexes: Map<string, SongMetadataIndex> | undefined;
  var __azkiSongMetadataIndexLoads:
    Map<string, Promise<SongMetadataIndex>> | undefined;
  var __azkiSongMetadataLatestVersions: Map<string, string> | undefined;
}

const metadataIndexes =
  globalThis.__azkiSongMetadataIndexes ??
  (globalThis.__azkiSongMetadataIndexes = new Map());
const metadataIndexLoads =
  globalThis.__azkiSongMetadataIndexLoads ??
  (globalThis.__azkiSongMetadataIndexLoads = new Map());
const metadataLatestVersions =
  globalThis.__azkiSongMetadataLatestVersions ??
  (globalThis.__azkiSongMetadataLatestVersions = new Map());

const buildIndex = (
  version: string,
  songs: SongMetadataLookupEntry[],
): SongMetadataIndex => {
  const byVideoId = new Map<string, SongMetadataLookupEntry[]>();
  for (const song of songs) {
    const entries = byVideoId.get(song.video_id) ?? [];
    entries.push(song);
    byVideoId.set(song.video_id, entries);
  }
  return { version, byVideoId };
};

const loadIndex = async (
  locale: string,
  version: string,
  origin: string,
): Promise<SongMetadataIndex> => {
  metadataLatestVersions.set(locale, version);
  const cached = metadataIndexes.get(locale);
  if (cached?.version === version) return cached;

  const loadKey = `${locale}:${version}`;
  const activeLoad = metadataIndexLoads.get(loadKey);
  if (activeLoad) return activeLoad;

  const load = (async () => {
    const songs = await fetchSongsFromApiCached({
      locale,
      baseUrlOverride: origin,
      ...(version.startsWith("recent:")
        ? { freshness: "recent" as const }
        : { version }),
    });
    const index = buildIndex(version, songs.map(toSongMetadataLookupEntry));
    if (metadataLatestVersions.get(locale) === version) {
      metadataIndexes.set(locale, index);
    }
    return index;
  })();

  metadataIndexLoads.set(loadKey, load);
  try {
    return await load;
  } finally {
    metadataIndexLoads.delete(loadKey);
  }
};

const selectEntries = (
  index: SongMetadataIndex,
  videoId: string,
  start?: string,
) =>
  filterSongMetadataLookupEntries(
    index.byVideoId.get(videoId) ?? [],
    videoId,
    start,
  );

const cacheTagHeader = buildVercelCacheTagHeader([
  cacheTags.coreDataset,
  cacheTags.songs,
  cacheTags.songsList,
]);

const jsonResponse = (entries: SongMetadataLookupEntry[], version?: string) =>
  Response.json(entries, {
    headers: {
      "Cache-Control": entries.length
        ? publicSongsCacheControl
        : noStoreCacheControl,
      "Vercel-Cache-Tag": cacheTagHeader,
      ...(version ? { [songsVersionHeader]: version } : {}),
    },
  });

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedLocale =
    requestUrl.searchParams.get("hl")?.toLowerCase() ?? "ja";
  const locale = requestedLocale === "en" ? "en" : "ja";
  const videoId = requestUrl.searchParams.get("v")?.trim();
  const start = requestUrl.searchParams.get("t") ?? undefined;

  if (!videoId) {
    return Response.json(
      { error: "Missing required parameter: v" },
      {
        status: 400,
        headers: { "Cache-Control": noStoreCacheControl },
      },
    );
  }

  try {
    const version = await fetchSongsVersionFromApi({
      locale,
      baseUrlOverride: requestUrl.origin,
    }).catch(() => `recent:${getRecentSongsBucket()}`);
    const index = await loadIndex(locale, version, requestUrl.origin);
    const entries = selectEntries(index, videoId, start);
    if (entries.length) return jsonResponse(entries, version);

    if (version.startsWith("recent:")) {
      return jsonResponse([], version);
    }

    const recentSongs = await fetchSongsFromApiCached({
      locale,
      baseUrlOverride: requestUrl.origin,
      freshness: "recent",
    });
    const recentEntries = filterSongMetadataLookupEntries(
      recentSongs.map(toSongMetadataLookupEntry),
      videoId,
      start,
    );

    return jsonResponse(recentEntries, `recent:${getRecentSongsBucket()}`);
  } catch {
    return Response.json(
      { error: "Failed to fetch song metadata" },
      {
        status: 502,
        headers: { "Cache-Control": noStoreCacheControl },
      },
    );
  }
}
