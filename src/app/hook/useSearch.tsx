import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import usePlaylists from "./usePlaylists";
import { useDebouncedValue } from "@mantine/hooks";
import { getCollabMembers, normalizeMemberNames } from "../config/collabUnits";
import { useSearchParams } from "next/navigation";
import historyHelper from "../lib/history";
import { useLocale } from "next-intl";
import {
  filterOriginalSongs,
  isCollaborationSong,
  isCoverSong,
} from "../config/filters";

interface UseSearchOptions {
  syncUrl?: boolean;
  urlUpdateMode?: "replace" | "push";
}

type SearchToken = {
  term: string;
  isExact: boolean;
};

const isWrappedWithQuotes = (value: string) =>
  value.length >= 2 && value.startsWith('"') && value.endsWith('"');

const parseSearchToken = (value: string): SearchToken | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const prefixSeparatorIndex = normalized.indexOf(":");
  if (prefixSeparatorIndex === -1) {
    if (isWrappedWithQuotes(normalized)) {
      return {
        term: normalized.substring(1, normalized.length - 1),
        isExact: true,
      };
    }
    return { term: normalized, isExact: false };
  }

  const prefix = normalized.substring(0, prefixSeparatorIndex + 1);
  const rawValue = normalized.substring(prefixSeparatorIndex + 1).trim();
  if (!rawValue) {
    return { term: `${prefix}`, isExact: false };
  }

  if (isWrappedWithQuotes(rawValue)) {
    return {
      term: `${prefix}${rawValue.substring(1, rawValue.length - 1)}`,
      isExact: true,
    };
  }

  return { term: `${prefix}${rawValue}`, isExact: false };
};

const splitByOrKeyword = (value: string): string[] => {
  const tokens: string[] = [];
  let inQuotes = false;
  let segmentStart = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) {
      continue;
    }

    const maybeOperator = value.slice(index, index + 2).toLowerCase();
    const hasLeadingSpace = index > 0 && /\s/.test(value[index - 1]);
    const hasTrailingSpace =
      index + 2 < value.length && /\s/.test(value[index + 2]);

    if (hasLeadingSpace && hasTrailingSpace && maybeOperator === "or") {
      const chunk = value.slice(segmentStart, index).trim();
      if (chunk) {
        tokens.push(chunk);
      }
      segmentStart = index + 2;
      index += 1;
    }
  }

  const lastChunk = value.slice(segmentStart).trim();
  if (lastChunk) {
    tokens.push(lastChunk);
  }

  return tokens;
};

/**
 * 検索ロジックを管理するカスタムフック
 * @param allSongs - 全ての曲のリスト
 */
