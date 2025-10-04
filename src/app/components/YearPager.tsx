// YearPager.tsx

import React, { useMemo, useRef, useCallback, useEffect } from "react";
// Song型は親コンポーネントから渡されると仮定
import { Song } from "../types/song";

// ページャーに渡す年ごとの情報
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
  // ドラッグ操作でスクロールするためのハンドラ
  onDragScroll: (percentage: number) => void;
}

const MAX_DOTS = 8; // ドットの最大表示数（相対的なボリューム計算の基準）

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

// iOS Safariでnavigator.vibrate()が機能しない問題に対処するため、
// iOS 18+ Safariでネイティブなフィードバックがトリガーされる
// <input type="checkbox" switch> のクリックをシミュレートするハックを実装します。
const useHapticFeedback = () => {
  const hapticRef = useRef<HTMLInputElement | null>(null);
  const labelRef = useRef<HTMLLabelElement | null>(null);

  useEffect(() => {
    // 1. iOSハック用の非表示DOMエレメントを作成
    hapticRef.current = document.createElement("input");
    hapticRef.current.type = "checkbox";
    hapticRef.current.setAttribute("switch", "true"); // iOS 18+ Safariの非標準属性

    // input要素を内包する非表示のlabelを作成 (clickイベントをトリガーするため)
    labelRef.current = document.createElement("label");
    labelRef.current.style.cssText =
      "display: none; width: 0; height: 0; overflow: hidden; position: absolute;";
    labelRef.current.appendChild(hapticRef.current);

    // 2. DOMに追加
    document.body.appendChild(labelRef.current);

    return () => {
      // 3. クリーンアップ
      if (labelRef.current) {
        document.body.removeChild(labelRef.current);
      }
    };
  }, []);

  const triggerHapticFeedback = useCallback((duration: number = 50) => {
    // 1. Android/Chromeなどの環境 (Vibration APIサポート)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      // 短い振動パターン（例：50ms）
      navigator.vibrate(duration);
      return;
    }

    // 2. iOS Safari環境 (Vibration API非サポート、checkbox switchハック)
    // ユーザーインタラクションイベント内でlabel.click()を呼び出し、ネイティブフィードバックをトリガー
    if (labelRef.current && typeof window !== "undefined") {
      labelRef.current.click();
    }
  }, []);

  return triggerHapticFeedback;
};

const YearPager: React.FC<YearPagerProps> = ({
  songs,
  currentSongIds,
  onPagerItemClick,
  onDragScroll,
}) => {
  // 1. Hooksをトップレベルで呼び出す
  const pagerData = useMemo(() => generatePagerData(songs), [songs]);
  const pagerRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = useHapticFeedback();

  // ドラッグ操作でスクロール位置を計算し、親コンポーネントに通知するハンドラ
  const handleDragInteraction = useCallback(
    (clientY: number) => {
      if (!pagerRef.current) return;

      const rect = pagerRef.current.getBoundingClientRect();

      const relativeY = clientY - rect.top;

      let percentage = relativeY / rect.height;
      percentage = Math.max(0, Math.min(percentage, 1));

      onDragScroll(percentage);
    },
    [onDragScroll]
  );

  // タッチイベントハンドラ
  // JSXで直接 `onTouchMove` を呼び出すための関数
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) {
      //   e.preventDefault();
      handleDragInteraction(touch.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // onTouchStart では特に何もしない
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      handleDragInteraction(touch.clientY);
      triggerHaptic();
    }
  };

  // 【エラー修正】パッシブイベントリスナーを無効化する
  useEffect(() => {
    const pagerElement = pagerRef.current;
    if (!pagerElement) return;

    // パッシブイベントリスナーのエラーを回避するため、
    // touchmoveイベントを `{ passive: false }` でネイティブに再登録する
    // これにより、JSXの `handleTouchMove` 内での `e.preventDefault()` が許可される
    pagerElement.addEventListener("touchmove", (e) => {}, { passive: false });

    return () => {
      pagerElement.removeEventListener("touchmove", (e) => {});
    };
  }, []);

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
    <div
      className="h-full w-7 py-4"
      ref={pagerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
            // デザイン復元：縦積みレイアウト (mb-6 relative)
            <div key={item.year} className="mb-6 relative">
              {/* ドットのリスト (年号の上に配置) */}
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
                      {/* 【デザイン復元】丸いドット w-1.5 h-1.5 に戻す */}
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
