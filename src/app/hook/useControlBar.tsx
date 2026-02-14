"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Song } from "../types/song";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";

type CumulativeItem = {
  song: Song;
  cumulativeStart: number;
  cumulativeEnd: number;
  actualStart: number;
  actualEnd: number;
  duration: number;
};

type Hovered = {
  song: Song;
  x: number;
  containerWidth: number;
} | null;

type PlayerControls = {
  isReady: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (absoluteSeconds: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  currentTime: number;
  volume: number;
  duration: number;
  isMuted?: boolean;
};

type UseControlBarOptions = {
  /** 全曲リスト */
  allSongs: Song[];
  /** 現在の曲 */
  currentSong: Song | null;
  /** 次の曲 */
  nextSong: Song | null;
  /** 再生中かどうか */
  isPlaying: boolean;
  /** プレイヤーコントロールAPI */
  playerControls: PlayerControls | undefined;
  /** 曲変更コールバック */
  changeCurrentSong: (
    song: Song | null,
    videoId?: string,
    startTime?: number,
  ) => void;
};

const formatPlaybackTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * プレイヤーコントロールバーのロジックを管理するカスタムフック
 * シークバー、ボリューム、ミュート、再生/一時停止などの操作を一元管理
 */
export default function useControlBar({
  allSongs,
  currentSong,
  nextSong,
  isPlaying,
  playerControls,
  changeCurrentSong,
}: UseControlBarOptions) {
  // === 動画内の曲情報の計算 ===
  const songsInVideo = (allSongs || [])
    .filter((s) => s.video_id === currentSong?.video_id)
    .sort((a, b) => Number(a.start) - Number(b.start));

  const allSongsHaveEnd =
    songsInVideo.length > 0 &&
    songsInVideo.every((song) => song.end && Number(song.end) > 0);

  const videoStartTime =
    songsInVideo.length > 0
      ? Math.min(...songsInVideo.map((s) => Number(s.start || 0)))
      : 0;

  const videoEndTime =
    songsInVideo.length > 0
      ? Math.max(...songsInVideo.map((s) => Number(s.end || 0)))
      : 0;

  const videoDuration =
    videoEndTime > 0 ? videoEndTime : (playerControls?.duration ?? 0);

  const videoCurrentTime = playerControls?.currentTime ?? 0;

  // 曲の合計時間（空白を除く）
  const totalSongsDuration = allSongsHaveEnd
    ? songsInVideo.reduce(
        (sum, song) => sum + (Number(song.end) - Number(song.start)),
        0,
      )
    : 0;

  // 累積時間マップ
  const songCumulativeMap: CumulativeItem[] = allSongsHaveEnd
    ? (() => {
        let cumulative = 0;
        return songsInVideo.map((song) => {
          const start = cumulative;
          const duration = Number(song.end) - Number(song.start);
          cumulative += duration;
          return {
            song,
            cumulativeStart: start,
            cumulativeEnd: cumulative,
            actualStart: Number(song.start),
            actualEnd: Number(song.end),
            duration,
          };
        });
      })()
    : [];

  // 連続時間を実際の動画時間に変換
  const cumulativeToActual = useCallback(
    (cumulativeTime: number): number => {
      if (!allSongsHaveEnd) return cumulativeTime;

      for (const item of songCumulativeMap) {
        if (
          cumulativeTime >= item.cumulativeStart &&
          cumulativeTime <= item.cumulativeEnd
        ) {
          const offset = cumulativeTime - item.cumulativeStart;
          return item.actualStart + offset;
        }
      }
      if (songCumulativeMap.length > 0) {
        return songCumulativeMap[songCumulativeMap.length - 1].actualEnd;
      }
      return 0;
    },
    [allSongsHaveEnd, songCumulativeMap],
  );

  // 実際の動画時間を連続時間に変換
  const actualToCumulative = useCallback(
    (actualTime: number): number => {
      if (!allSongsHaveEnd) return actualTime - videoStartTime;

      for (const item of songCumulativeMap) {
        if (actualTime >= item.actualStart && actualTime <= item.actualEnd) {
          const offset = actualTime - item.actualStart;
          return item.cumulativeStart + offset;
        }
      }
      if (songCumulativeMap.length > 0) {
        const lastItem = songCumulativeMap[songCumulativeMap.length - 1];
        return actualTime >= lastItem.actualEnd ? lastItem.cumulativeEnd : 0;
      }
      return 0;
    },
    [allSongsHaveEnd, videoStartTime, songCumulativeMap],
  );

  // 表示用の時間
  const displayCurrentTime = allSongsHaveEnd
    ? actualToCumulative(videoCurrentTime)
    : Math.max(0, videoCurrentTime - videoStartTime);

  const displayDuration = allSongsHaveEnd
    ? totalSongsDuration
    : Math.max(0, videoDuration - videoStartTime);

  const formattedCurrentTime = formatPlaybackTime(displayCurrentTime);
  const formattedDuration =
    displayDuration > 0 ? formatPlaybackTime(displayDuration) : "--:--";

  // 現在の再生位置に対応する曲を特定
  const currentPlayingSong =
    songsInVideo.length > 0
      ? songsInVideo
          .slice()
          .reverse()
          .find((s) => {
            const start = Number(s.start);
            const end = s.end ? Number(s.end) : Infinity;
            return videoCurrentTime >= start && videoCurrentTime < end;
          })
      : null;

  const displaySongTitle =
    currentPlayingSong?.title ?? currentSong?.title ?? "";
  const displaySongArtist =
    currentPlayingSong?.artist ?? currentSong?.artist ?? "";

  // === シーク関連 ===
  const [hoveredChapter, setHoveredChapter] = useState<Hovered>(null);
  const [tempSeekValue, setTempSeekValue] = useState(displayCurrentTime);
  const isSeekingRef = useRef(false);
  const lastSeekTimeRef = useRef<number>(0);

  // tempシーク値をdisplayCurrentTimeの変化に応じて更新
  useEffect(() => {
    if (isSeekingRef.current) return;
    setTempSeekValue(displayCurrentTime);
  }, [displayCurrentTime]);

  const seekToFromDisplayValue = useCallback(
    (displayValue: number, force = false) => {
      if (!playerControls) return;

      if (isSeekingRef.current && !force) {
        return;
      }

      const actualTime = allSongsHaveEnd
        ? cumulativeToActual(displayValue)
        : displayValue + videoStartTime;

      const targetSong = songsInVideo
        .sort((a: Song, b: Song) => Number(b.start) - Number(a.start))
        .find((song) => {
          const start = Number(song.start);
          const end = song.end ? Number(song.end) : Infinity;
          return start <= actualTime && actualTime < end;
        });

      if (targetSong) {
        const currentId = `${currentSong?.video_id}-${currentSong?.start}`;
        const targetId = `${targetSong.video_id}-${targetSong.start}`;

        if (currentId !== targetId) {
          changeCurrentSong(targetSong, targetSong.video_id, actualTime);
          playerControls.seekTo(actualTime);
        } else {
          playerControls.seekTo(actualTime);
        }
      } else {
        playerControls.seekTo(actualTime);
      }
    },
    [
      playerControls,
      allSongsHaveEnd,
      cumulativeToActual,
      videoStartTime,
      songsInVideo,
      currentSong,
      changeCurrentSong,
    ],
  );

  const handleSeekChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setTempSeekValue(nextValue);
      seekToFromDisplayValue(nextValue);
    },
    [seekToFromDisplayValue],
  );

  const handleSeekStart = useCallback(() => {
    isSeekingRef.current = true;
  }, []);

  const handleSeekEnd = useCallback(() => {
    if (!isSeekingRef.current) return;
    isSeekingRef.current = false;
    seekToFromDisplayValue(tempSeekValue, true);
  }, [tempSeekValue, seekToFromDisplayValue]);

  // 空白時間の自動スキップ
  useEffect(() => {
    if (!allSongsHaveEnd || songsInVideo.length === 0 || !playerControls) {
      return;
    }

    if (!playerControls.isReady || !isPlaying) {
      return;
    }

    const currentVideoId = currentSong?.video_id;
    if (!currentVideoId || songsInVideo[0]?.video_id !== currentVideoId) {
      return;
    }

    const currentSongInRange = songsInVideo.find((song) => {
      const start = Number(song.start);
      const end = Number(song.end);
      return videoCurrentTime >= start && videoCurrentTime < end;
    });

    if (!currentSongInRange && videoCurrentTime > 0) {
      const nextSongInVideo = songsInVideo.find(
        (song) => Number(song.start) > videoCurrentTime,
      );

      if (nextSongInVideo) {
        const nextStart = Number(nextSongInVideo.start);
        const now = Date.now();
        if (now - lastSeekTimeRef.current > 1000) {
          lastSeekTimeRef.current = now;
          try {
            playerControls.seekTo(nextStart);
          } catch (error) {
            console.error("Failed to seek:", error);
          }
        }
      }
    }
  }, [
    allSongsHaveEnd,
    isPlaying,
    songsInVideo,
    videoCurrentTime,
    playerControls,
    currentSong,
  ]);

  // === ボリューム関連 ===
  const volumeValue = Math.round(
    Math.min(Math.max(playerControls?.volume ?? 100, 0), 100),
  );
  const [isMuted, setIsMuted] = useState(false);
  const [tempVolumeValue, setTempVolumeValue] = useState(volumeValue);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [debouncedVolumeValue] = useDebouncedValue(tempVolumeValue, 100);

  // Sync local muted state from playerControls (or fallback to volume===0)
  useEffect(() => {
    if (!playerControls) return;
    if (typeof playerControls.isReady !== "undefined") {
      // Prefer explicit isMuted flag if provided
      if (typeof playerControls.isMuted === "boolean") {
        setIsMuted(playerControls.isMuted);
        return;
      }
      // fallback: consider volume 0 as muted
      const vol =
        typeof playerControls.volume === "number" ? playerControls.volume : 100;
      setIsMuted(vol === 0);
    }
  }, [
    playerControls?.isReady,
    playerControls?.isMuted,
    playerControls?.volume,
  ]);

  // Debounced volume適用
  useEffect(() => {
    if (!playerControls?.isReady || debouncedVolumeValue === volumeValue)
      return;
    try {
      playerControls.setVolume(debouncedVolumeValue);
    } catch (error) {
      console.error("Failed to set volume:", error);
    }
  }, [debouncedVolumeValue, volumeValue, playerControls]);

  // tempボリューム変更（ミュート中は同期しない）
  useEffect(() => {
    if (!isMuted) {
      setTempVolumeValue(volumeValue);
    }
  }, [volumeValue, isMuted]);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!playerControls) return;
      const nextValue = Math.min(
        Math.max(Math.round(Number(event.target.value)), 0),
        100,
      );
      setTempVolumeValue(nextValue);
      if (nextValue > 0 && isMuted) {
        playerControls.unMute();
        setIsMuted(false);
      }
    },
    [playerControls, isMuted],
  );

  const handleToggleMute = useCallback(() => {
    if (!playerControls) return;
    if (isMuted) {
      playerControls.unMute();
      setIsMuted(false);
    } else {
      playerControls.mute();
      setIsMuted(true);
    }
  }, [playerControls, isMuted]);

  // === タッチデバイス検出 ===
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const hasTouchPoints =
    typeof window !== "undefined" && navigator.maxTouchPoints > 0;
  const supportsTouchEvent =
    typeof window !== "undefined" && "ontouchstart" in window;
  const isTouchDevice = hasTouchPoints || supportsTouchEvent || isCoarsePointer;

  useEffect(() => {
    if (!isTouchDevice) {
      setShowVolumeSlider(false);
    }
  }, [isTouchDevice]);

  const handleVolumeIconClick = useCallback(() => {
    if (!playerControls) return;
    if (isTouchDevice) {
      setShowVolumeSlider(!showVolumeSlider);
    } else {
      handleToggleMute();
    }
  }, [playerControls, isTouchDevice, showVolumeSlider, handleToggleMute]);

  // === 再生コントロール ===
  const handleTogglePlay = useCallback(() => {
    if (!playerControls) return;
    if (isPlaying) {
      playerControls.pause();
    } else {
      playerControls.play();
    }
  }, [playerControls, isPlaying]);

  const handleNext = useCallback(() => {
    if (nextSong) {
      // 同一動画内の場合も確実にシーク＆曲情報更新を行う
      const targetStartTime = Number(nextSong.start);
      changeCurrentSong(nextSong, nextSong.video_id, targetStartTime);
      if (playerControls?.isReady) {
        playerControls.seekTo(targetStartTime);
      }
    }
  }, [nextSong, changeCurrentSong, playerControls]);

  const canUsePlayerControls = Boolean(playerControls?.isReady && currentSong);

  return {
    // 動画・曲情報
    songsInVideo,
    allSongsHaveEnd,
    songCumulativeMap,
    totalSongsDuration,
    videoDuration,
    videoStartTime,
    videoCurrentTime,
    displayCurrentTime,
    displayDuration,
    currentPlayingSong,
    displaySongTitle,
    displaySongArtist,

    // フォーマット済み時間
    formattedCurrentTime,
    formattedDuration,

    // シーク
    tempSeekValue,
    setTempSeekValue,
    handleSeekChange,
    handleSeekStart,
    handleSeekEnd,
    hoveredChapter,
    setHoveredChapter,

    // ボリューム
    volumeValue,
    tempVolumeValue,
    isMuted,
    showVolumeSlider,
    handleVolumeChange,
    handleToggleMute,
    handleVolumeIconClick,

    // タッチデバイス
    isTouchDevice,

    // 再生コントロール
    handleTogglePlay,
    handleNext,
    canUsePlayerControls,

    // ユーティリティ関数
    cumulativeToActual,
    actualToCumulative,
  } as const;
}
