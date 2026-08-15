export const songsMembersOnlyQueryParamKey = "mo";

export const songsFreshnessQueryParamKey = "_fresh";
export const songsVersionQueryParamKey = "_version";
export const songsVersionHeader = "x-songs-version";

export const publicSongsCacheControl =
  "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=300";
export const privateSongsCacheControl =
  "private, no-store, max-age=0, must-revalidate";
export const noStoreCacheControl = "private, no-store, max-age=0";

export const recentSongsBucketMs = 5 * 60 * 1000;

export const getRecentSongsBucket = (now = Date.now()) =>
  Math.floor(now / recentSongsBucketMs).toString();
