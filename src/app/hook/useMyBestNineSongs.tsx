import { Song } from "../types/song";
import { useCallback } from "react";

/**
 * 最大9曲の「好きな曲」セレクション
 * SNS 共有を主目的とした軽量なデータ構造
 */
export type MyBestNineSongs = {
  title: string; // 必須：セレクション名
  author?: string; // 任意：作成者名
  songs: MyBestNineSongsEntry[]; // 最大9曲
};

export type MyBestNineSongsEntry = {
  v: string; // video_id（圧縮キー）
  s: string; // start（圧縮キー）
};

/**
 * 「好きな曲9選」の URI エンコーディング用フック
 * URL 長を最小化するため、キーと値を圧縮化
 */
const useMyBestNineSongs = () => {
  const MAX_SONGS = 9;

  // 9曲上限チェック
  const isLimit = (selection: MyBestNineSongs): boolean => {
    return selection.songs.length >= MAX_SONGS;
  };

  // 曲の重複チェック
  const isDuplicate = useCallback(
    (selection: MyBestNineSongs, song: Song): boolean => {
      return !!selection.songs.find(
        (entry) => entry.v === song.video_id && entry.s === song.start,
      );
    },
    [],
  );

  // 曲を追加
  const addSong = useCallback((selection: MyBestNineSongs, song: Song) => {
    if (isLimit(selection)) return;
    if (isDuplicate(selection, song)) return;

    selection.songs.push({
      v: song.video_id,
      s: song.start,
    });
  }, []);

  // 曲を削除
  const removeSong = useCallback((selection: MyBestNineSongs, song: Song) => {
    selection.songs = selection.songs.filter(
      (entry) => entry.v !== song.video_id || entry.s !== song.start,
    );
  }, []);

  // 曲が含まれているかチェック
  const isSongIncluded = useCallback(
    (selection: MyBestNineSongs, song: Song): boolean => {
      return !!selection.songs.find(
        (entry) => entry.v === song.video_id && entry.s === song.start,
      );
    },
    [],
  );

  /**
   * URL パラメータにエンコード
   * JSON を最小化してから base64url エンコード
   */
  const encodeToUrlParam = useCallback((selection: MyBestNineSongs): string => {
    // JSON を最小化（キー圧縮済み）
    const compressedData = {
      t: selection.title, // title -> t
      a: selection.author, // author -> a
      s: selection.songs, // songs -> s（既に v, s で圧縮）
    };

    const jsonString = JSON.stringify(compressedData);
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(jsonString);

    // base64url エンコーディング（URL 安全版）
    const binaryString = String.fromCharCode(...utf8Bytes);
    const base64 = btoa(binaryString);

    // + -> -, / -> _, = パディング削除
    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return base64url;
  }, []);

  /**
   * URL パラメータからデコード
   */
  const decodeFromUrlParam = useCallback(
    (param: string): MyBestNineSongs | null => {
      try {
        // base64url デコーディング
        let base64 = param.replace(/-/g, "+").replace(/_/g, "/");
        // パディング復元
        const padding = 4 - (base64.length % 4);
        if (padding !== 4) {
          base64 += "=".repeat(padding);
        }

        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const decoder = new TextDecoder();
        const decoded = decoder.decode(bytes);
        const compressedJson = JSON.parse(decoded);

        const selection: MyBestNineSongs = {
          title: compressedJson.t || "",
          author: compressedJson.a,
          songs: (compressedJson.s || []).map(
            (entry: { v: string; s: string }) => ({
              v: entry.v,
              s: entry.s,
            }),
          ),
        };

        // バリデーション
        if (
          !selection.title ||
          !Array.isArray(selection.songs) ||
          selection.songs.length > MAX_SONGS
        ) {
          return null;
        }

        return selection;
      } catch {
        return null;
      }
    },
    [],
  );

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
