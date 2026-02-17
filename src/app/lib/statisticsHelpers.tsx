/* eslint @typescript-eslint/no-explicit-any: off */
/* eslint @typescript-eslint/no-non-null-asserted-optional-chain: off */
import { Song } from "../types/song";
import { StatisticsItem } from "../types/statisticsItem";

export function createStatistics(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  sortFn?: (a: any, b: any) => number,
) {
  const countsMap = songs.reduce((map: Map<string, any>, song: Song) => {
    const keys = Array.isArray(keyFn(song))
      ? (keyFn(song) as string[])
      : [keyFn(song) as string];

    keys.forEach((key) => {
      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        firstVideo:
          (map.get(key)?.firstVideo?.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo!
            : song,
        lastVideo:
          (map.get(key)?.lastVideo?.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo!
            : song,
      } as any & StatisticsItem);
    });
    return map;
  }, new Map<string, any & StatisticsItem>());

  return Array.from(countsMap.values()).sort(
    sortFn || ((a, b) => b.count - a.count),
  );
}
