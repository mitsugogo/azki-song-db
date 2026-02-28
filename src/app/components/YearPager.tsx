import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { Song } from "../types/song";
import { useHaptic } from "use-haptic";
import { IoMusicalNotes } from "react-icons/io5";
import { Badge } from "@mantine/core";

interface PagerItem {
  year: number;
  firstSongId: string;
  dotCount: number;
  songs: Song[];
}

interface YearPagerProps {
  songs: Song[];
  currentSongIds: string[];
  currentSong: Song | null;
  onPagerItemClick: (id: string) => void;
  songListScrollRef?: React.RefObject<HTMLDivElement | null>;
}

// ドットの最大表示数
const MAX_DOTS = 8;

const getSongId = (song: Song): string =>
  `${song.video_id}-${song.start}-${song.title}`;

const getDotIndexFromSongIndex = (
  songIndex: number,
  totalSongsInYear: number,
  totalDots: number,
): number => {
  if (songIndex < 0 || totalSongsInYear <= 0 || totalDots <= 0) {
    return -1;
  }

  if (songIndex >= totalSongsInYear - 1) {
    return totalDots - 1;
  }

  return Math.floor((songIndex / totalSongsInYear) * totalDots);
};

/**
 * 曲リストからページャー用のデータを生成するヘルパー関数 (相対ドット数計算を含む)
 */
const generatePagerData = (songs: Song[]): PagerItem[] => {
  const yearData: Record<number, { count: number; songs: Song[] }> = {};

  songs.forEach((song) => {
    const broadcastYear = new Date(song.broadcast_at).getFullYear();
    if (!yearData[broadcastYear]) {
      yearData[broadcastYear] = { count: 0, songs: [] };
    }
    yearData[broadcastYear].songs.push(song);
    yearData[broadcastYear].count += 1;
  });

  const allCounts = Object.values(yearData).map((data) => data.count);
  const maxSongCount = allCounts.length > 0 ? Math.max(...allCounts) : 1;

  const years = new Set<number>();
  const pagerData: PagerItem[] = [];

  songs.forEach((song) => {
    const broadcastYear = new Date(song.broadcast_at).getFullYear();
    const songId = `${song.video_id}-${song.start}-${song.title}`;

    if (!years.has(broadcastYear)) {
      years.add(broadcastYear);

      const yearSongCount = yearData[broadcastYear].count;

      const relativeDotCount = Math.ceil(
        (yearSongCount / maxSongCount) * MAX_DOTS,
      );
      const dotCount = relativeDotCount > 0 ? relativeDotCount : 1;

      pagerData.push({
        year: broadcastYear,
        firstSongId: songId,
        dotCount: dotCount,
        songs: yearData[broadcastYear].songs,
      });
    }
  });
  return pagerData;
};

