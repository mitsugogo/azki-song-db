const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * タイトル末尾の " - {artist}" を吸収し、同一曲の表記ゆれを統一する
 */
export const normalizeSongTitle = (title: string, artist: string) => {
  const trimmedTitle = (title || "").trim();
  const trimmedArtist = (artist || "").trim();
  if (!trimmedTitle || !trimmedArtist) return trimmedTitle;

  const artistPattern = escapeRegExp(trimmedArtist);
  const titleWithoutArtist = trimmedTitle.replace(
    new RegExp(`\\s*-\\s*${artistPattern}$`, "i"),
    "",
  );

  return titleWithoutArtist.trim() || trimmedTitle;
};
