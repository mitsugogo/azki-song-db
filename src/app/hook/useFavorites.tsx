import { Song } from "../types/song";
import { useLocalStorage } from "@mantine/hooks";
import { useCallback } from "react";

export type FavoriteEntry = {
  videoId: string;
  start: string;
};

/**
 * お気に入り機能を提供するカスタムフック
 * ユーザーが作成したプレイリストとは別管理
 * @returns
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage<FavoriteEntry[]>({
    key: "system-favorites",
    defaultValue: [],
  });

  // お気に入りに追加
  const addToFavorites = useCallback(
    (song: Song) => {
      const videoId = song.video_id;
      const start = song.start;

      // 既に追加済みの場合はスキップ
      const exists = favorites.some(
        (entry) => entry.videoId === videoId && entry.start === start,
      );
      if (exists) return;

      setFavorites((prev) => [...prev, { videoId, start }]);
    },
    [favorites, setFavorites],
  );

  // お気に入りから削除
  const removeFromFavorites = useCallback(
    (song: Song) => {
      const videoId = song.video_id;
      const start = song.start;
      setFavorites((prev) =>
        prev.filter(
          (entry) => !(entry.videoId === videoId && entry.start === start),
        ),
      );
    },
    [setFavorites],
  );

  // お気に入りに入っているかチェック
  const isInFavorites = useCallback(
    (song: Song) => {
      return favorites.some(
        (entry) =>
          entry.videoId === song?.video_id && entry.start === song?.start,
      );
    },
    [favorites],
  );

  // お気に入りをトグル
  const toggleFavorite = useCallback(
    (song: Song) => {
      if (isInFavorites(song)) {
        removeFromFavorites(song);
      } else {
        addToFavorites(song);
      }
    },
    [isInFavorites, removeFromFavorites, addToFavorites],
  );

  // お気に入りを並び替え
  const reorderFavorites = useCallback(
    (reorderedFavorites: FavoriteEntry[]) => {
      setFavorites(reorderedFavorites);
    },
    [setFavorites],
  );

  // お気に入りを全て削除
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
  }, [setFavorites]);

  // 複数のお気に入りを削除
  const removeMultipleFavorites = useCallback(
    (entries: FavoriteEntry[]) => {
      setFavorites((prev) =>
        prev.filter(
          (fav) =>
            !entries.some(
              (entry) =>
                entry.videoId === fav.videoId && entry.start === fav.start,
            ),
        ),
      );
    },
    [setFavorites],
  );

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    toggleFavorite,
    reorderFavorites,
    clearAllFavorites,
    removeMultipleFavorites,
  };
};

export default useFavorites;
