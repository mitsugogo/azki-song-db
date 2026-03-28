export const HOME_PATH = "/";
export const SEARCH_PATH = "/search";
export const WATCH_PATH = "/watch";
const SUPPORTED_LOCALE_PREFIXES = new Set(["ja", "en"]);

type WatchHrefOptions = {
  videoId?: string | null;
  start?: string | number | null;
  searchTerm?: string | null;
  playlist?: string | null;
  extraParams?: Record<string, string | number | null | undefined>;
};

export function normalizeWatchTimeParam(
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalizedValue = `${value}`.trim().replace(/s$/i, "");
  const seconds = Number(normalizedValue);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return `${Math.floor(seconds)}s`;
}

export function buildWatchHref({
  videoId,
  start,
  searchTerm,
  playlist,
  extraParams,
}: WatchHrefOptions) {
  const searchParams = new URLSearchParams();

  if (videoId) {
    searchParams.set("v", videoId);
  }

  const normalizedStart = normalizeWatchTimeParam(start);
  if (normalizedStart) {
    searchParams.set("t", normalizedStart);
  }

  if (searchTerm) {
    searchParams.set("q", searchTerm);
  }

  if (playlist) {
    searchParams.set("playlist", playlist);
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }
      if (["v", "t", "q", "playlist"].includes(key)) {
        continue;
      }
      searchParams.set(key, `${value}`);
    }
  }

  const query = searchParams.toString();
  return query ? `${WATCH_PATH}?${query}` : WATCH_PATH;
}

export function isWatchPagePath(pathname: string | null | undefined) {
  if (!pathname) return false;

  const rawPath = pathname.split("?")[0]?.split("#")[0] ?? "";
  const normalizedPath =
    rawPath !== "/" && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

  if (normalizedPath === WATCH_PATH) return true;

  const segments = normalizedPath.split("/").filter(Boolean);
  if (
    segments.length >= 2 &&
    SUPPORTED_LOCALE_PREFIXES.has(segments[0]) &&
    `/${segments.slice(1).join("/")}` === WATCH_PATH
  ) {
    return true;
  }

  return false;
}
