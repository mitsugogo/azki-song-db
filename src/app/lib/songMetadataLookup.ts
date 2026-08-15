import type { Song } from "@/app/types/song";

export type SongMetadataLookupEntry = Pick<
  Song,
  | "video_id"
  | "start"
  | "title"
  | "artist"
  | "video_title"
  | "broadcast_at"
  | "tags"
>;

export const normalizeSongStart = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withoutSuffix = trimmed.replace(/s$/i, "");
  const numeric = Number(withoutSuffix);
  return Number.isFinite(numeric) ? String(numeric) : withoutSuffix;
};

export const toSongMetadataLookupEntry = (
  song: Song,
): SongMetadataLookupEntry => ({
  video_id: song.video_id,
  start: song.start,
  title: song.title,
  artist: song.artist,
  video_title: song.video_title,
  broadcast_at: song.broadcast_at,
  tags: song.tags,
});

export const filterSongMetadataLookupEntries = (
  songs: readonly SongMetadataLookupEntry[],
  videoId: string,
  start?: unknown,
) => {
  const songsByVideoId = songs.filter((song) => song.video_id === videoId);
  const normalizedStart = normalizeSongStart(start);

  if (normalizedStart === null) return songsByVideoId;

  return songsByVideoId.filter(
    (song) => normalizeSongStart(song.start) === normalizedStart,
  );
};

export const resolveSongMetadataEntry = (
  songs: readonly SongMetadataLookupEntry[],
  videoId: string,
  start: unknown,
) => {
  const normalizedStart = normalizeSongStart(start);
  if (normalizedStart === null) return undefined;

  const exact = songs.find(
    (song) =>
      song.video_id === videoId &&
      normalizeSongStart(song.start) === normalizedStart,
  );
  if (exact) return exact;

  const sameVideoSongs = songs.filter((song) => song.video_id === videoId);
  return sameVideoSongs.length === 1 ? sameVideoSongs[0] : undefined;
};