const YearPager: React.FC<YearPagerProps> = ({
  songs,
  currentSongIds,
  currentSong,
  onPagerItemClick,
  songListScrollRef,
}) => {
  const pagerData = useMemo(() => generatePagerData(songs), [songs]);
  const pagerRef = useRef<HTMLDivElement>(null);

  const { triggerHaptic } = useHaptic();

  const isDescendingOrder =
    pagerData.length > 1
      ? pagerData[0].year > pagerData[pagerData.length - 1].year
      : true; // 要素が少ない場合は新しい順と仮定

  // 必要なデータの計算
  const visibleSongs = currentSongIds
    .map((id) => songs.find((s) => getSongId(s) === id))
    .filter((s): s is Song => s !== undefined);

  // マウスホイールで楽曲一覧をスクロール
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!songListScrollRef?.current) return;
      e.preventDefault();
      // スクロール量は楽曲一覧の1/2画面分
      const scrollAmount = songListScrollRef.current.clientHeight / 2;
      songListScrollRef.current.scrollBy({
        top: e.deltaY > 0 ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    },
    [songListScrollRef],
  );

  // 見えている曲がない場合の処理
  if (visibleSongs.length === 0) {
    return (
      <div className="h-full w-9 py-4 hidden lg:block">
        <div className="relative h-full"></div>
      </div>
    );
  }

  // 画面に見えている曲の中で、最も古い（broadcast_atが小さい）曲と最も新しい（broadcast_atが大きい）曲を特定
  const visibleBroadcastDates = visibleSongs.map((s) =>
    new Date(s.broadcast_at).getTime(),
  );
  const minBroadcastDate = Math.min(...visibleBroadcastDates);
  const maxBroadcastDate = Math.max(...visibleBroadcastDates);

  const minVisibleYear = new Date(minBroadcastDate).getFullYear();
  const maxVisibleYear = new Date(maxBroadcastDate).getFullYear();

  // 画面の上端・下端の曲を特定するのではなく、可視範囲の境界となる曲を特定
  const minYearSong = visibleSongs.find(
    (s) => new Date(s.broadcast_at).getTime() === minBroadcastDate,
  );
  const maxYearSong = visibleSongs.find(
    (s) => new Date(s.broadcast_at).getTime() === maxBroadcastDate,
  );

  // 現在再生中の曲の年と、その年の中でのインデックスを特定
  const currentSongYear = currentSong
    ? new Date(currentSong.broadcast_at).getFullYear()
    : null;

  const yearHeader = (item: PagerItem, yearColorClass: string) => (
    <div
      className={`text-xs font-bold cursor-pointer transition-colors duration-200 ${yearColorClass} py-1`}
      onClick={() => {
        onPagerItemClick(item.firstSongId);
        triggerHaptic();
      }}
    >
      {item.year}
    </div>
  );

  const dotList = (
    item: PagerItem,
    minDotIndex: number,
    maxDotIndex: number,
    currentSongDotIndex: number,
    isCurrentYear: boolean,
  ) => (
    <ul className="list-none p-0 m-0">
      {Array.from({ length: item.dotCount }).map((_, dotIndex) => {
        // ハイライトのロジック:
        // minDotIndexとmaxDotIndexが有効な値 (-1以外) で、その範囲内にある場合のみハイライト
        const isHighlightedDot =
          minDotIndex !== -1 &&
          maxDotIndex !== -1 &&
          dotIndex >= minDotIndex &&
          dotIndex <= maxDotIndex;

        const dotColorClass = isHighlightedDot
          ? "bg-primary-500 border-primary-500"
          : "bg-light-gray-300 border-light-gray-300 dark:bg-gray-600 dark:border-gray-600 hover:bg-primary-500 hover:border-primary-500";

        const totalSongsInYear = item.songs.length;
        const totalDots = item.dotCount;

        const targetSongIndexInYear = Math.min(
          Math.floor((dotIndex / totalDots) * totalSongsInYear),
          totalSongsInYear - 1,
        );

        const targetSongId = item.songs[targetSongIndexInYear]
          ? getSongId(item.songs[targetSongIndexInYear])
          : item.firstSongId;

        const isCurrentDot = isCurrentYear && dotIndex === currentSongDotIndex;

        return (
          <li
            key={`${item.year}-${dotIndex}`}
            className="my-0.5 cursor-pointer flex items-center relative"
            onClick={() => {
              let songIdToScroll = targetSongId;

              if (isHighlightedDot && currentSong) {
                // ハイライトされているドットをクリックした場合は、現在再生中の曲にスクロールする
                songIdToScroll = getSongId(currentSong);
              }

              onPagerItemClick(songIdToScroll);
              triggerHaptic();
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full border-2 transition-colors duration-200 ${dotColorClass}`}
            ></div>

            {isCurrentDot && (
              <div
                className="absolute right-full z-20 text-center bg-primary-500 text-white rounded text-xs w-5 h-5 flex items-center justify-center"
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: "8px",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  let songIdToScroll = targetSongId;

                  if (isHighlightedDot && currentSong) {
                    songIdToScroll = getSongId(currentSong);
                  }
                  onPagerItemClick(songIdToScroll);
                  triggerHaptic();
                }}
              >
                <IoMusicalNotes />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className="h-full w-9"
      ref={pagerRef}
      onWheel={handleWheel}
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <div className="relative h-full">
        {pagerData.map((item) => {
          const itemYear = item.year;
          // その年の曲の中に、画面に可視な曲が1つでも含まれているかを確認
          const isYearActuallyVisible = item.songs.some((song) =>
            visibleSongs.some(
              (vs) =>
                vs.video_id === song.video_id &&
                vs.start === song.start &&
                vs.title === song.title,
            ),
          );

          const isYearInGlobalVisibleRange =
            itemYear >= minVisibleYear && itemYear <= maxVisibleYear;

          const yearColorClass = isYearInGlobalVisibleRange
            ? "text-primary-400"
            : "text-gray-200 hover:text-primary-300";

          const isCurrentYear = itemYear === currentSongYear;

          // ドットのハイライト範囲計算
          let minDotIndex = -1;
          let maxDotIndex = -1;

          let currentSongDotIndex = -1;

          if (isYearActuallyVisible) {
            const songsInYear = item.songs;
            const totalSongsInYear = songsInYear.length;
            const totalDots = item.dotCount;

            const findIndexInYear = (song: Song) =>
              songsInYear.findIndex(
                (s) => s.video_id === song.video_id && s.start === song.start,
              );

            const visibleSongsInYear = visibleSongs.filter(
              (song) => new Date(song.broadcast_at).getFullYear() === itemYear,
            );

            if (visibleSongsInYear.length > 0) {
              const visibleIndexesInYear = visibleSongsInYear
                .map((song) => findIndexInYear(song))
                .filter((index) => index !== -1);

              if (visibleIndexesInYear.length > 0) {
                const minVisibleIndex = Math.min(...visibleIndexesInYear);
                const maxVisibleIndex = Math.max(...visibleIndexesInYear);

                minDotIndex = getDotIndexFromSongIndex(
                  minVisibleIndex,
                  totalSongsInYear,
                  totalDots,
                );
                maxDotIndex = getDotIndexFromSongIndex(
                  maxVisibleIndex,
                  totalSongsInYear,
                  totalDots,
                );
              }
            }
          }

          // 現在再生中の曲
          if (isCurrentYear && currentSong) {
            const songsInYear = item.songs;
            const currentSongIndexInYear = songsInYear.findIndex(
              (s) =>
                s.video_id === currentSong.video_id &&
                s.start === currentSong.start,
            );

            if (currentSongIndexInYear !== -1) {
              const totalSongsInYear = songsInYear.length;
              const totalDots = item.dotCount;
              currentSongDotIndex = getDotIndexFromSongIndex(
                currentSongIndexInYear,
                totalSongsInYear,
                totalDots,
              );
            }
          }

          minDotIndex = Math.max(-1, minDotIndex);
          maxDotIndex = Math.min(item.dotCount - 1, maxDotIndex);

          return (
            <div key={item.year} className="mb-2 relative">
              {isDescendingOrder ? (
                // 新しい順の場合 (ドット → 年号)
                <>
                  {dotList(
                    item,
                    minDotIndex,
                    maxDotIndex,
                    currentSongDotIndex,
                    isCurrentYear,
                  )}
                  {yearHeader(item, yearColorClass)}
                </>
              ) : (
                // 古い順の場合 (年号 → ドット)
                <>
                  {yearHeader(item, yearColorClass)}
                  {dotList(
                    item,
                    minDotIndex,
                    maxDotIndex,
                    currentSongDotIndex,
                    isCurrentYear,
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearPager;
