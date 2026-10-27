import { Song } from "../types/song";
import { useCallback } from "react";

import {
  encodeSelection,
  decodeSelection,
  hasFixedSlots,
  MAX_BEST_NINE_SONGS,
} from "@/app/lib/myBestNineSongs";
import type { MyBestNineSongs } from "@/app/lib/myBestNineSongs";
export type {
  MyBestNineSongs,
  MyBestNineSongsEntry,
} from "@/app/lib/myBestNineSongs";

const useMyBestNineSongs = () => {
  const MAX_SONGS = MAX_BEST_NINE_SONGS;

  // 9曲上限チェック
  const isLimit = (selection: MyBestNineSongs): boolean => {
    return selection.songs.length >= MAX_SONGS;
  };

  // 曲の重複チェック
  const isDuplicate = useCallback(
    (selection: MyBestNineSongs, song: Song): boolean => {
      return !!selection.songs.find(
        (entry) => entry.v === song.video_id && entry.s === String(song.start),
      );
    },
    [],
  );

  // 曲を追加
  const addSong = useCallback((selection: MyBestNineSongs, song: Song) => {
    if (isLimit(selection)) return;
    if (!hasFixedSlots(selection) && isDuplicate(selection, song)) return;

    selection.songs.push({
      v: song.video_id,
      s: String(song.start),
      ...(hasFixedSlots(selection)
        ? {
            slot: Array.from({ length: 9 }, (_, slot) => slot).find(
              (slot) =>
                !selection.songs.some(
                  (entry, index) => (entry.slot ?? index) === slot,
                ),
            ),
          }
        : {}),
    });
  }, []);

  // 曲を削除
  const removeSong = useCallback((selection: MyBestNineSongs, song: Song) => {
    selection.songs = selection.songs.filter(
      (entry) => entry.v !== song.video_id || entry.s !== String(song.start),
    );
  }, []);

  // 曲が含まれているかチェック
  const isSongIncluded = useCallback(
    (selection: MyBestNineSongs, song: Song): boolean => {
      return !!selection.songs.find(
        (entry) => entry.v === song.video_id && entry.s === String(song.start),
      );
    },
    [],
  );

  const encodeToUrlParam = useCallback(encodeSelection, []);
  const decodeFromUrlParam = useCallback(decodeSelection, []);

  return {
    MAX_SONGS,
    isLimit,
    isDuplicate,
    addSong,
    removeSong,
    isSongIncluded,
    encodeToUrlParam,
    decodeFromUrlParam,
  };
};

export default useMyBestNineSongs;
