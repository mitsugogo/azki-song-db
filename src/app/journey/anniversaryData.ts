import type { ArchiveItem } from "@/app/types/archiveItem";
import type { Song } from "@/app/types/song";

export type AnniversaryDataStats = {
  entries: number;
  songs: number;
  videos: number;
  archives: number;
  artists: number;
  albums: number;
  activityRecords: number;
  songTags: number;
};

type AnniversaryDataInput = {
  songs: Song[];
  archives: ArchiveItem[];
  activityRecords: number;
};

const normalizedValues = (values: Array<string | null | undefined>) =>
  values
    .map((value) => value?.normalize("NFKC").trim())
    .filter(Boolean) as string[];

export function buildAnniversaryDataStats({
  songs,
  archives,
  activityRecords,
}: AnniversaryDataInput): AnniversaryDataStats {
  const uniqueSongs = new Set<string>();
  const videoIds = new Set<string>();
  const artists = new Set<string>();
  const albums = new Set<string>();
  const songTags = new Set<string>();

  songs.forEach((song) => {
    const title = song.title.normalize("NFKC").trim();
    const artist = song.artist.normalize("NFKC").trim();
    if (title) uniqueSongs.add(`${title}\0${artist}`);
    if (song.video_id) videoIds.add(song.video_id);

    normalizedValues(
      song.artists?.length ? song.artists : [song.artist],
    ).forEach((value) => artists.add(value));

    const albumKey = song.album_id || song.album;
    normalizedValues([albumKey]).forEach((value) => albums.add(value));
    normalizedValues(song.song_tags ?? []).forEach((value) =>
      songTags.add(value),
    );
  });

  const archiveVideoIds = new Set(
    archives.map((archive) => archive.video_id).filter(Boolean),
  );

  return {
    entries: songs.length,
    songs: uniqueSongs.size,
    videos: videoIds.size,
    archives: archiveVideoIds.size,
    artists: artists.size,
    albums: albums.size,
    activityRecords: Math.max(0, activityRecords),
    songTags: songTags.size,
  };
}