const useSearch = (allSongs: Song[], options?: UseSearchOptions) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const syncUrl = options?.syncUrl ?? true;
  const urlUpdateMode = options?.urlUpdateMode ?? "replace";
  const locale = useLocale();

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
  const previousUrlSyncState = useRef<{ q: string; playlist: string } | null>(
    null,
  );

  const isSameSongOrder = useCallback(
    (leftSongs: Song[], rightSongs: Song[]) => {
      return (
        leftSongs.length === rightSongs.length &&
        rightSongs.every(
          (song, index) =>
            song.video_id === leftSongs[index]?.video_id &&
            song.start === leftSongs[index]?.start &&
            song.title === leftSongs[index]?.title,
        )
      );
    },
    [],
  );

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
    (word: string, isExact = false) =>
      (song: Song) => {
        const equalsOrIncludes = (source: string, target: string) =>
          isExact ? source === target : source.includes(target);

        const prefixSearches: {
          [key: string]: (song: Song, value: string) => boolean;
        } = {
          "title:": (s, v) =>
            equalsOrIncludes(s.title.toLowerCase(), v) ||
            (locale === "en" &&
              (s.title_en
                ? equalsOrIncludes(s.title_en.toLowerCase(), v)
                : false)),
          "artist:": (s, v) =>
            equalsOrIncludes(s.artist.toLowerCase(), v) ||
            (locale === "en" &&
              (s.artist_en
                ? equalsOrIncludes(s.artist_en.toLowerCase(), v)
                : false)),
          "album:": (s, v) => equalsOrIncludes(s.album.toLowerCase(), v),
          "sing:": (s, v) =>
            s.sing
              .toLowerCase()
              .split("、")
              .map((sing) => sing.trim())
              .some((sing) => equalsOrIncludes(sing, v)),
          "lyricist:": (s, v) => equalsOrIncludes(s.lyricist.toLowerCase(), v),
          "composer:": (s, v) => equalsOrIncludes(s.composer.toLowerCase(), v),
          "arranger:": (s, v) => equalsOrIncludes(s.arranger.toLowerCase(), v),
          "tag:": (s, v) =>
            s.tags
              .join(",")
              .toLowerCase()
              .split(",")
              .map((tag) => tag.trim())
              .some((tag) => equalsOrIncludes(tag, v)),
          "video_id:": (s, v) => equalsOrIncludes(s.video_id.toLowerCase(), v),
          "video_title:": (s, v) =>
            equalsOrIncludes(s.video_title.toLowerCase(), v),
          "extra:": (s, v) =>
            s.extra ? equalsOrIncludes(s.extra.toLowerCase(), v) : false,
          "date:": (s, v) => {
            const dateString = new Date(v).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            });
            const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
            if (dateRegex.test(dateString)) {
              const [year, month, day] = dateString.split("/").map(Number);
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
          equalsOrIncludes(song.title.toLowerCase(), word) ||
          equalsOrIncludes(song.artist.toLowerCase(), word) ||
          (locale === "en" &&
            (song.title_en
              ? equalsOrIncludes(song.title_en.toLowerCase(), word)
              : false)) ||
          (locale === "en" &&
            (song.artist_en
              ? equalsOrIncludes(song.artist_en.toLowerCase(), word)
              : false)) ||
          equalsOrIncludes(song.album.toLowerCase(), word) ||
          song.sing
            .toLowerCase()
            .split("、")
            .map((sing) => sing.trim())
            .some((sing) => equalsOrIncludes(sing, word)) ||
          song.tags
            .join(",")
            .toLowerCase()
            .split(",")
            .map((tag) => tag.trim())
            .some((tag) => equalsOrIncludes(tag, word)) ||
          equalsOrIncludes(song.video_id.toLowerCase(), word) ||
          equalsOrIncludes(song.video_title.toLowerCase(), word) ||
          (song.extra
            ? equalsOrIncludes(song.extra.toLowerCase(), word)
            : false)
        );
      },
    [locale, milestoneVideoIdMap],
  );

  // 曲を検索するcallback
  const searchSongs = useCallback(
    (songsToFilter: Song[], term: string) => {
      // 検索ワードの分割(q=xxx|yyy|zzz)
      const andClauses = term
        .split(/[\|]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      const positiveOrGroups: SearchToken[][] = [];
      const excludeWords: SearchToken[] = [];

      andClauses.forEach((clause) => {
        const orChunks = splitByOrKeyword(clause);
        const group: SearchToken[] = [];

        orChunks.forEach((chunk) => {
          const trimmedChunk = chunk.trim();
          const isExclude = trimmedChunk.startsWith("-");
          const tokenBody = isExclude
            ? trimmedChunk.substring(1).trim()
            : trimmedChunk;
          const parsedToken = parseSearchToken(tokenBody);

          if (!parsedToken) {
            return;
          }

          if (isExclude) {
            excludeWords.push(parsedToken);
            return;
          }

          group.push(parsedToken);
        });

        if (group.length > 0) {
          positiveOrGroups.push(group);
        }
      });

      const normalWords = positiveOrGroups.flat();

      // song mode判定は部分一致トークンのみ対象にする
      let filteredNormalWords = normalWords;

      const songModePredicates: Record<string, (song: Song) => boolean> = {
        sololive2025: filterOriginalSongs,
        "original-songs": filterOriginalSongs,
        "cover-songs": isCoverSong,
        "collaboration-songs": isCollaborationSong,
      };

      const selectedSongMode = filteredNormalWords.find(
        (word) => !word.isExact && songModePredicates[word.term],
      );

      // 特殊モード判定
      const playlist = searchParams?.get("playlist") ?? "";

      // 曲モード（オリ曲/カバー曲/コラボ曲）
      if (selectedSongMode) {
        // 検索ワードからマジックワードを除く
        filteredNormalWords = filteredNormalWords.filter(
          (word) => !songModePredicates[word.term],
        );

        songsToFilter = songsToFilter.filter((song) =>
          songModePredicates[selectedSongMode.term](song),
        );

        if (
          selectedSongMode.term === "sololive2025" ||
          selectedSongMode.term === "original-songs"
        ) {
          songsToFilter = songsToFilter.sort((a, b) => {
            // リリース順でソート
            return (
              new Date(a.broadcast_at || "").getTime() -
              new Date(b.broadcast_at || "").getTime()
            );
          });
        }
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
          filteredNormalWords = filteredNormalWords.filter(
            (word) => !songModePredicates[word.term],
          );
        }
      }
      // プレイリストモードの場合は、playPlaylist関数で処理済みなので
      // ここでは何もしない（URLパラメータだけ見て早期リターン）
      else if (playlist) {
        // プレイリストモードの場合は空配列を返す（実際の曲リストはplayPlaylistでセット済み）
        return [];
      }

      const isExcluded = (song: Song, excludeTerms: SearchToken[]) => {
        return excludeTerms.some((word) => {
          return filterCallback(word.term, word.isExact)(song);
        });
      };

      const matchesOrGroups = (song: Song, groups: SearchToken[][]) => {
        if (groups.length === 0) {
          return true;
        }

        return groups.every((group) => {
          return group.some((word) =>
            filterCallback(word.term, word.isExact)(song),
          );
        });
      };

      const activeOrGroups = positiveOrGroups
        .map((group) =>
          group.filter(
            (word) => !songModePredicates[word.term] || word.isExact,
          ),
        )
        .filter((group) => group.length > 0);

      const isAlbumOnlySearch =
        filteredNormalWords.length > 0 &&
        excludeWords.length === 0 &&
        filteredNormalWords.every((word) => word.term.startsWith("album:"));

      // 楽曲紹介shortsの場合は逆順に並べる
      if (
        filteredNormalWords.some((word) => word.term === "tag:楽曲紹介shorts")
      ) {
        return songsToFilter
          .filter((song) => {
            return (
              matchesOrGroups(song, activeOrGroups) &&
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

      const filteredSongs = songsToFilter.filter((song) => {
        return (
          matchesOrGroups(song, activeOrGroups) &&
          !isExcluded(song, excludeWords)
        );
      });

      if (isAlbumOnlySearch) {
        return [...filteredSongs].sort((a, b) => {
          const leftOrder = a.source_order ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = b.source_order ?? Number.MAX_SAFE_INTEGER;
          return leftOrder - rightOrder;
        });
      }

      return filteredSongs;
    },
    [allSongs, decodePlaylistUrlParam, filterCallback, searchParams],
  );

  // 検索パラメータ（?q=...）変更時に検索条件を同期
  useEffect(() => {
    if (!searchParams) return;
    const queryFromUrl = searchParams.get("q") ?? "";
    const playlistFromUrl = searchParams.get("playlist") ?? "";
    const previousSyncState = previousUrlSyncState.current;
    const hasUrlFilterStateChanged =
      previousSyncState?.q !== queryFromUrl ||
      previousSyncState?.playlist !== playlistFromUrl;

    if (!hasUrlFilterStateChanged) {
      return;
    }

    previousUrlSyncState.current = {
      q: queryFromUrl,
      playlist: playlistFromUrl,
    };

    if (queryFromUrl !== searchTerm) {
      isSyncingFromUrl.current = true;
      setSearchTerm(queryFromUrl);
    }

    // playlistパラメータがある場合はsearchSongs内で処理されるので、
    // ここで重複して処理しない
    if (!playlistFromUrl) {
      const filteredSongs = searchSongs(allSongs, queryFromUrl);
      setSongs((previousSongs) =>
        isSameSongOrder(previousSongs, filteredSongs)
          ? previousSongs
          : filteredSongs,
      );
    }
  }, [searchParams, allSongs, searchSongs, searchTerm, isSameSongOrder]);

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
    if (debouncedSearchTerm !== searchTerm) {
      return;
    }

    // 楽曲のフィルタリングを実行
    const newSongs = searchSongs(allSongs, debouncedSearchTerm);

    setSongs((previousSongs) =>
      isSameSongOrder(previousSongs, newSongs) ? previousSongs : newSongs,
    );
  }, [debouncedSearchTerm, allSongs, searchSongs, isSameSongOrder]);

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
