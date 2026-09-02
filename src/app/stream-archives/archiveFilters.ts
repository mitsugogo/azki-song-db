export const ARCHIVE_CAST_PARAM = "cast";

const LEGACY_ARCHIVE_LIST_PARAMS = new Set([
  "keyword",
  "q",
  "series",
  ARCHIVE_CAST_PARAM,
  "from",
  "to",
  "includeShorts",
  "view",
]);

export const getArchiveCastNames = (params: URLSearchParams) =>
  Array.from(
    new Set(
      params
        .getAll(ARCHIVE_CAST_PARAM)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  );

export const setArchiveCastNames = (
  params: URLSearchParams,
  castNames: string[],
) => {
  params.delete(ARCHIVE_CAST_PARAM);
  castNames.forEach((name) => {
    const normalizedName = name.trim();
    if (normalizedName) {
      params.append(ARCHIVE_CAST_PARAM, normalizedName);
    }
  });
};

export const getLegacyArchiveListUrl = (currentHref: string) => {
  const url = new URL(currentHref);
  const hasListQuery = Array.from(url.searchParams.keys()).some((key) =>
    LEGACY_ARCHIVE_LIST_PARAMS.has(key),
  );
  const hasArchiveHash = url.hash.startsWith("#archive-");

  if (!hasListQuery && !hasArchiveHash) {
    return null;
  }

  const routeSuffix = "/stream-archives";
  const routeIndex = url.pathname.lastIndexOf(routeSuffix);
  const localePrefix = routeIndex >= 0 ? url.pathname.slice(0, routeIndex) : "";

  return `${localePrefix}/stream-archives/list${url.search}${url.hash}`;
};
