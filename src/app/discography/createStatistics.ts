import { Song } from "../types/song";

export type StatisticsItem = {
  key: string;
  count: number;
  isAlbum: boolean;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
  videos: Song[];
};

export const createStatistics = <T extends StatisticsItem>(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  groupByAlbum?: boolean,
) => {
  const countsMap = songs.reduce((map: Map<string, T>, song: Song) => {
    const keys = Array.isArray(keyFn(song))
      ? (keyFn(song) as string[])
      : [keyFn(song) as string];
    keys.forEach((key) => {
      const isAlbum = "album" in song && song.album;
      let firstVideo: Song | undefined;
      let lastVideo: Song | undefined;
      let videos: Song[] = [];
      if (groupByAlbum && isAlbum) {
        firstVideo = map.get(key)?.firstVideo ?? song;
        lastVideo = song;

        const v = map.get(key)?.videos;
        v?.push(song);
        videos = v ?? [song];
      } else {
        firstVideo =
          (map.get(key)?.firstVideo.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo
            : song;
        lastVideo =
          (map.get(key)?.lastVideo.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo
            : song;
        videos.push(song);
      }

      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        isAlbum: isAlbum,
        firstVideo: firstVideo,
        lastVideo: lastVideo,
        videos: videos,
      } as T & StatisticsItem);
    });
    return map;
  }, new Map<string, T & StatisticsItem>());

  const sortedData = groupByAlbum
    ? Array.from(countsMap.values())
    : Array.from(countsMap.values()).sort((a, b) => {
        if (groupByAlbum) {
          return (
            new Date(b.firstVideo.album_release_at).getTime() -
            new Date(a.firstVideo.album_release_at).getTime()
          );
        } else {
          return (
            new Date(b.firstVideo.broadcast_at).getTime() -
            new Date(a.firstVideo.broadcast_at).getTime()
          );
        }
      });
  return sortedData as Array<T & StatisticsItem>;
};
