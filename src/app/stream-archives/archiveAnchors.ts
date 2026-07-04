const ARCHIVE_ANCHOR_PREFIX = "archive-";

export const getArchiveAnchorId = (videoId: string) =>
  `${ARCHIVE_ANCHOR_PREFIX}${videoId}`;

export const getArchiveAnchorHref = (videoId: string) =>
  `#${encodeURIComponent(getArchiveAnchorId(videoId))}`;

export const getArchiveAnchorUrl = (currentHref: string, videoId: string) => {
  const url = new URL(currentHref);
  url.search = "";
  url.hash = getArchiveAnchorHref(videoId);
  return url.toString();
};

export const getArchiveVideoIdFromHash = (hash: string) => {
  const hashValue = hash.startsWith("#") ? hash.slice(1) : hash;

  try {
    const decodedHash = decodeURIComponent(hashValue);
    return decodedHash.startsWith(ARCHIVE_ANCHOR_PREFIX)
      ? decodedHash.slice(ARCHIVE_ANCHOR_PREFIX.length)
      : null;
  } catch {
    return null;
  }
};
