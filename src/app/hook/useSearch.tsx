import { useCallback, useEffect, useState } from "react";
import { Song } from "../types/song";
import useDebounce from "./useDebounce";
import usePlaylists from "./usePlaylists";
import { useDebouncedState } from "@mantine/hooks";

/**
 * 検索ロジックを管理するカスタムフック
 * @param allSongs - 全ての曲のリスト
 */
const useSearch = (allSongs: Song[]) => {
  const [songs, setSongs] = useState<Song[]>([]);

  // 通常検索
  const [searchTerm, setSearchTerm] = useDebouncedState("", 300);

  // プレイリスト
  const { decodePlaylistUrlParam } = usePlaylists();

  // 検索ロジック
  const filterCallback = useCallback(
    (word: string) => (song: Song) => {
      const prefixSearches: {
        [key: string]: (song: Song, value: string) => boolean;
      } = {
        "title:": (s, v) => s.title.toLowerCase().includes(v),
        "artist:": (s, v) => s.artist.toLowerCase().includes(v),
        "album:": (s, v) => s.album.toLowerCase().includes(v),
        "sing:": (s, v) =>
          s.sing
            .toLowerCase()
            .split("、")
            .some((sing) => sing.includes(v)),
        "tag:": (s, v) =>
          s.tags
            .join(",")
            .toLowerCase()
            .split(",")
            .some((tag) => tag.includes(v)),
        "video_id:": (s, v) => s.video_id.toLowerCase().includes(v),
        "video_title:": (s, v) => s.video_title.toLowerCase().includes(v),
        "extra:": (s, v) => s.extra?.toLowerCase().includes(v) ?? false,
        "date:": (s, v) => {
          const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
          if (dateRegex.test(v)) {
            const [year, month, day] = v.split("/").map(Number);
            const date = new Date(s.broadcast_at);
            return (
              date.getFullYear() === year &&
              date.getMonth() + 1 === month &&
              date.getDate() === day
            );
          }
          return false;
        },
        "milestone:": (s, v) =>
          v === "*"
            ? (s.milestones?.length ?? 0) > 0
            : s.milestones?.some((m) => m.includes(v)) ?? false,
        "season:": (s, v) => {
          const month = new Date(s.broadcast_at).getMonth() + 1;
          switch (v) {
            case "春":
              return month >= 3 && month <= 5;
            case "夏":
              return month >= 6 && month <= 9;
            case "秋":
              return month >= 10 && month <= 11;
            case "冬":
              return month >= 12 || (month >= 1 && month <= 2);
            default:
              return false;
          }
        },
      };

      for (const prefix in prefixSearches) {
        if (word.startsWith(prefix)) {
          return prefixSearches[prefix](song, word.substring(prefix.length));
        }
      }

      return (
        song.title.toLowerCase().includes(word) ||
        song.artist.toLowerCase().includes(word) ||
        song.album.toLowerCase().includes(word) ||
        song.sing.toLowerCase().includes(word) ||
        song.tags.some((tag) => tag.toLowerCase().includes(word)) ||
        song.video_title.toLowerCase().includes(word) ||
        (song.extra && song.extra.toLowerCase().includes(word)) ||
        (song.milestones &&
          song.milestones.some((m) => m.toLowerCase().includes(word)))
      );
    },
    []
  );

  // 曲を検索するcallback
  const searchSongs = useCallback(
    (songsToFilter: Song[], term: string) => {
      // 検索ワードの分割(q=xxx|yyy|zzz)
      const searchWords = term
        .split(/[\s|\|]+/)
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean);

      // 通常検索ワードの定義
      let normalWords = searchWords.filter((word) => !word.startsWith("-"));
      // 除外検索ワードの定義
      const excludeWords = searchWords.filter((word) => word.startsWith("-"));

      // 特殊モード判定
      const isSololive2025 = searchWords.some(
        (word) => word === "sololive2025"
      );
      const urlParams = new URLSearchParams(window.location.search);
      const playlist = urlParams.get("playlist");

      // ソロライブ予習モード(オリ曲のみ絞り込み)
      if (isSololive2025) {
        // 検索ワードからマジックワードを除く
        normalWords = normalWords.filter((word) => word !== "sololive2025");

        // 予習曲のみ絞り込み
        songsToFilter = songsToFilter
          .filter(
            (s) =>
              (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
              s.artist.includes("AZKi") &&
              !s.title.includes("Maaya") &&
              !s.artist.includes("星街") &&
              !s.title.includes("Remix") &&
              !s.tags.includes("リミックス") &&
              !s.title.includes("Kiss me")
          )
          .sort((a, b) => {
            // リリース順でソート
            return (
              new Date(a.broadcast_at || "").getTime() -
              new Date(b.broadcast_at || "").getTime()
            );
          });

        // playlist削除
        urlParams.delete("playlist");
        window.history.replaceState({}, "", `?${urlParams.toString()}`);
      } else if (playlist) {
        // プレイリストモード
        const playlistSongs = decodePlaylistUrlParam(playlist);
        if (playlistSongs) {
          songsToFilter = allSongs
            .filter((song) =>
              playlistSongs.songs.find(
                (entry) =>
                  entry.videoId === song.video_id &&
                  Number(String(entry.start)) === Number(song.start)
              )
            )
            .sort((a, b) => {
              return (
                playlistSongs.songs.findIndex(
                  (entry) =>
                    entry.videoId === a.video_id &&
                    Number(String(entry.start)) === Number(a.start)
                ) -
                playlistSongs.songs.findIndex(
                  (entry) =>
                    entry.videoId === b.video_id &&
                    Number(String(entry.start)) === Number(b.start)
                )
              );
            });

          // sololiveモード解除
          setSearchTerm("");
          normalWords = normalWords.filter((word) => word !== "sololive2025");
          urlParams.delete("q");
          window.history.replaceState({}, "", `?${urlParams.toString()}`);
        }
      }

      const isExcluded = (song: Song, excludeWords: string[]) => {
        return excludeWords.some((word: string) => {
          // ハイフンを削除してからfilterCallbackを呼び出す
          return filterCallback(word.substring(1))(song);
        });
      };

      const matchesNormalWords = (song: Song, normalWords: string[]) => {
        return normalWords.every((word: string) => {
          return filterCallback(word)(song);
        });
      };

      return songsToFilter.filter((song) => {
        return (
          matchesNormalWords(song, normalWords) &&
          !isExcluded(song, excludeWords)
        );
      });
    },
    [allSongs]
  );

  // 初期ロード時のURLパラメータ処理
  useEffect(() => {
    if (allSongs.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");

    let filteredSongs = allSongs;
    filteredSongs = searchSongs(filteredSongs, query || "");
    setSongs(filteredSongs);
    if (query) {
      setSearchTerm(query);
    }
  }, [allSongs]);

  // ページロード時はq=xxxのURLパラメータを取得して検索
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    if (query) {
      setSearchTerm(query);
    }
  }, []);

  // リアルタイム検索とURL更新
  useEffect(() => {
    const url = new URL(window.location.href);

    if (searchTerm) {
      url.searchParams.set("q", searchTerm);
      history.pushState(null, "", url.href);
    } else {
      url.searchParams.delete("q");
      history.pushState(null, "", url.href);
    }
    const newSongs = searchSongs(allSongs, searchTerm);

    // 変更があるときだけ setSongs
    if (JSON.stringify(newSongs) !== JSON.stringify(songs)) {
      setSongs(newSongs);
    }
  }, [searchTerm, allSongs, searchSongs, decodePlaylistUrlParam]);

  return {
    songs,
    setSongs,
    searchTerm,
    setSearchTerm,
    searchSongs,
  };
};

export default useSearch;
