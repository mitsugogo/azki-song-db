"use client";

import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "@mantine/core";

interface SongListProps {
  songs: Song[];
  currentSongInfo: Song | null;
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song, isRandom: boolean) => void;
}

// 画面幅からGridの列数を推定
const getGridCols = (width: number): number => {
  if (width >= 2080) return 5;
  if (width >= 1600) return 4;
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
};

// 曲が同一であるかを判定
const areSongsEqual = (songA: Song | null, songB: Song | null): boolean => {
  if (!songA || !songB) return false;
  return (
    songA.video_id === songB.video_id &&
    songA.start === songB.start &&
    songA.title === songB.title
  );
};

const SongsList = ({
  songs,
  currentSongInfo,
  hideFutureSongs,
  changeCurrentSong,
}: SongListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null); // キー長押しを管理するタイマー

  // 現在のウィンドウ幅
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // 読み込み時に画面幅を初期化
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 現在の列数を計算
  const colCount = useMemo(() => getGridCols(windowWidth), [windowWidth]);

  // 仮想化の対象となる行の総数を計算
  const rowCount = useMemo(() => {
    if (colCount === 0) return 0;
    // (要素総数 + 列数 - 1) / 列数 => 要素を列数で区切ったときの天井値
    return Math.ceil(songs.length / colCount);
  }, [songs.length, colCount]);

  const virtualizer = useVirtualizer({
    count: rowCount, // 行の総数
    getScrollElement: () => parentRef.current,
    estimateSize: () => (colCount == 1 ? 61 : 220), // Gridアイテムの高さ
    overscan: 4,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // 現在の曲のインデックス
  const currentSongIndex = useMemo(() => {
    if (!currentSongInfo) return -1;
    return songs.findIndex((song) => areSongsEqual(song, currentSongInfo));
  }, [songs, currentSongInfo]);

  // 現在の曲へスクロール
  useEffect(() => {
    if (currentSongInfo && colCount > 0) {
      const index = songs.findIndex((song) =>
        areSongsEqual(song, currentSongInfo)
      );
      if (index !== -1) {
        const rowIndex = Math.floor(index / colCount);
        virtualizer.scrollToIndex(rowIndex, {
          align: "center",
        });
      } else {
        virtualizer.scrollToIndex(0);
      }
    } else if (!currentSongInfo) {
      virtualizer.scrollToIndex(0);
    }
  }, [currentSongInfo, virtualizer, songs, colCount]);

  // スペーサーのサイズを計算
  const startOffset = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const endOffset =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  // 連続スクロール処理を停止
  const stopScrolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // キーボードのPageUp/PageDowを処理
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const parentElement = parentRef.current;
      if (!parentElement) return;

      // PageUpまたはPageDownが押されたかどうかを確認
      if (event.key === "PageDown" || event.key === "PageUp") {
        event.preventDefault();

        // 押しっぱなしの時は新たに発火しない
        if (event.repeat) return;

        const scrollHeight = parentElement.clientHeight; // コンテナの可視領域の高さ
        let scrollAmount = 0;

        if (event.key === "PageDown") {
          // 下にスクロール
          scrollAmount = scrollHeight;
        } else if (event.key === "PageUp") {
          // 上にスクロール
          scrollAmount = -scrollHeight;
        }

        parentElement.scrollBy({
          top: scrollAmount,
          behavior: "smooth",
        });

        const continuousScrollAmount = scrollAmount / 5;
        intervalRef.current = window.setInterval(() => {
          // 今キーが押されているかどうかを確認
          if (event.key !== "PageDown" && event.key !== "PageUp") {
            stopScrolling();
            return;
          }

          parentElement.scrollBy({
            top: continuousScrollAmount,
            behavior: "auto",
          });
        }, 50);
      }
    },
    []
  );

  // PageUp/PageDown キーを離した時
  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "PageDown" || event.key === "PageUp") {
        stopScrolling();
      }
    },
    [stopScrolling]
  );

  // コンポーネントがアンマウントされたときにタイマーを停止
  useEffect(() => {
    return () => {
      stopScrolling();
    };
  }, [stopScrolling]);

  return (
    <>
      <ScrollArea
        viewportRef={parentRef}
        id="song-list-scrollbar"
        className="h-dvh lg:h-full overflow-y-auto focus:outline-0"
        style={{
          contain: "strict",
        }}
        scrollHideDelay={0}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        onMouseEnter={() => parentRef.current?.focus()}
        onMouseLeave={() => parentRef.current?.blur()}
      >
        {/* 上部のスペーサー */}
        <div style={{ height: `${startOffset}px` }} />

        <ul
          id="song-list"
          className="song-list mb-2 auto-rows-max grid grid-cols-1  md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-2 flex-grow dark:text-gray-300"
        >
          {virtualRows.flatMap((virtualRow) => {
            const startItemIndex = virtualRow.index * colCount;
            // 行に表示すべき要素を songs から切り出し
            const rowItems = songs.slice(
              startItemIndex,
              startItemIndex + colCount
            );

            return rowItems.map((song, itemIndexInRow) => {
              const globalIndex = startItemIndex + itemIndexInRow;
              const shouldBeHidden =
                hideFutureSongs &&
                currentSongIndex !== -1 &&
                globalIndex > currentSongIndex;

              return (
                <SongListItem
                  key={`${virtualRow.key}-${itemIndexInRow}`}
                  song={song}
                  isSelected={areSongsEqual(currentSongInfo, song)}
                  changeCurrentSong={changeCurrentSong}
                  isHide={shouldBeHidden}
                  // 行の最初の要素（または任意の要素）に ref を渡し、行の高さを測定させる
                  ref={
                    itemIndexInRow === 0
                      ? virtualizer.measureElement
                      : undefined
                  }
                  data-index={globalIndex}
                  data-row-index={virtualRow.index}
                />
              );
            });
          })}
        </ul>

        {/* 下部のスペーサー */}
        <div style={{ height: `${endOffset}px` }} />
      </ScrollArea>
    </>
  );
};

export default SongsList;
