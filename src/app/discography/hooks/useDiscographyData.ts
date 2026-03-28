import { useState, useEffect, useMemo } from "react";
import { Song } from "../../types/song";
import { createStatistics } from "../createStatistics";
import useSongs from "../../hook/useSongs";
import {
  filterOriginalSongs,
  isCollaborationSong,
  isCoverSong,
  isFesOverallSong,
  isOriginalSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import { normalizeSongTitle } from "../utils/normalizeSongTitle";

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
      (s) =>
        groupByAlbum ? s.album || getSongKeyTitle(s) : getSongKeyTitle(s),
      groupByAlbum,
    );
  }, [songs, groupByAlbum, onlyOriginalMV]);

  // ユニット/ゲスト楽曲の統計
  const unitSongCountsByReleaseDate = useMemo(() => {
    const units = songs.filter(
      (s) => isCollaborationSong(s) || isFesOverallSong(s),
    );
    return createStatistics(
      units,
      (s) =>
        groupByAlbum ? s.album || getSongKeyTitle(s) : getSongKeyTitle(s),
      groupByAlbum,
    );
  }, [songs, groupByAlbum]);

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
          return s.album || `${normalizedTitle}__${singers}` || normalizedTitle;
        }
        return singers ? `${normalizedTitle}__${singers}` : normalizedTitle;
      },
      groupByAlbum,
    );
  }, [songs, groupByAlbum]);

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
      (s) =>
        groupByAlbum ? s.album || getSongKeyTitle(s) : getSongKeyTitle(s),
      groupByAlbum,
    );
  }, [songs, groupByAlbum]);

  return {
    loading,
    songs,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
    allSongCountsByReleaseDate,
  };
}
