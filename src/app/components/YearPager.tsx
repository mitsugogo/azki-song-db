import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { Song } from "../types/song";
import { useHaptic } from "use-haptic";

interface PagerItem {
  year: number;
  firstSongId: string;
  dotCount: number;
  songs: Song[];
}

interface YearPagerProps {
  songs: Song[];
  currentSongIds: string[];
  onPagerItemClick: (id: string) => void;
}

// ドットの最大表示数
const MAX_DOTS = 8;

/**
 * 曲リストからページャー用のデータを生成するヘルパー関数 (相対ドット数計算を含む)
 */
const generatePagerData = (songs: Song[]): PagerItem[] => {
  const sortedSongs = [...songs].sort(
    (a, b) =>
      new Date(b.broadcast_at).getTime() - new Date(a.broadcast_at).getTime()
  );

  const yearData: Record<number, { count: number; songs: Song[] }> = {};
  sortedSongs.forEach((song) => {
    const broadcastYear = new Date(song.broadcast_at).getFullYear();
    if (!yearData[broadcastYear]) {
      yearData[broadcastYear] = { count: 0, songs: [] };
    }
    yearData[broadcastYear].count += 1;
    yearData[broadcastYear].songs.push(song);
  });

  const allCounts = Object.values(yearData).map((data) => data.count);
  const maxSongCount = allCounts.length > 0 ? Math.max(...allCounts) : 1;

  const years = new Set<number>();
  const pagerData: PagerItem[] = [];

  sortedSongs.forEach((song) => {
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

  return pagerData.sort((a, b) => b.year - a.year);
};

const YearPager: React.FC<YearPagerProps> = ({
  songs,
  currentSongIds,
  onPagerItemClick,
}) => {
  const pagerData = useMemo(() => generatePagerData(songs), [songs]);
  const pagerRef = useRef<HTMLDivElement>(null);

  const { triggerHaptic } = useHaptic();

  // 必要なデータの計算
  const visibleSongs = currentSongIds
    .map((id) =>
      songs.find((s) => `${s.video_id}-${s.start}-${s.title}` === id)
    )
    .filter((s): s is Song => s !== undefined);

  // 見えている曲がない場合の処理
  if (visibleSongs.length === 0) {
    return (
      <div className="h-full w-10 py-4 hidden lg:block">
        <div className="relative h-full"></div>
      </div>
    );
  }

  const firstVisibleSong = visibleSongs[0];
  const lastVisibleSong = visibleSongs[visibleSongs.length - 1];
  const firstVisibleYear = firstVisibleSong
    ? new Date(firstVisibleSong.broadcast_at).getFullYear()
    : 0;
  const lastVisibleYear = lastVisibleSong
    ? new Date(lastVisibleSong.broadcast_at).getFullYear()
    : 0;

  return (
    <div className="h-full w-7 py-4" ref={pagerRef}>
      <div className="relative h-full">
        {pagerData.map((item) => {
          const itemYear = item.year;
          const isYearVisible =
            itemYear <= firstVisibleYear && itemYear >= lastVisibleYear;
          const yearColorClass = isYearVisible
            ? "text-primary-400"
            : "text-gray-200 hover:text-primary-300";

          // ドットのハイライト範囲計算
          let minDotIndex = -1;
          let maxDotIndex = -1;

          if (isYearVisible) {
            const songsInYear = item.songs;
            const totalSongsInYear = songsInYear.length;
            const totalDots = item.dotCount;
            const findIndexInYear = (song: Song) =>
              songsInYear.findIndex(
                (s) => s.video_id === song.video_id && s.start === song.start
              );

            if (itemYear === firstVisibleYear) {
              const firstSongIndexInYear = findIndexInYear(firstVisibleSong);
              minDotIndex = Math.floor(
                (firstSongIndexInYear / totalSongsInYear) * totalDots
              );
            } else {
              minDotIndex = 0;
            }

            if (itemYear === lastVisibleYear) {
              const lastSongIndexInYear = findIndexInYear(lastVisibleSong);
              if (lastSongIndexInYear === -1) {
                maxDotIndex = totalDots - 1;
              } else {
                maxDotIndex = Math.floor(
                  (lastSongIndexInYear / totalSongsInYear) * totalDots
                );
              }

              if (maxDotIndex < minDotIndex) maxDotIndex = minDotIndex;
            } else {
              maxDotIndex = totalDots - 1;
            }
          }

          minDotIndex = Math.max(0, minDotIndex);
          maxDotIndex = Math.min(item.dotCount - 1, maxDotIndex);

          return (
            <div key={item.year} className="mb-2 relative">
              {/* ドットのリスト */}
              <ul className="list-none p-0 m-0 pt-1">
                {Array.from({ length: item.dotCount }).map((_, dotIndex) => {
                  const isHighlightedDot =
                    dotIndex >= minDotIndex && dotIndex <= maxDotIndex;
                  const dotColorClass = isHighlightedDot
                    ? "bg-primary-500 border-primary-500"
                    : "bg-light-gray-300 border-light-gray-300 dark:bg-gray-700 dark:border-gray-700 hover:bg-primary-500 hover:border-primary-500";

                  const totalSongsInYear = item.songs.length;
                  const totalDots = item.dotCount;

                  const targetSongIndexInYear = Math.min(
                    Math.floor((dotIndex / totalDots) * totalSongsInYear),
                    totalSongsInYear - 1
                  );

                  const targetSongId = item.songs[targetSongIndexInYear]
                    ? `${item.songs[targetSongIndexInYear].video_id}-${item.songs[targetSongIndexInYear].start}-${item.songs[targetSongIndexInYear].title}`
                    : item.firstSongId;

                  return (
                    <li
                      key={`${item.year}-${dotIndex}`}
                      className="my-0.5 cursor-pointer flex items-center"
                      onClick={() => {
                        onPagerItemClick(targetSongId);
                        triggerHaptic();
                      }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full border-2 transition-colors duration-200 ${dotColorClass}`}
                      ></div>
                    </li>
                  );
                })}
              </ul>

              {/* 年のヘッダー */}
              <div
                className={`text-xs font-bold cursor-pointer transition-colors duration-200 ${yearColorClass}`}
                onClick={() => {
                  onPagerItemClick(item.firstSongId);
                  triggerHaptic();
                }}
              >
                {item.year}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearPager;
