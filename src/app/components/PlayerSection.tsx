import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import YoutubeThumbnail from "./YoutubeThumbnail";
import { Button, ButtonGroup } from "flowbite-react";
import { GiPreviousButton, GiNextButton } from "react-icons/gi";
import { LuShuffle, LuVolume2, LuVolumeX } from "react-icons/lu";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { RiPlayListFill } from "react-icons/ri";
import { YouTubeEvent } from "react-youtube";
import PlayerSettings from "./PlayerSettings";
import { LuCrown } from "react-icons/lu";
import { FaInfoCircle, FaPlay, FaPause, FaStepForward } from "react-icons/fa";
import { Tooltip } from "@mantine/core";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, useEffect, useState, useRef } from "react";

type DesktopPlayerControls = {
  isReady: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (absoluteSeconds: number) => void;
  setVolume: (volume: number) => void;
  currentTime: number;
  volume: number;
  duration: number;
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

// Propsの型定義
type PlayerSectionProps = {
  currentSong: Song | null;
  currentSongInfo: Song | null;
  previousSong: Song | null;
  nextSong: Song | null;
  allSongs: Song[];
  songs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  playerKey: number;
  hideFutureSongs: boolean;
  videoId?: string;
  startTime?: number;
  timedLiveCallText?: string;
  handlePlayerOnReady: (event: YouTubeEvent) => void;
  handleStateChange: (event: YouTubeEvent) => void;
  changeCurrentSong: (
    song: Song | null,
    isInfoOnly?: boolean,
    videoId?: string,
    startTime?: number,
  ) => void;
  playRandomSong: (songList: Song[]) => void;
  setSongsToCurrentVideo: () => void;
  setSongs: (songs: Song[]) => void;
  searchSongs: (songsToFilter: Song[], term: string) => Song[];
  setOpenShareModal: (isOpen: boolean) => void;
  setSearchTerm: (term: string) => void;
  setHideFutureSongs: (value: boolean) => void;
  playerControls?: DesktopPlayerControls;
};

export default function PlayerSection({
  currentSong,
  currentSongInfo,
  previousSong,
  nextSong,
  allSongs,
  songs,
  searchTerm,
  isPlaying,
  playerKey,
  hideFutureSongs,
  videoId,
  startTime,
  timedLiveCallText,
  handlePlayerOnReady,
  handleStateChange,
  changeCurrentSong,
  playRandomSong,
  setSongs,
  searchSongs,
  setSongsToCurrentVideo,
  setOpenShareModal,
  setSearchTerm,
  setHideFutureSongs,
  playerControls,
}: PlayerSectionProps) {
  const [timedLiveCallKey, setTimedLiveCallKey] = useState(0);
  const [timedLiveCallLineCount, setTimedLiveCallLineCount] = useState(1);

  // 同じ動画内の全楽曲を取得
  const songsInVideo = (allSongs || [])
    .filter(
      (s) =>
        s.video_id === (currentSongInfo?.video_id ?? currentSong?.video_id),
    )
    .sort((a, b) => Number(a.start) - Number(b.start));

  // 全曲にendが指定されているかチェック
  const allSongsHaveEnd =
    songsInVideo.length > 0 &&
    songsInVideo.every((song) => song.end && Number(song.end) > 0);

  // 動画の開始位置と終了位置を計算
  const videoStartTime =
    songsInVideo.length > 0
      ? Math.min(...songsInVideo.map((s) => Number(s.start || 0)))
      : 0;
  const videoEndTime =
    songsInVideo.length > 0
      ? Math.max(...songsInVideo.map((s) => Number(s.end || 0)))
      : 0;

  // playerControlsのdurationはendパラメータの影響を受けるため、
  // 計算した動画終了位置を優先的に使用
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

  // 累積時間マップ（各曲の開始位置を連続した時間軸にマッピング）
  const songCumulativeMap = allSongsHaveEnd
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
  const cumulativeToActual = (cumulativeTime: number): number => {
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
    // 範囲外の場合は最後の曲の終了位置
    if (songCumulativeMap.length > 0) {
      return songCumulativeMap[songCumulativeMap.length - 1].actualEnd;
    }
    return 0;
  };

  // 実際の動画時間を連続時間に変換
  const actualToCumulative = (actualTime: number): number => {
    if (!allSongsHaveEnd) return actualTime - videoStartTime;

    for (const item of songCumulativeMap) {
      if (actualTime >= item.actualStart && actualTime <= item.actualEnd) {
        const offset = actualTime - item.actualStart;
        return item.cumulativeStart + offset;
      }
    }
    // 範囲外の場合は最も近い曲にスナップ
    if (songCumulativeMap.length > 0) {
      const lastItem = songCumulativeMap[songCumulativeMap.length - 1];
      return actualTime >= lastItem.actualEnd ? lastItem.cumulativeEnd : 0;
    }
    return 0;
  };

  // 表示用の時間（空白を除いた連続時間）
  const displayCurrentTime = allSongsHaveEnd
    ? actualToCumulative(videoCurrentTime)
    : Math.max(0, videoCurrentTime - videoStartTime);

  const displayDuration = allSongsHaveEnd
    ? totalSongsDuration
    : Math.max(0, videoDuration - videoStartTime);

  const formattedCurrentTime = formatPlaybackTime(displayCurrentTime);
  const formattedDuration =
    displayDuration > 0 ? formatPlaybackTime(displayDuration) : "--:--";
  const volumeValue = Math.round(
    Math.min(Math.max(playerControls?.volume ?? 100, 0), 100),
  );
  const canUsePlayerControls = Boolean(playerControls?.isReady && currentSong);

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

  // 表示する曲情報（再生位置に基づく曲、なければcurrentSongInfo/currentSong）
  const displaySongTitle =
    currentPlayingSong?.title ??
    currentSongInfo?.title ??
    currentSong?.title ??
    "";
  const displaySongArtist =
    currentPlayingSong?.artist ??
    currentSongInfo?.artist ??
    currentSong?.artist ??
    "";

  const [hoveredChapter, setHoveredChapter] = useState<{
    song: Song;
    x: number;
    y: number;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(100);
  const lastSeekTimeRef = useRef<number>(0);

  // 空白時間の自動スキップ
  useEffect(() => {
    if (!allSongsHaveEnd || songsInVideo.length === 0 || !playerControls) {
      return;
    }

    // playerが準備できているか、かつ再生中であることを確認
    if (!playerControls.isReady || !isPlaying) {
      return;
    }

    // 現在再生中の動画と一致しているか確認
    const currentVideoId = currentSongInfo?.video_id ?? currentSong?.video_id;
    if (!currentVideoId || songsInVideo[0]?.video_id !== currentVideoId) {
      return;
    }

    // 現在の再生位置が曲の範囲内にあるか確認
    const currentSongInRange = songsInVideo.find((song) => {
      const start = Number(song.start);
      const end = Number(song.end);
      return videoCurrentTime >= start && videoCurrentTime < end;
    });

    // 曲の範囲外（空白時間）にいる場合
    if (!currentSongInRange && videoCurrentTime > 0) {
      // 次の曲を探す（現在時刻より後に開始する最初の曲）
      const nextSong = songsInVideo.find(
        (song) => Number(song.start) > videoCurrentTime,
      );

      if (nextSong) {
        const nextStart = Number(nextSong.start);
        // 連続的なスキップを防ぐため、最後のシークから1秒以上経過していることを確認
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
    songsInVideo.length,
    videoCurrentTime,
    playerControls,
    currentSongInfo,
    currentSong,
  ]);

  const handleTogglePlay = () => {
    if (!playerControls) return;
    if (isPlaying) {
      playerControls.pause();
    } else {
      playerControls.play();
    }
  };

  const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!playerControls) return;
    const nextValue = Number(event.target.value);

    // 連続時間を実際の動画時間に変換
    const actualTime = allSongsHaveEnd
      ? cumulativeToActual(nextValue)
      : nextValue + videoStartTime;

    // その時間に対応する曲を探す
    const targetSong = songsInVideo.find((song) => {
      const start = Number(song.start);
      const end = song.end ? Number(song.end) : Infinity;
      return actualTime >= start && actualTime < end;
    });

    // 曲が見つかり、現在の曲と異なる場合は曲を変更
    if (targetSong) {
      const currentId = `${currentSongInfo?.video_id}-${currentSongInfo?.start}`;
      const targetId = `${targetSong.video_id}-${targetSong.start}`;

      if (currentId !== targetId) {
        // 曲を変更（シークは自動的に行われる）
        changeCurrentSong(targetSong, false, targetSong.video_id, actualTime);
      } else {
        // 同じ曲内ならシークのみ
        playerControls.seekTo(actualTime);
      }
    } else {
      // 曲が見つからない場合（空白時間など）は単純にシーク
      playerControls.seekTo(actualTime);
    }
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!playerControls) return;
    const nextValue = Number(event.target.value);
    playerControls.setVolume(nextValue);
    if (nextValue > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (!playerControls) return;
    if (isMuted) {
      // ミュート解除
      playerControls.setVolume(volumeBeforeMute);
      setIsMuted(false);
    } else {
      // ミュート
      setVolumeBeforeMute(playerControls.volume);
      playerControls.setVolume(0);
      setIsMuted(true);
    }
  };

  useEffect(() => {
    // timedLiveCallText が何行か数える
    const lineCount = timedLiveCallText
      ?.replace(/\\r\\n|\\n/g, "<br>")
      ?.split("<br>").length;
    if (lineCount) {
      setTimedLiveCallLineCount(lineCount);
    }

    setTimedLiveCallKey((prevKey) => prevKey + 1);
  }, [timedLiveCallText]);

  return (
    <aside className="flex md:w-1/2 lg:w-2/3 xl:w-9/12 sm:w-full foldable:w-1/2 pr-0">
      <OverlayScrollbarsComponent
        options={{ scrollbars: { autoHide: "leave" } }}
        element="div"
        className="flex flex-col h-full w-full bg-background pr-0 lg:pr-3"
        defer
      >
        {/* YouTube Player */}
        <div className="relative aspect-video w-full bg-black shadow-md dark:shadow-none">
          <div className="absolute top-0 left-0 w-full h-full">
            {currentSong && (
              <YouTubePlayer
                key={`youtube-player-${playerKey}`}
                song={currentSong}
                video_id={videoId}
                startTime={startTime}
                onReady={handlePlayerOnReady}
                onStateChange={handleStateChange}
              />
            )}
          </div>
        </div>

        {canUsePlayerControls && (
          <div className="hidden w-full flex-col rounded-b-lg bg-linear-to-b from-black/95 to-black/98 px-3 pb-3 pt-2 text-white shadow-2xl backdrop-blur-sm lg:flex">
            {/* Progress Bar */}
            <div className="group relative mb-2 flex items-center gap-2 px-1">
              <div className="relative flex-1">
                {/* Chapter markers */}
                {songsInVideo.length > 0 && (
                  <div className="pointer-events-none absolute inset-0 flex">
                    {allSongsHaveEnd
                      ? // 空白を除いた連続表示
                        songCumulativeMap.map((item, idx) => {
                          const startPosition =
                            totalSongsDuration > 0
                              ? (item.cumulativeStart / totalSongsDuration) *
                                100
                              : 0;
                          const width =
                            totalSongsDuration > 0
                              ? (item.duration / totalSongsDuration) * 100
                              : 0;
                          const isHovered =
                            hoveredChapter?.song?.title === item.song.title &&
                            hoveredChapter?.song?.start === item.song.start;

                          return (
                            <div key={`chapter-${idx}`}>
                              {/* 曲の範囲を示す半透明の背景（ホバー時のみ表示） */}
                              {isHovered && (
                                <div
                                  className="absolute h-1.5 bg-white/30"
                                  style={{
                                    left: `${startPosition}%`,
                                    width: `${width}%`,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  }}
                                />
                              )}
                              {/* 曲の開始位置マーカー */}
                              <div
                                className="absolute h-1.5 w-0.5 bg-white/60"
                                style={{
                                  left: `${startPosition}%`,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                }}
                              />
                            </div>
                          );
                        })
                      : // 絶対時間表示
                        songsInVideo.map((song, idx) => {
                          const songStart = Number(song.start);
                          // endが0の場合は次の曲のstartを使用
                          const nextSong = songsInVideo[idx + 1];
                          const songEnd =
                            song.end && Number(song.end) > 0
                              ? Number(song.end)
                              : nextSong
                                ? Number(nextSong.start)
                                : videoDuration;
                          const seekBarRange = videoDuration - videoStartTime;
                          const startPosition =
                            seekBarRange > 0
                              ? ((songStart - videoStartTime) / seekBarRange) *
                                100
                              : 0;
                          const endPosition =
                            seekBarRange > 0
                              ? ((songEnd - videoStartTime) / seekBarRange) *
                                100
                              : 0;
                          const width = endPosition - startPosition;
                          const isHovered =
                            hoveredChapter?.song?.title === song.title &&
                            hoveredChapter?.song?.start === song.start;

                          return (
                            <div key={`chapter-${idx}`}>
                              {/* 曲の範囲を示す半透明の背景（ホバー時のみ表示） */}
                              {isHovered && (
                                <div
                                  className="absolute h-1.5 bg-white/30"
                                  style={{
                                    left: `${startPosition}%`,
                                    width: `${width}%`,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  }}
                                />
                              )}
                              {/* 曲の開始位置マーカー */}
                              <div
                                className="absolute h-1.5 w-0.5 bg-white/60"
                                style={{
                                  left: `${startPosition}%`,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                }}
                              />
                            </div>
                          );
                        })}
                  </div>
                )}

                <input
                  type="range"
                  min={0}
                  max={allSongsHaveEnd ? totalSongsDuration : displayDuration}
                  value={displayCurrentTime}
                  step="0.1"
                  onChange={handleSeekChange}
                  onInput={handleSeekChange}
                  onMouseMove={(e) => {
                    if (songsInVideo.length === 0) return;

                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;

                    let foundSongData: {
                      song: any;
                      x: number;
                      y: number;
                    } | null = null;

                    if (allSongsHaveEnd) {
                      // 連続時間での検出
                      const hoveredCumulativeTime =
                        (totalSongsDuration * percentage) / 100;
                      const foundItem = songCumulativeMap.find((item) => {
                        return (
                          hoveredCumulativeTime >= item.cumulativeStart &&
                          hoveredCumulativeTime <= item.cumulativeEnd
                        );
                      });

                      if (foundItem) {
                        foundSongData = {
                          song: foundItem.song,
                          x: e.clientX,
                          y: rect.top,
                        };
                      }
                    } else {
                      // 絶対時間での検出
                      const seekBarRange = videoDuration - videoStartTime;
                      const hoverTime =
                        videoStartTime + (seekBarRange * percentage) / 100;

                      const foundSong = songsInVideo
                        .slice()
                        .reverse()
                        .find((s) => {
                          const start = Number(s.start);
                          const end = s.end ? Number(s.end) : Infinity;
                          return hoverTime >= start && hoverTime < end;
                        });

                      if (foundSong) {
                        foundSongData = {
                          song: foundSong,
                          x: e.clientX,
                          y: rect.top,
                        };
                      }
                    }

                    setHoveredChapter(foundSongData);
                  }}
                  onMouseLeave={() => setHoveredChapter(null)}
                  disabled={videoDuration <= 0 || !playerControls?.isReady}
                  className="youtube-progress-bar relative z-20 w-full"
                  style={{
                    background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${
                      displayDuration > 0
                        ? (displayCurrentTime / displayDuration) * 100
                        : 0
                    }%, rgba(255,255,255,0.3) ${
                      displayDuration > 0
                        ? (displayCurrentTime / displayDuration) * 100
                        : 0
                    }%, rgba(255,255,255,0.3) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* コントロールバー */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  disabled={!playerControls?.isReady}
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={isPlaying ? "一時停止" : "再生"}
                >
                  {isPlaying ? (
                    <FaPause className="text-xl text-white" />
                  ) : (
                    <FaPlay className="ml-0.5 text-xl text-white" />
                  )}
                </button>
                {/* 次の曲へ */}
                <button
                  type="button"
                  onClick={() => changeCurrentSong(nextSong)}
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!playerControls?.isReady || !nextSong}
                  aria-label="次の曲へ"
                >
                  <FaStepForward className="text-xl text-white" />
                </button>

                <div className="flex items-center gap-2 text-[13px] font-medium tabular-nums text-white/90 select-none">
                  <span>{formattedCurrentTime}</span>
                  <span className="text-white/50">/</span>
                  <span className="text-white/70">{formattedDuration}</span>
                </div>

                <div className="min-w-0 flex-1 border-l border-white/10 pl-3">
                  <div className="truncate text-sm font-medium text-white select-none">
                    {displaySongTitle}
                  </div>
                  <div className="truncate text-xs text-white/60 select-none">
                    {displaySongArtist}
                  </div>
                </div>
              </div>

              {/* ボリューム */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  disabled={!playerControls?.isReady}
                  className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={isMuted ? "ミュート解除" : "ミュート"}
                >
                  {isMuted || volumeValue === 0 ? (
                    <LuVolumeX className="text-xl text-white" />
                  ) : (
                    <LuVolume2 className="text-xl text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volumeValue}
                  onChange={handleVolumeChange}
                  disabled={!playerControls?.isReady}
                  className="youtube-volume-bar w-24"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${volumeValue}%, rgba(255,255,255,0.3) ${volumeValue}%, rgba(255,255,255,0.3) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chapter Tooltip */}
        {hoveredChapter && (
          <div
            className="pointer-events-none fixed z-50 max-w-xs rounded-lg bg-black/95 px-3 py-2 text-white shadow-2xl backdrop-blur-sm"
            style={{
              left: `${hoveredChapter.x}px`,
              top: `${hoveredChapter.y - 80}px`,
              transform:
                hoveredChapter.x < 160
                  ? "translateX(0)"
                  : typeof window !== "undefined" &&
                      hoveredChapter.x > window.innerWidth - 160
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            <div className="text-sm font-semibold">
              {hoveredChapter.song.title}
            </div>
            <div className="text-xs text-white/70">
              {hoveredChapter.song.artist}
            </div>
          </div>
        )}

        {currentSongInfo?.live_call && (
          <div className="flex flex-row items-center gap-1 mt-2 p-2 text-sm bg-light-gray-100 dark:bg-gray-800 rounded px-2">
            <div className="flex items-center shrink-0 border-r pr-3 border-light-gray-300 dark:border-gray-300">
              <span className="ml-1 text-muted-foreground text-nowrap">
                <span className="ml-1">コーレス</span>
                <Tooltip
                  label="コール＆レスポンスは「+αで覚えたら楽しいよ！」というものです。ライブは楽しむことが最優先ですので、無理に覚える必要はありません！"
                  w={300}
                  multiline
                  withArrow
                >
                  <FaInfoCircle className="inline ml-1 -mt-0.75 text-light-gray-300 dark:text-gray-300" />
                </Tooltip>
              </span>
            </div>
            <div
              className={`flex-1 min-w-0 ml-1 w-full relative`}
              style={{
                height: `${(timedLiveCallLineCount || 1) * 1.2}rem`,
              }}
            >
              <AnimatePresence>
                {timedLiveCallText && (
                  <motion.p
                    key={`${timedLiveCallText}-${timedLiveCallKey}`}
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 100,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      transition: {
                        duration: 0.2,
                      },
                    }}
                    className="truncate w-full absolute top-0 left-0"
                    dangerouslySetInnerHTML={{
                      __html:
                        timedLiveCallText?.replace(/\\r\\n|\\n/g, "<br>") ?? "",
                    }}
                  ></motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex flex-col p-2 pl-2 pb-0 lg:px-0 text-sm text-foreground">
          {/* Player Controls (Mobile) */}
          <div className="flex lg:hidden justify-between w-full">
            <ButtonGroup className="shadow-none rounded-md ">
              <Button
                onClick={() => changeCurrentSong(previousSong)}
                disabled={!previousSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary border-none text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-4 py-2 text-xs border-r-2 border-r-gray-300 ring-0 focus:ring-0 focus:outline-none"
              >
                <GiPreviousButton />
              </Button>
              <Button
                onClick={() => changeCurrentSong(nextSong)}
                disabled={!nextSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-4 py-2 text-xs ring-0 focus:ring-0 focus:outline-none"
              >
                <GiNextButton />
              </Button>
            </ButtonGroup>
            <div className="flex flex-row gap-2 flex-1 ml-2">
              {/* 連続再生ボタン */}
              <Button
                onClick={setSongsToCurrentVideo}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer truncate px-3 py-2 items-center justify-between ring-0 focus:ring-0 focus:outline-none"
              >
                <span className="text-xs">
                  <RiPlayListFill />
                </span>
              </Button>

              {/* ランダム再生ボタン */}
              <Button
                onClick={() => playRandomSong(songs)}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition cursor-pointer truncate px-3 py-2 text-xs items-center justify-between ring-0 focus:ring-0 focus:outline-none"
              >
                <span className="text-xs">
                  <LuShuffle />
                </span>
              </Button>

              {/* オリ曲モード */}
              <Button
                onClick={() => {
                  // オリ曲モードをセット
                  setSearchTerm("original-songs");
                }}
                className="text-white transition cursor-pointer truncate px-3 py-2 text-xs flex-1 flex items-center justify-between ring-0 focus:ring-0 focus:outline-none bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
              >
                <div className="shrink-0 text-xs">
                  <LuCrown className="mr-2" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs">オリ曲</span>
                </div>
              </Button>
            </div>
            <div className="flex justify-end">
              <PlayerSettings
                currentSongInfo={currentSongInfo}
                hideFutureSongs={hideFutureSongs}
                setHideFutureSongs={setHideFutureSongs}
                setOpenShereModal={setOpenShareModal}
              />
            </div>
          </div>
        </div>

        {/* Now Playing Song Info */}
        <NowPlayingSongInfo
          currentSongInfo={currentSongInfo}
          allSongs={allSongs}
          searchTerm={searchTerm}
          isPlaying={isPlaying}
          hideFutureSongs={hideFutureSongs}
          setSearchTerm={setSearchTerm}
          setOpenShereModal={setOpenShareModal}
          changeCurrentSong={changeCurrentSong}
          setHideFutureSongs={setHideFutureSongs}
        />
      </OverlayScrollbarsComponent>
    </aside>
  );
}
