import { useCallback, useEffect, useRef, useState } from "react";
import { Song } from "../types/song";
import usePlaylists from "./usePlaylists";
import { useDebouncedValue } from "@mantine/hooks";
import { getCollabMembers, normalizeMemberNames } from "../config/collabUnits";
import { useSearchParams } from "next/navigation";

/**
 * 検索ロジックを管理するカスタムフック
 * @param allSongs - 全ての曲のリスト
 */
const useSearch = (allSongs: Song[]) => {
  const [songs, setSongs] = useState<Song[]>([]);

  // 通常検索
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);

  // プレイリスト
  const { decodePlaylistUrlParam } = usePlaylists();

  const searchParams = useSearchParams();
  const isSyncingFromUrl = useRef(false);

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
        "year:": (s, v) => {
          const yearNumber = Number(v);
          return s.year === yearNumber;
        },
        "milestone:": (s, v) =>
          v === "*"
            ? (s.milestones?.length ?? 0) > 0
            : (s.milestones?.some((m) => m.includes(v)) ?? false),
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
        "unit:": (s, v) => {
          // ユニット通称で検索
          if (s.sing === "") return false;
          const singers = s.sing
            .split("、")
            .map((singer) => singer.trim())
            .filter((singer) => singer !== "");
          if (singers.length < 2) return false;

          // ユニット通称から実際のメンバーを取得（大文字小文字を区別しない）
          const unitMembers = getCollabMembers(v);
          if (!unitMembers) {
            return false;
          }

          // 曲の歌手とユニットメンバーを正規化して比較
          const normalizedSingers = normalizeMemberNames(singers);
          const normalizedUnitMembers = normalizeMemberNames(unitMembers);

          return (
            normalizedSingers.length === normalizedUnitMembers.length &&
            normalizedSingers.every(
              (singer, i) => singer === normalizedUnitMembers[i],
            )
          );
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
    [],
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
      const isOriginalSongsMode = searchWords.some(
        (word) => word === "sololive2025" || word === "original-songs",
      );
      const urlParams = new URLSearchParams(window.location.search);
      const playlist = urlParams.get("playlist");

      // オリ曲モード(オリ曲のみ絞り込み)
      if (isOriginalSongsMode) {
        // 検索ワードからマジックワードを除く
        normalWords = normalWords.filter(
          (word) => word !== "sololive2025" && word !== "original-songs",
        );

        // 予習曲のみ絞り込み
        songsToFilter = songsToFilter
          .filter(
            (s) =>
              // AZKiさんオリ曲絞り込み
              (s.tags.includes("オリ曲") ||
                s.tags.includes("オリ曲MV") ||
                s.tags.includes("ライブ予習")) &&
              s.artist.includes("AZKi") &&
              !s.title.includes("Maaya") &&
              !s.title.includes("Remix") &&
              !s.tags.includes("リミックス") &&
              !s.title.includes("あずいろ") &&
              !s.title.includes("Kiss me"),
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
        // Headerなどに通知
        window.dispatchEvent(new Event("replacestate"));
      } else if (playlist) {
        // プレイリストモード
        const playlistSongs = decodePlaylistUrlParam(playlist);
        if (playlistSongs) {
          songsToFilter = allSongs
            .filter((song) =>
              playlistSongs.songs.find(
                (entry) =>
                  entry.videoId === song.video_id &&
                  Number(String(entry.start)) === Number(song.start),
              ),
            )
            .sort((a, b) => {
              return (
                playlistSongs.songs.findIndex(
                  (entry) =>
                    entry.videoId === a.video_id &&
                    Number(String(entry.start)) === Number(a.start),
                ) -
                playlistSongs.songs.findIndex(
                  (entry) =>
                    entry.videoId === b.video_id &&
                    Number(String(entry.start)) === Number(b.start),
                )
              );
            });

          // オリ曲モード解除
          setSearchTerm("");
          normalWords = normalWords.filter(
            (word) => word !== "sololive2025" && word !== "original-songs",
          );
          urlParams.delete("q");
          window.history.replaceState({}, "", `?${urlParams.toString()}`);
          // Headerなどに通知
          window.dispatchEvent(new Event("replacestate"));
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

      // 楽曲紹介shortsの場合は逆順に並べる
      if (normalWords.some((word) => word === "tag:楽曲紹介shorts")) {
        return songsToFilter
          .filter((song) => {
            return (
              matchesNormalWords(song, normalWords) &&
              !isExcluded(song, excludeWords)
            );
          })
          .sort((a, b) => {
            return (
              new Date(a.broadcast_at || "").getTime() -
              new Date(b.broadcast_at || "").getTime()
            );
          });
      }

      return songsToFilter.filter((song) => {
        return (
          matchesNormalWords(song, normalWords) &&
          !isExcluded(song, excludeWords)
        );
      });
    },
    [allSongs],
  );

  // 検索パラメータ（?q=...）変更時に検索条件を同期
  useEffect(() => {
    if (!searchParams) return;
    const queryFromUrl = searchParams.get("q") ?? "";

    if (queryFromUrl !== searchTerm) {
      isSyncingFromUrl.current = true;
      setSearchTerm(queryFromUrl);
    }

    const filteredSongs = searchSongs(allSongs, queryFromUrl);
    setSongs(filteredSongs);
  }, [searchParams, allSongs, searchSongs]);

  // URL更新（即座に）
  useEffect(() => {
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    const url = new URL(window.location.href);
    const currentQ = url.searchParams.get("q") || "";

    if (searchTerm !== currentQ) {
      if (searchTerm) {
        url.searchParams.set("q", searchTerm);
      } else {
        url.searchParams.delete("q");
      }

      history.replaceState(null, "", url.href);
      window.dispatchEvent(new Event("replacestate"));
    }
  }, [searchTerm]);

  // リアルタイム検索（debounce適用）
  useEffect(() => {
    // 楽曲のフィルタリングを実行
    const newSongs = searchSongs(allSongs, debouncedSearchTerm);

    // 配列の長さが異なるか、中身が異なる場合のみセットする
    if (
      newSongs.length !== songs.length ||
      JSON.stringify(newSongs) !== JSON.stringify(songs)
    ) {
      setSongs(newSongs);
    }
  }, [debouncedSearchTerm, allSongs, searchSongs]);

  return {
    songs,
    setSongs,
    searchTerm,
    setSearchTerm,
    searchSongs,
  };
};

export default useSearch;
