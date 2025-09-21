import { useCallback, useEffect, useRef, useState } from "react";
import { Song } from "../types/song";
import useDebounce from "./useDebounce";

/**
 * 検索ロジックを管理するカスタムフック
 * @param allSongs - 全ての曲のリスト
 */
const useSearch = (allSongs: Song[]) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 通常検索
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchSongs = useCallback((songsToFilter: Song[], term: string) => {
    const searchWords = term
      .split(/[\s|\|]+/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);

    // 除外検索ワードの定義
    const excludeWords = searchWords
      .filter((word) => word.startsWith("-") && word.includes(" "))
      .map((word) => word.substring(1, word.indexOf(" ")));

    // 通常検索ワードの定義
    let normalWords = searchWords.filter((word) => !word.startsWith("-"));

    // ソロライブ予習モード(オリ曲のみ絞り込み)
    const isSololive2025 = searchWords.some((word) => word === "sololive2025");

    const isExcluded = (song: Song, excludeWords: string[]) => {
      return excludeWords.some((word) => {
        // プレフィックス付き除外検索
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

        // 除外検索
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
      });
    };

    const matchesNormalWords = (song: Song, normalWords: string[]) => {
      return normalWords.every((word) => {
        // プレフィックス付き検索の定義
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

        // 通常検索
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
      });
    };

    // ソロライブ2025モード
    if (isSololive2025) {
      normalWords = normalWords.filter(
        (word) => !word.startsWith("sololive2025")
      );
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
    }

    return songsToFilter.filter((song) => {
      return (
        matchesNormalWords(song, normalWords) && !isExcluded(song, excludeWords)
      );
    });
  }, []);

  // 検索語の変更を監視し、URLを更新
  useEffect(() => {
    if (isInitialLoading) return;
    const url = new URL(window.location.href);
    if (debouncedSearchTerm) {
      const filteredSongs = searchSongs(allSongs, debouncedSearchTerm);
      setSongs(filteredSongs);
      url.searchParams.set("q", debouncedSearchTerm);
    } else {
      setSongs(allSongs);
      url.searchParams.delete("q");
    }
    history.replaceState(null, "", url);
  }, [debouncedSearchTerm, allSongs, isInitialLoading, searchSongs]);

  return {
    songs,
    setSongs,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    searchSongs,
    isInitialLoading,
    setIsInitialLoading,
  };
};

export default useSearch;
