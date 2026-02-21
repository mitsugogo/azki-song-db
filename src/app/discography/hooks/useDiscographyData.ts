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
      (s) => (groupByAlbum ? s.album || s.title : s.title),
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
      (s) => (groupByAlbum ? s.album || s.title : s.title),
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
        if (groupByAlbum) return s.album || `${s.title}__${singers}` || s.title;
        return singers ? `${s.title}__${singers}` : s.title;
      },
      groupByAlbum,
    );
  }, [songs, groupByAlbum]);

  return {
    loading,
    songs,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  };
}
