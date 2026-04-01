"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Song } from "../types/song";
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import { useVirtualizer } from "@tanstack/react-virtual";
import historyHelper from "../lib/history";
import useSearchFilterModeData, {
  FilterMode,
  SearchBrowseSortMode,
} from "./hook/useSearchFilterModeData";
import SearchLoadingView from "./components/SearchLoadingView";
import SearchResultsView from "./components/SearchResultsView";
import SearchNoResultsView from "./components/SearchNoResultsView";
import SearchBrowseView from "./components/SearchBrowseView";
import { isCoverSong, isOriginalSong } from "../config/filters";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/app/types/locale";

interface TagCategory {
  label: string;
  value: string;
  filter: (songs: Song[]) => Song[];
}

const getGridCols = (width: number): number => {
  if (width >= 5120) return 20;
  if (width >= 3840) return 16;
  if (width >= 2560) return 12;
  if (width >= 1920) return 10;
  if (width >= 1440) return 8;
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  return 3;
};

const SearchPageClient = () => {
  const { allSongs, isLoading } = useSongs();
  const [windowWidth, setWindowWidth] = useState(0);
  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("categories");
  const [sortMode, setSortMode] = useState<SearchBrowseSortMode>("count-desc");

  const { songs, searchTerm, searchTokens, setSearchTerm } = useSearch(
    allSongs,
    {
      syncUrl: true,
      urlUpdateMode: "push",
    },
  );

  useEffect(() => {
    const next = searchTokens.join("|");
    const current = searchValue.join("|");
    if (next !== current) {
      setSearchValue(searchTokens);
    }
  }, [searchTokens, searchValue]);

  const t = useTranslations("SearchPage");

  const tagCategories: TagCategory[] = useMemo(
    () => [
      {
        label: t("originalSongs"),
        value: "tag:オリ曲",
        filter: (songs) => songs.filter((song) => isOriginalSong(song)),
      },
      {
        label: t("coverSongs"),
        value: "tag:歌ってみた",
        filter: (songs) =>
          songs.filter(
            (song) => isCoverSong(song) && !song.tags.includes("コラボ"),
          ),
      },
      {
        label: t("coverCollab"),
        value: "tag:歌ってみた|tag:コラボ",
        filter: (songs) =>
          songs.filter(
            (song) => isCoverSong(song) && song.tags.includes("コラボ"),
          ),
      },
      {
        label: t("karaoke"),
        value: "tag:歌枠",
        filter: (songs) => songs.filter((song) => song.tags.includes("歌枠")),
      },
      {
        label: t("anniversaryLive"),
        value: "tag:記念ライブ",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("記念ライブ")),
      },
      {
        label: t("guestAppearance"),
        value: "tag:ゲスト出演",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("ゲスト出演")),
      },
      {
        label: t("ballad"),
        value: "バラード|しっとり",
        filter: (songs) =>
          songs.filter(
            (song) =>
              song.video_title.includes("バラード") ||
              song.video_title.includes("しっとり") ||
              song.tags.includes("バラード") ||
              song.tags.includes("しっとり"),
          ),
      },
      {
        label: t("acoustic"),
        value: "tag:アコースティック|アコースティック|生演奏",
        filter: (songs) =>
          songs.filter(
            (song) =>
              song.tags.includes("アコースティック") ||
              song.video_title.includes("アコースティック") ||
              song.video_title.includes("生演奏"),
          ),
      },
    ],
    [],
  );

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("tag")) {
      url.searchParams.delete("tag");
      historyHelper.replaceUrlIfDifferent(url.href);
    }
  }, []);

  const colCount = useMemo(() => getGridCols(windowWidth), [windowWidth]);
  const categorySongs = useMemo(() => {
    return tagCategories.map((category) => {
      const filtered = category.filter(allSongs);
      filtered.sort((a, b) => {
        return (
          new Date(b.broadcast_at).getTime() -
          new Date(a.broadcast_at).getTime()
        );
      });
      return {
        ...category,
        songs: filtered.slice(0, 16),
        totalCount: filtered.length,
      };
    });
  }, [allSongs, tagCategories]);

  const hasSearchTerm = searchTerm.trim().length > 0;
  const filteredSongs = useMemo(
    () => (hasSearchTerm ? songs : []),
    [hasSearchTerm, songs],
  );

  const locale = useLocale();
  const filterModeData = useSearchFilterModeData(
    allSongs,
    filterMode,
    sortMode,
    locale as Locale,
  );
  const isShowingSearchResults =
    !isLoading && hasSearchTerm && filteredSongs.length > 0;

  const parentRef = useRef<HTMLDivElement | null>(null);
  const desiredCols = Math.max(colCount, 1);
  const [resolvedCols, setResolvedCols] = useState<number>(desiredCols);
  const cols = Math.max(resolvedCols, 1);
  const rowCount = Math.ceil(filteredSongs.length / cols);
  const [estimatedRowHeight, setEstimatedRowHeight] = useState<number>(320);
  const [estimatedItemWidth, setEstimatedItemWidth] = useState<number>(240);
  const [wrapperWidth, setWrapperWidth] = useState<number | "100%">("100%");

  useLayoutEffect(() => {
    if (!isShowingSearchResults) {
      return;
    }

    const compute = () => {
      const parentElement = parentRef.current;
      const fallbackWidth = windowWidth || 1024;
      let containerWidth = fallbackWidth;

      if (parentElement) {
        const style = window.getComputedStyle(parentElement);
        const horizontalPadding =
          parseFloat(style.paddingLeft || "0") +
          parseFloat(style.paddingRight || "0");
        const availableWidth = parentElement.clientWidth - horizontalPadding;
        // SearchResultsView 側の p-3（左右 12px ずつ）分を差し引く
        containerWidth = Math.max(availableWidth - 24, 0);
      }

      const gap = 16;
      const minItemWidth = 120;
      const maxColsByWidth = Math.max(
        1,
        Math.floor((containerWidth + gap) / (minItemWidth + gap)),
      );
      const nextCols = Math.min(desiredCols, maxColsByWidth);
      const totalGap = Math.max(nextCols - 1, 0) * gap;
      const rawItemWidth = (containerWidth - totalGap) / nextCols;
      const itemWidth = Math.max(Math.floor(rawItemWidth), minItemWidth);
      const thumbHeight = itemWidth * (9 / 16);
      const infoHeight = 76;
      const rowHeight = Math.round(thumbHeight + infoHeight + 8);
      setResolvedCols(nextCols);
      setEstimatedRowHeight(rowHeight);
      setEstimatedItemWidth(itemWidth);

      const computedWrapper = itemWidth * nextCols + totalGap;
      setWrapperWidth(Math.min(computedWrapper, containerWidth));
    };

    const rafId = window.requestAnimationFrame(compute);
    const timeoutId1 = window.setTimeout(compute, 120);
    const timeoutId2 = window.setTimeout(compute, 480);
    const ro = new ResizeObserver(() => compute());
    if (parentRef.current) ro.observe(parentRef.current);
    window.addEventListener("resize", compute);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId1);
      window.clearTimeout(timeoutId2);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [windowWidth, desiredCols, isShowingSearchResults]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  if (isLoading) {
    return <SearchLoadingView />;
  }

  if (hasSearchTerm && filteredSongs.length > 0) {
    return (
      <SearchResultsView
        parentRef={parentRef}
        searchTerm={searchTerm}
        searchTokens={searchTokens}
        filteredSongs={filteredSongs}
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
        cols={cols}
        estimatedItemWidth={estimatedItemWidth}
        wrapperWidth={wrapperWidth}
        virtualRows={virtualRows}
        totalSize={totalSize}
        measureElement={rowVirtualizer.measureElement}
      />
    );
  }

  if (hasSearchTerm && filteredSongs.length === 0) {
    return (
      <SearchNoResultsView
        allSongs={allSongs}
        searchTokens={searchTokens}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
      />
    );
  }

  return (
    <>
      <SearchBrowseView
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        sortMode={sortMode}
        setSortMode={setSortMode}
        categorySongs={categorySongs}
        filterModeData={filterModeData}
      />
    </>
  );
};

export default SearchPageClient;
