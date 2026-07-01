import { useState, useEffect, useMemo } from "react";
import { Song } from "../../types/song";
import { createStatistics } from "../createStatistics";
import useSongs from "../../hook/useSongs";
import {
  isCollaborationSong,
  isCoverSong,
  isFesOverallSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import { normalizeSongTitle } from "../utils/normalizeSongTitle";
import {
  getSongInstanceKey,
  groupReleaseVariants,
} from "../utils/releaseVariants";
import type { StatisticsItem } from "../createStatistics";

const applyReleaseVariantGrouping = (item: StatisticsItem): StatisticsItem => {
  const groups = groupReleaseVariants(item.videos ?? []);
  if (groups.length === 0) return item;
  const isStandaloneReleaseGroup =
    groups.length === 1 &&
    groups[0].variants.length > 1 &&
    groups[0].variants.some((song) => !song.album?.trim());

  return {
    ...item,
    count: groups.length,
    isAlbum: isStandaloneReleaseGroup ? false : item.isAlbum,
    firstVideo: groups[0].representative,
    lastVideo: groups[groups.length - 1].representative,
  };
};

/**
 * Discographyページのデータフェッチと統計計算を管理するカスタムフック
 */
export function useDiscographyData(
  groupByAlbum: boolean,
  onlyOriginalMV: boolean,
) {
  const { allSongs, isLoading } = useSongs();
  const loading = isLoading;
  const songs = allSongs;
  const getSongKeyTitle = (s: Song) => normalizeSongTitle(s.title, s.artist);
  const releaseVariantAlbumKeyByInstance = useMemo(() => {
    const map = new Map<string, string>();
    const standaloneReleaseGroups = groupReleaseVariants(songs).filter(
      (group) =>
        group.variants.length > 1 &&
        group.variants.some((song) => !song.album?.trim()),
    );

    for (const group of standaloneReleaseGroups) {
      const title = group.representative.title?.trim();
      if (!title) continue;
      for (const variant of group.variants) {
        map.set(getSongInstanceKey(variant), title);
      }
    }

    return map;
  }, [songs]);
  const getAlbumGroupingKey = (s: Song) =>
    releaseVariantAlbumKeyByInstance.get(getSongInstanceKey(s)) ||
    s.album ||
    getSongKeyTitle(s);
  const tabCounts = useMemo(() => {
    const countStatisticsItems = (
      items: Song[],
      keyFn: (song: Song) => string,
    ) =>
      createStatistics(items, keyFn, false).map(applyReleaseVariantGrouping)
        .length;

    const originals = songs.filter((s) => {
      const isOriginal =
        s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV");
      return isOriginal && isPossibleOriginalSong(s);
    });
    const units = songs.filter(
      (s) => isCollaborationSong(s) || isFesOverallSong(s),
    );
    const covers = songs.filter((s) => isCoverSong(s));
    const allFiltered = songs.filter(
      (s) =>
        isPossibleOriginalSong(s) ||
        isCollaborationSong(s) ||
        isFesOverallSong(s) ||
        isCoverSong(s),
    );
    const normalizeSingers = (s: Song) =>
      ((s.sing || "") as string)
        .split("、")
        .map((x) => x.trim())
        .filter(Boolean)
        .sort()
        .join("、");

    return {
      all: countStatisticsItems(allFiltered, getSongKeyTitle),
      originals: countStatisticsItems(originals, getSongKeyTitle),
      unit: countStatisticsItems(units, getSongKeyTitle),
      covers: countStatisticsItems(covers, (song) => {
        const singers = normalizeSingers(song);
        const normalizedTitle = getSongKeyTitle(song);
        return singers ? `${normalizedTitle}__${singers}` : normalizedTitle;
      }),
    };
  }, [songs]);

  // オリジナル楽曲の統計
  const originalSongCountsByReleaseDate = useMemo(() => {
    const originals = songs.filter((s) => {
      const isOriginal = onlyOriginalMV
        ? s.tags.includes("オリ曲MV")
        : s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV");
      return isOriginal && isPossibleOriginalSong(s);
    });
    return createStatistics(
      originals,
      (s) => (groupByAlbum ? getAlbumGroupingKey(s) : getSongKeyTitle(s)),
      groupByAlbum,
    ).map(applyReleaseVariantGrouping);
  }, [songs, groupByAlbum, onlyOriginalMV, releaseVariantAlbumKeyByInstance]);

  // ユニット/ゲスト楽曲の統計
  const unitSongCountsByReleaseDate = useMemo(() => {
    const units = songs.filter(
      (s) => isCollaborationSong(s) || isFesOverallSong(s),
    );
    return createStatistics(
      units,
      (s) => (groupByAlbum ? getAlbumGroupingKey(s) : getSongKeyTitle(s)),
      groupByAlbum,
    ).map(applyReleaseVariantGrouping);
  }, [songs, groupByAlbum, releaseVariantAlbumKeyByInstance]);

  // カバー楽曲の統計
  const coverSongCountsByReleaseDate = useMemo(() => {
    const covers = songs.filter((s) => isCoverSong(s));
    const normalizeSingers = (s: Song) =>
      ((s.sing || "") as string)
        .split("、")
        .map((x) => x.trim())
        .filter(Boolean)
        .sort()
        .join("、");

    return createStatistics(
      covers,
      (s) => {
        const singers = normalizeSingers(s);
        const normalizedTitle = getSongKeyTitle(s);
        if (groupByAlbum) {
          return (
            releaseVariantAlbumKeyByInstance.get(getSongInstanceKey(s)) ||
            s.album ||
            `${normalizedTitle}__${singers}` ||
            normalizedTitle
          );
        }
        return singers ? `${normalizedTitle}__${singers}` : normalizedTitle;
      },
      groupByAlbum,
    ).map(applyReleaseVariantGrouping);
  }, [songs, groupByAlbum, releaseVariantAlbumKeyByInstance]);

  // 全楽曲の統計
  const allSongCountsByReleaseDate = useMemo(() => {
    const allFiltered = songs.filter(
      (s) =>
        isPossibleOriginalSong(s) ||
        isCollaborationSong(s) ||
        isFesOverallSong(s) ||
        isCoverSong(s),
    );
    return createStatistics(
      // ユニークにする
      allFiltered,
      (s) => (groupByAlbum ? getAlbumGroupingKey(s) : getSongKeyTitle(s)),
      groupByAlbum,
    ).map(applyReleaseVariantGrouping);
  }, [songs, groupByAlbum, releaseVariantAlbumKeyByInstance]);

  return {
    loading,
    songs,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
    allSongCountsByReleaseDate,
    tabCounts,
  };
}
