import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import usePlaylists from "./usePlaylists";
import { useDebouncedValue } from "@mantine/hooks";
import { getCollabMembers, normalizeMemberNames } from "../config/collabUnits";
import { useSearchParams } from "next/navigation";
import historyHelper from "../lib/history";
import { filterOriginalSongs } from "../config/filters";

interface UseSearchOptions {
  syncUrl?: boolean;
  urlUpdateMode?: "replace" | "push";
}

/**
 * 検索ロジックを管理するカスタムフック
 * @param allSongs - 全ての曲のリスト
 */
const useSearch = (allSongs: Song[], options?: UseSearchOptions) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const syncUrl = options?.syncUrl ?? true;
  const urlUpdateMode = options?.urlUpdateMode ?? "replace";

  // 通常検索
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const searchTokens = useMemo(
    () =>
      searchTerm
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean),
    [searchTerm],
  );

  // プレイリスト
  const { decodePlaylistUrlParam } = usePlaylists();

  const searchParams = useSearchParams();
  const isSyncingFromUrl = useRef(false);

  // マイルストーンごとのvideo_id一覧を事前に集計
  const milestoneVideoIdMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    allSongs.forEach((song) => {
      if (song.milestones) {
        song.milestones.forEach((milestone) => {
          const key = milestone.toLowerCase();
          if (!map.has(key)) {
            map.set(key, new Set());
          }
          map.get(key)?.add(song.video_id);
        });
      }
    });
    return map;
  }, [allSongs]);

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
        "lyricist:": (s, v) => s.lyricist.toLowerCase().includes(v),
        "composer:": (s, v) => s.composer.toLowerCase().includes(v),
        "arranger:": (s, v) => s.arranger.toLowerCase().includes(v),
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
        "milestone:": (s, v) => {
          if (v === "*") {
            return Boolean(s.milestones && s.milestones.length > 0);
          }
          const videoIdSet = milestoneVideoIdMap.get(v.toLowerCase());
          if (!videoIdSet) return false;
          return videoIdSet.has(s.video_id);
        },
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

      // プレフィックスがない場合は全文検索
      return (
        song.title.toLowerCase().includes(word) ||
        song.artist.toLowerCase().includes(word) ||
        song.album.toLowerCase().includes(word) ||
        song.sing
          .toLowerCase()
          .split("、")
          .some((sing) => sing.includes(word)) ||
        song.tags
          .join(",")
          .toLowerCase()
          .split(",")
          .some((tag) => tag.includes(word)) ||
        song.video_id.toLowerCase().includes(word) ||
        song.video_title.toLowerCase().includes(word) ||
        (song.extra?.toLowerCase().includes(word) ?? false)
      );
    },
    [milestoneVideoIdMap],
  );

  // 曲を検索するcallback
  const searchSongs = useCallback(
    (songsToFilter: Song[], term: string) => {
      // 検索ワードの分割(q=xxx|yyy|zzz)
      const searchWords = term
        .split(/[\|]+/)
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean);

      // 通常検索ワードの定義
      let normalWords = searchWords.filter((word) => !word.startsWith("-"));
      // 除外検索ワードの定義
      const excludeWords = searchWords.filter(
        (word) => word.startsWith("-") && word.length > 1,
      );

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
          .filter((s) => filterOriginalSongs(s))
          .sort((a, b) => {
            // リリース順でソート
            return (
              new Date(a.broadcast_at || "").getTime() -
              new Date(b.broadcast_at || "").getTime()
            );
          });
      } else if (playlist) {
        // プレイリストモード
        const playlistSongs = decodePlaylistUrlParam(playlist);
        if (playlistSongs) {
          // Set/Mapを使用してO(n)に最適化
          const playlistSongSet = new Set(
            playlistSongs.songs.map(
              (entry) => `${entry.videoId}-${entry.start}`,
            ),
          );

          const playlistSongIndexMap = new Map(
            playlistSongs.songs.map((entry, index) => [
              `${entry.videoId}-${entry.start}`,
              index,
            ]),
          );

          songsToFilter = allSongs
            .filter((song) =>
              playlistSongSet.has(`${song.video_id}-${song.start}`),
            )
            .sort((a, b) => {
              const indexA =
                playlistSongIndexMap.get(`${a.video_id}-${a.start}`) ?? 0;
              const indexB =
                playlistSongIndexMap.get(`${b.video_id}-${b.start}`) ?? 0;
              return indexA - indexB;
            });

          // オリ曲モード解除
          setSearchTerm("");
          normalWords = normalWords.filter(
            (word) => word !== "sololive2025" && word !== "original-songs",
          );
        }
      }
      // プレイリストモードの場合は、playPlaylist関数で処理済みなので
      // ここでは何もしない（URLパラメータだけ見て早期リターン）
      else if (playlist) {
        // プレイリストモードの場合は空配列を返す（実際の曲リストはplayPlaylistでセット済み）
        return [];
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
    const playlistFromUrl = searchParams.get("playlist") ?? "";

    if (queryFromUrl !== searchTerm) {
      isSyncingFromUrl.current = true;
      setSearchTerm(queryFromUrl);
    }

    // playlistパラメータがある場合はsearchSongs内で処理されるので、
    // ここで重複して処理しない
    if (!playlistFromUrl) {
      const filteredSongs = searchSongs(allSongs, queryFromUrl);
      setSongs(filteredSongs);
    }
  }, [searchParams, allSongs, searchSongs]);

  // URL更新（即座に）
  useEffect(() => {
    if (!syncUrl) return;

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

      if (urlUpdateMode === "push") {
        historyHelper.pushUrlIfDifferent(url.href);
      } else {
        historyHelper.replaceUrlIfDifferent(url.href);
      }
    }
  }, [searchTerm, syncUrl, urlUpdateMode]);

  // リアルタイム検索（debounce適用）
  useEffect(() => {
    // 楽曲のフィルタリングを実行
    const newSongs = searchSongs(allSongs, debouncedSearchTerm);

    // 配列の長さが異なるか、曲IDの並びが変わった場合のみセットする
    const isSameOrder =
      newSongs.length === songs.length &&
      newSongs.every(
        (song, index) =>
          song.video_id === songs[index]?.video_id &&
          song.start === songs[index]?.start,
      );

    if (!isSameOrder) {
      setSongs(newSongs);
    }
  }, [debouncedSearchTerm, allSongs, searchSongs]);

  return {
    songs,
    setSongs,
    searchTerm,
    searchTokens,
    setSearchTerm,
    searchSongs,
  };
};

export default useSearch;
