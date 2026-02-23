"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import { useVirtualizer } from "@tanstack/react-virtual";
import historyHelper from "../lib/history";
import useSearchFilterModeData, {
  FilterMode,
} from "./hook/useSearchFilterModeData";
import SearchLoadingView from "./components/SearchLoadingView";
import SearchResultsView from "./components/SearchResultsView";
import SearchNoResultsView from "./components/SearchNoResultsView";
import SearchBrowseView from "./components/SearchBrowseView";
import { isCoverSong, isOriginalSong } from "../config/filters";

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

  const tagCategories: TagCategory[] = useMemo(
    () => [
      {
        label: "オリ曲",
        value: "tag:オリ曲",
        filter: (songs) => songs.filter((song) => isOriginalSong(song)),
      },
      {
        label: "歌ってみた",
        value: "tag:歌ってみた",
        filter: (songs) =>
          songs.filter(
            (song) => isCoverSong(song) && !song.tags.includes("コラボ"),
          ),
      },
      {
        label: "歌ってみたコラボ",
        value: "tag:歌ってみた|tag:コラボ",
        filter: (songs) =>
          songs.filter(
            (song) => isCoverSong(song) && song.tags.includes("コラボ"),
          ),
      },
      {
        label: "歌枠",
        value: "tag:歌枠",
        filter: (songs) => songs.filter((song) => song.tags.includes("歌枠")),
      },
      {
        label: "記念ライブ",
        value: "tag:記念ライブ",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("記念ライブ")),
      },
      {
        label: "ゲスト出演",
        value: "tag:ゲスト出演",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("ゲスト出演")),
      },
      {
        label: "しっとり",
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
        label: "アコースティック・生演奏",
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

  const filterModeData = useSearchFilterModeData(allSongs, filterMode);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const cols = Math.max(colCount, 1);
  const rowCount = Math.ceil(filteredSongs.length / cols);
  const [estimatedRowHeight, setEstimatedRowHeight] = useState<number>(320);
  const [estimatedItemWidth, setEstimatedItemWidth] = useState<number>(240);
  const [wrapperWidth, setWrapperWidth] = useState<number | "100%">("100%");

  useEffect(() => {
    const compute = () => {
      const containerWidth =
        parentRef.current?.clientWidth || windowWidth || 1024;
      const gap = 16;
      const totalGap = Math.max(cols - 1, 0) * gap;
      const padding = 24;
      const rawItemWidth = (containerWidth - totalGap - padding) / cols;
      const itemWidth = Math.max(Math.floor(rawItemWidth), 120);
      const thumbHeight = itemWidth * (9 / 16);
      const infoHeight = 76;
      const rowHeight = Math.round(thumbHeight + infoHeight + 8);
      setEstimatedRowHeight(rowHeight);
      setEstimatedItemWidth(itemWidth);

      const computedWrapper = itemWidth * cols + totalGap + padding;
      setWrapperWidth(Math.min(computedWrapper, containerWidth));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    if (parentRef.current) ro.observe(parentRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [windowWidth, cols]);

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
    <SearchBrowseView
      allSongs={allSongs}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      setSearchTerm={setSearchTerm}
      filterMode={filterMode}
      setFilterMode={setFilterMode}
      categorySongs={categorySongs}
      filterModeData={filterModeData}
    />
  );
};

export default SearchPageClient;
