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

  // 高度な検索
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchArtist, setSearchArtist] = useState("");
  const [searchSinger, setSearchSinger] = useState("");
  const [searchAlbum, setSearchAlbum] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [searchMilestone, setSearchMilestone] = useState("");

  const searchTitleRef = useRef(searchTitle);
  const searchArtistRef = useRef(searchArtist);
  const searchSingerRef = useRef(searchSinger);
  const searchAlbumRef = useRef(searchAlbum);
  const searchTagRef = useRef(searchTag);
  const searchMilestoneRef = useRef(searchMilestone);

  const searchSongs = useCallback((songsToFilter: Song[], term: string) => {
    const searchWords = term
      .split(/\s+/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);

    // 除外検索ワードの定義
    const excludeWords = searchWords
      .filter((word) => word.startsWith("-") && word.includes(" "))
      .map((word) => word.substring(1, word.indexOf(" ")));

    // 通常検索ワードの定義
    const normalWords = searchWords.filter((word) => !word.startsWith("-"));

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
      return songsToFilter
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

  // 高度な検索のキーワードを組み立てる
  const handleAdvancedSearch = useCallback(() => {
    const newSearchTerm = [
      searchTitleRef.current && `title:${searchTitleRef.current}`,
      searchArtistRef.current && `artist:${searchArtistRef.current}`,
      searchAlbumRef.current && `album:${searchAlbumRef.current}`,
      searchTagRef.current && `tag:${searchTagRef.current}`,
      searchSingerRef.current && `sing:${searchSingerRef.current}`,
      searchMilestoneRef.current && `milestone:${searchMilestoneRef.current}`,
    ]
      .filter(Boolean)
      .join(" ");
    setSearchTerm(newSearchTerm);
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
    advancedSearchOpen,
    setAdvancedSearchOpen,
    searchTitle,
    setSearchTitle,
    searchArtist,
    setSearchArtist,
    searchAlbum,
    setSearchAlbum,
    searchSinger,
    setSearchSinger,
    searchTag,
    setSearchTag,
    searchMilestone,
    setSearchMilestone,
    searchTitleRef,
    searchArtistRef,
    searchSingerRef,
    searchTagRef,
    searchMilestoneRef,
    handleAdvancedSearch,
    searchSongs,
    isInitialLoading,
    setIsInitialLoading,
  };
};

export default useSearch;
