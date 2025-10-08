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
  currentSongInfo: Song | null;
  onPagerItemClick: (id: string) => void;
}

// ドットの最大表示数
const MAX_DOTS = 8;

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
        (yearSongCount / maxSongCount) * MAX_DOTS
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
  currentSongInfo,
  onPagerItemClick,
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
    .map((id) =>
      songs.find((s) => `${s.video_id}-${s.start}-${s.title}` === id)
    )
    .filter((s): s is Song => s !== undefined);

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
    new Date(s.broadcast_at).getTime()
  );
  const minBroadcastDate = Math.min(...visibleBroadcastDates);
  const maxBroadcastDate = Math.max(...visibleBroadcastDates);

  const minVisibleYear = new Date(minBroadcastDate).getFullYear();
  const maxVisibleYear = new Date(maxBroadcastDate).getFullYear();

  // 画面の上端・下端の曲を特定するのではなく、可視範囲の境界となる曲を特定
  const minYearSong = visibleSongs.find(
    (s) => new Date(s.broadcast_at).getTime() === minBroadcastDate
  );
  const maxYearSong = visibleSongs.find(
    (s) => new Date(s.broadcast_at).getTime() === maxBroadcastDate
  );

  // 現在再生中の曲の年と、その年の中でのインデックスを特定
  const currentSongYear = currentSongInfo
    ? new Date(currentSongInfo.broadcast_at).getFullYear()
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
    isCurrentYear: boolean
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
          totalSongsInYear - 1
        );

        const targetSongId = item.songs[targetSongIndexInYear]
          ? `${item.songs[targetSongIndexInYear].video_id}-${item.songs[targetSongIndexInYear].start}-${item.songs[targetSongIndexInYear].title}`
          : item.firstSongId;

        const isCurrentDot = isCurrentYear && dotIndex === currentSongDotIndex;

        return (
          <li
            key={`${item.year}-${dotIndex}`}
            className="my-0.5 cursor-pointer flex items-center relative"
            onClick={() => {
              let songIdToScroll = targetSongId;

              if (isHighlightedDot && currentSongInfo) {
                // ハイライトされているドットをクリックした場合は、現在再生中の曲にスクロールする
                songIdToScroll = `${currentSongInfo.video_id}-${currentSongInfo.start}-${currentSongInfo.title}`;
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

                  if (isHighlightedDot && currentSongInfo) {
                    songIdToScroll = `${currentSongInfo.video_id}-${currentSongInfo.start}-${currentSongInfo.title}`;
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
    <div className="h-full w-9" ref={pagerRef}>
      <div className="relative h-full">
        {pagerData.map((item) => {
          const itemYear = item.year;
          // その年の曲の中に、画面に可視な曲が1つでも含まれているかを確認
          const isYearActuallyVisible = item.songs.some((song) =>
            visibleSongs.some(
              (vs) => vs.video_id === song.video_id && vs.start === song.start
            )
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
                (s) => s.video_id === song.video_id && s.start === song.start
              );

            const visibleSongsInYear = visibleSongs.filter(
              (song) => new Date(song.broadcast_at).getFullYear() === itemYear
            );

            if (visibleSongsInYear.length > 0) {
              const minVisibleTimeInYear = Math.min(
                ...visibleSongsInYear.map((s) =>
                  new Date(s.broadcast_at).getTime()
                )
              );
              const maxVisibleTimeInYear = Math.max(
                ...visibleSongsInYear.map((s) =>
                  new Date(s.broadcast_at).getTime()
                )
              );

              const minYearSongInView = visibleSongsInYear.find(
                (s) =>
                  new Date(s.broadcast_at).getTime() === minVisibleTimeInYear
              );
              const maxYearSongInView = visibleSongsInYear.find(
                (s) =>
                  new Date(s.broadcast_at).getTime() === maxVisibleTimeInYear
              );

              if (minYearSongInView && maxYearSongInView) {
                const indexMin = findIndexInYear(minYearSongInView);
                const indexMax = findIndexInYear(maxYearSongInView);

                if (indexMin !== -1) {
                  minDotIndex = Math.floor(
                    (indexMin / totalSongsInYear) * totalDots
                  );
                }

                if (indexMax !== -1) {
                  maxDotIndex = Math.floor(
                    (indexMax / totalSongsInYear) * totalDots
                  );
                  // 最後の曲の場合は、最後のドットになるように調整
                  if (indexMax === totalSongsInYear - 1 && totalDots > 0) {
                    maxDotIndex = totalDots - 1;
                  }
                }

                // 範囲の保証
                if (minDotIndex > maxDotIndex) {
                  minDotIndex = maxDotIndex;
                }
              }
            }
          }

          // 現在再生中の曲
          if (isCurrentYear && currentSongInfo) {
            const songsInYear = item.songs;
            const currentSongIndexInYear = songsInYear.findIndex(
              (s) =>
                s.video_id === currentSongInfo.video_id &&
                s.start === currentSongInfo.start
            );

            if (currentSongIndexInYear !== -1) {
              const totalSongsInYear = songsInYear.length;
              const totalDots = item.dotCount;
              currentSongDotIndex = Math.floor(
                (currentSongIndexInYear / totalSongsInYear) * totalDots
              );
              if (
                currentSongIndexInYear === totalSongsInYear - 1 &&
                totalDots > 0
              ) {
                currentSongDotIndex = totalDots - 1;
              }
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
                    isCurrentYear
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
                    isCurrentYear
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
