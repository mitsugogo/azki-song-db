import { Song } from "../types/song";
import { useCallback } from "react";
import { useUserLibrary } from "../context/UserLibraryContext";

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
  const library = useUserLibrary();
  const favorites = library.favorites;
  const setFavorites = library.setFavorites;

  // お気に入りに追加
  const addToFavorites = useCallback(
    (song: Song) => {
      const videoId = song.video_id;
      const start = String(song.start);

      // 既に追加済みの場合はスキップ
      const exists = favorites.some(
        (entry) => entry.videoId === videoId && entry.start === start,
      );
      if (exists) return;

      setFavorites([...favorites, { videoId, start }]);
    },
    [favorites, setFavorites],
  );

  // お気に入りから削除
  const removeFromFavorites = useCallback(
    (song: Song) => {
      const videoId = song.video_id;
      const start = String(song.start);
      setFavorites(
        favorites.filter(
          (entry) => !(entry.videoId === videoId && entry.start === start),
        ),
      );
    },
    [favorites, setFavorites],
  );

  // お気に入りに入っているかチェック
  const isInFavorites = useCallback(
    (song: Song) => {
      return favorites.some(
        (entry) =>
          entry.videoId === song?.video_id &&
          entry.start === String(song?.start),
      );
    },
    [favorites],
  );

  // お気に入りをトグル
  const toggleFavorite = useCallback(
    (song: Song) => {
      if (!library.authenticated) {
        library.requestSignIn({
          type: "favorite",
          entry: { videoId: song.video_id, start: String(song.start) },
        });
        return;
      }
      if (isInFavorites(song)) {
        removeFromFavorites(song);
      } else {
        addToFavorites(song);
      }
    },
    [isInFavorites, library, removeFromFavorites, addToFavorites],
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
      setFavorites(
        favorites.filter(
          (fav) =>
            !entries.some(
              (entry) =>
                entry.videoId === fav.videoId && entry.start === fav.start,
            ),
        ),
      );
    },
    [favorites, setFavorites],
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
    authenticated: library.authenticated,
    ready: library.ready,
    requestSignIn: library.requestSignIn,
  };
};

export default useFavorites;
