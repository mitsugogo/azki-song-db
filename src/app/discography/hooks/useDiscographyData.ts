import { useState, useEffect, useMemo } from "react";
import { Song } from "../../types/song";
import { createStatistics } from "../createStatistics";
import useSongs from "../../hook/useSongs";

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
      return (
        isOriginal &&
        s.artist.includes("AZKi") &&
        !s.tags.includes("ユニット曲") &&
        !s.tags.includes("ゲスト参加")
      );
    });
    return createStatistics(
      originals,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
      groupByAlbum,
    );
  }, [songs, groupByAlbum, onlyOriginalMV]);

  // ユニット/ゲスト楽曲の統計
  const unitSongCountsByReleaseDate = useMemo(() => {
    const units = songs
      .filter(
        (s) =>
          s.tags.includes("オリ曲") ||
          s.tags.includes("オリ曲MV") ||
          (s.tags.includes("fes全体曲") && s.sing.includes("AZKi")),
      )
      .filter(
        (s) =>
          s.tags.includes("ユニット曲") ||
          s.tags.includes("ゲスト参加") ||
          (s.tags.includes("fes全体曲") && s.sing.includes("AZKi")) ||
          s.title.includes("feat. AZKi") ||
          s.title.includes("feat.AZKi"),
      );
    return createStatistics(
      units,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
      groupByAlbum,
    );
  }, [songs, groupByAlbum]);

  // カバー楽曲の統計
  const coverSongCountsByReleaseDate = useMemo(() => {
    const covers = songs.filter((s) => s.tags.includes("カバー曲"));
    return createStatistics(
      covers,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
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
