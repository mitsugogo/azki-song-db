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
import YearPager from "./YearPager";

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song) => void;
}

// 画面幅からGridの列数を推定
export const getGridCols = (width: number): number => {
  if (width >= 2560) return 5;
  if (width >= 1920) return 4;
  if (width >= 1280) return 3;
  if (width >= 1024) return 2;
  if (width >= 768) return 1;
  return 1;
};

// 曲が同一であるかを判定
export const areSongsEqual = (
  songA: Song | null,
  songB: Song | null,
): boolean => {
  if (!songA || !songB) return false;
  return (
    songA.video_id === songB.video_id &&
    songA.start === songB.start &&
    songA.title === songB.title
  );
};

const SongsList = ({
  songs,
  currentSong,
  hideFutureSongs,
  changeCurrentSong,
}: SongListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null); // キー長押しを管理するタイマー

  // ページャーと連動するためのハイライト状態を管理
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [visibleSongIds, setVisibleSongIds] = useState<string[]>([]);

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

  // 仮想化アイテムの取得
  const virtualRows = virtualizer ? virtualizer.getVirtualItems() : [];

  // 現在の曲のインデックス
  const currentSongIndex = useMemo(() => {
    if (!currentSong) return -1;
    return songs.findIndex((song) => areSongsEqual(song, currentSong));
  }, [songs, currentSong]);

  // 現在の曲へスクロール
  useEffect(() => {
    if (currentSong && colCount > 0 && virtualizer && parentRef.current) {
      const index = songs.findIndex((song) => areSongsEqual(song, currentSong));
      if (index !== -1) {
        const rowIndex = Math.floor(index / colCount);
        virtualizer.scrollToIndex(rowIndex, {
          align: colCount == 1 ? "start" : "center",
        });
      } else {
        virtualizer.scrollToIndex(0);
      }
    }
  }, [currentSong, virtualizer, songs, colCount]);

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
    [],
  );

  // PageUp/PageDown キーを離した時
  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "PageDown" || event.key === "PageUp") {
        stopScrolling();
      }
    },
    [stopScrolling],
  );

  // コンポーネントがアンマウントされたときにタイマーを停止
  useEffect(() => {
    return () => {
      stopScrolling();
    };
  }, [stopScrolling]);

  useEffect(() => {
    if (virtualRows.length > 0) {
      const newVisibleIds: string[] = [];

      // 画面に見えている全ての仮想アイテムを処理
      virtualRows.forEach((item) => {
        const startItemIndex = item.index * colCount;

        // 1行内の全ての曲をチェック
        for (let i = 0; i < colCount; i++) {
          const globalIndex = startItemIndex + i;
          const song = songs[globalIndex];

          if (song) {
            const visibleId = `${song.video_id}-${song.start}-${song.title}`;
            newVisibleIds.push(visibleId);
          }
        }
      });

      // スクロール位置が変わったときのみstateを更新
      setVisibleSongIds((prev) => {
        // 配列の比較は面倒なので、IDの数で大まかに判定
        if (
          newVisibleIds.length !== prev.length ||
          newVisibleIds[0] !== prev[0]
        ) {
          return newVisibleIds;
        }
        return prev;
      });
    } else if (songs.length > 0) {
      // リストが空でない場合の初期値設定
      const initialId = `${songs[0].video_id}-${songs[0].start}-${songs[0].title}`;
      setVisibleSongIds((prev) => {
        if (prev.length === 0) {
          return [initialId];
        }
        return prev;
      });
    }
  }, [virtualRows, songs, colCount]); // virtualRowsが変更されるたびに実行

  /**
   * ページャーまたはリストからのクリック時に特定の曲にスクロールする関数
   * @param id スクロール先の曲を特定するID ('video_id-start-title')
   */
  const scrollToSong = useCallback(
    (id: string) => {
      const songToScroll = songs.find(
        (song) => `${song.video_id}-${song.start}-${song.title}` === id,
      );

      if (!songToScroll) {
        return;
      }

      const index = songs.indexOf(songToScroll);
      if (index === -1) {
        return;
      }

      const rowIndex = Math.floor(index / colCount);

      virtualizer.scrollToIndex(rowIndex, {
        align: colCount === 1 ? "start" : "center",
      });

      setCurrentSongId(id);
    },
    [songs, colCount, virtualizer],
  );

  /**
   * 現在再生中の曲をハイライトする
   */
  useEffect(() => {
    if (currentSong) {
      const playingId = `${currentSong.video_id}-${currentSong.start}-${currentSong.title}`;
      setCurrentSongId(playingId);
    }
  }, [currentSong]);

  return (
    <>
      <div className="flex w-full h-screen overflow-hidden">
        <ScrollArea
          viewportRef={parentRef}
          id="song-list-scrollbar"
          className="h-full overflow-y-auto focus:outline-0 grow"
          viewportProps={{
            style: { contain: "strict" },
          }}
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
            className="song-list mb-2 auto-rows-max grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-2 grow dark:text-gray-300"
          >
            {virtualRows.flatMap((virtualRow) => {
              const startItemIndex = virtualRow.index * colCount;
              const rowItems = songs.slice(
                startItemIndex,
                startItemIndex + colCount,
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
                    isSelected={areSongsEqual(currentSong, song)}
                    changeCurrentSong={changeCurrentSong}
                    isHide={shouldBeHidden}
                    ref={
                      itemIndexInRow === 0 && colCount > 1
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

        {/* 右端の縦型ページャー */}
        {songs.length > 15 && (
          <div className="flex flex-col h-full justify-between pl-2 overflow-hidden">
            <ScrollArea type={"never"}>
              <YearPager
                songs={songs}
                currentSongIds={visibleSongIds}
                onPagerItemClick={scrollToSong}
                currentSong={currentSong}
                songListScrollRef={parentRef}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </>
  );
};

export default SongsList;
