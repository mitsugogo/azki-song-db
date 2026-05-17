import { Song } from "../../types/song";

type DiscographyDateSource = Pick<Song, "album_release_at" | "broadcast_at">;

function parseValidDate(value: string | undefined): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDiscographyRepresentativeDate(
  song: DiscographyDateSource,
  groupByAlbum: boolean,
): Date | null {
  if (groupByAlbum) {
    const albumReleaseDate = parseValidDate(song.album_release_at);
    if (albumReleaseDate) return albumReleaseDate;
  }

  return parseValidDate(song.broadcast_at);
}

export function getDiscographyRepresentativeYear(
  song: DiscographyDateSource,
  groupByAlbum: boolean,
): number | null {
  return (
    getDiscographyRepresentativeDate(song, groupByAlbum)?.getFullYear() ?? null
  );
}
