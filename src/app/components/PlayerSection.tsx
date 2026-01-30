import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { YouTubeEvent } from "react-youtube";
import { FaInfoCircle } from "react-icons/fa";
import { Tooltip } from "@mantine/core";
import { AnimatePresence, motion } from "motion/react";
import PlayerControlsBar from "./PlayerControlsBar";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import useDebounce from "../hook/useDebounce";
import { FaUser } from "react-icons/fa6";

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
    containerWidth: number;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(100);
  const lastSeekTimeRef = useRef<number>(0);
  const [tempSeekValue, setTempSeekValue] = useState(displayCurrentTime);
  const isSeekingRef = useRef(false);
  const [tempVolumeValue, setTempVolumeValue] = useState(volumeValue);
  const debouncedVolumeValue = useDebounce(tempVolumeValue, 100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

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

  // tempシーク値をdisplayCurrentTimeの変化に応じて更新
  useEffect(() => {
    if (isSeekingRef.current) return;
    setTempSeekValue(displayCurrentTime);
  }, [displayCurrentTime]);

  // Debounced volume
  useEffect(() => {
    if (!playerControls?.isReady || debouncedVolumeValue === volumeValue)
      return;
    try {
      playerControls.setVolume(debouncedVolumeValue);
    } catch (error) {
      console.error("Failed to set volume:", error);
    }
  }, [debouncedVolumeValue, volumeValue, playerControls]);

  // tempボリューム変更
  useEffect(() => {
    setTempVolumeValue(volumeValue);
  }, [volumeValue]);

  // 画面幅の監視
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);

  // 画面幅が変わったときにスライダーを閉じる
  useEffect(() => {
    if (!isNarrowScreen) {
      setShowVolumeSlider(false);
    }
  }, [isNarrowScreen]);

  const handleTogglePlay = () => {
    if (!playerControls) return;
    if (isPlaying) {
      playerControls.pause();
    } else {
      playerControls.play();
    }
  };

  const seekToFromDisplayValue = (displayValue: number, force = false) => {
    if (!playerControls) return;

    // ドラッグ中は強制フラグがない限り自動で曲変更しない
    if (isSeekingRef.current && !force) {
      return;
    }

    const actualTime = allSongsHaveEnd
      ? cumulativeToActual(displayValue)
      : displayValue + videoStartTime;

    // actualTimeを分秒に変換
    const minutes = Math.floor(actualTime / 60);
    const seconds = Math.floor(actualTime % 60);
    console.log("actualTime:", actualTime);
    console.log(`actualTime: ${minutes}m ${seconds}s`);

    console.log("songsInVideo:", songsInVideo);

    const targetSong = songsInVideo
      .sort((a: Song, b: Song) => Number(b.start) - Number(a.start))
      .find((song) => {
        const start = Number(song.start);
        const end = song.end ? Number(song.end) : Infinity;
        return start <= actualTime && actualTime < end;
      });

    if (targetSong) {
      const currentId = `${currentSongInfo?.video_id}-${currentSongInfo?.start}`;
      const targetId = `${targetSong.video_id}-${targetSong.start}`;

      if (currentId !== targetId) {
        // 曲を変更（シークは自動的に行われる）
        console.log("曲を変更", targetSong);
        changeCurrentSong(targetSong, true, targetSong.video_id, actualTime);
        playerControls.seekTo(actualTime);
      } else {
        playerControls.seekTo(actualTime);
      }
    } else {
      playerControls.seekTo(actualTime);
    }
  };

  const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    setTempSeekValue(nextValue);
    seekToFromDisplayValue(nextValue);
  };

  const handleSeekStart = () => {
    isSeekingRef.current = true;
  };

  const handleSeekEnd = () => {
    if (!isSeekingRef.current) return;
    isSeekingRef.current = false;
    // リリース時は必ず最終値にシークを当てる
    seekToFromDisplayValue(tempSeekValue, true);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!playerControls) return;
    const nextValue = Math.min(
      Math.max(Math.round(Number(event.target.value)), 0),
      100,
    );
    setTempVolumeValue(nextValue);
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

  const handleVolumeIconClick = () => {
    if (!playerControls) return;
    if (isNarrowScreen) {
      setShowVolumeSlider(!showVolumeSlider);
    } else {
      handleToggleMute();
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
    <aside className="flex lg:w-2/3 xl:w-9/12 w-full foldable:w-1/2 pr-0">
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
                key={`youtube-player-${playerKey}-${currentSong?.video_id ?? "none"}-${currentSong?.start ?? 0}`}
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
          <PlayerControlsBar
            songsInVideo={songsInVideo}
            allSongsHaveEnd={allSongsHaveEnd}
            songCumulativeMap={songCumulativeMap}
            totalSongsDuration={totalSongsDuration}
            videoDuration={videoDuration}
            videoStartTime={videoStartTime}
            displayDuration={displayDuration}
            tempSeekValue={tempSeekValue}
            setTempSeekValue={setTempSeekValue}
            handleSeekChange={handleSeekChange}
            onSeekStart={handleSeekStart}
            onSeekEnd={handleSeekEnd}
            hoveredChapter={hoveredChapter}
            setHoveredChapter={setHoveredChapter}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            disabled={!playerControls?.isReady}
            isMuted={isMuted}
            onNext={nextSong ? () => changeCurrentSong(nextSong) : undefined}
            nextDisabled={!nextSong}
            formattedCurrentTime={formattedCurrentTime}
            formattedDuration={formattedDuration}
            displaySongTitle={displaySongTitle}
            displaySongArtist={displaySongArtist}
            onOpenShareModal={() => setOpenShareModal(true)}
            volumeValue={volumeValue}
            tempVolumeValue={tempVolumeValue}
            onVolumeIconClick={handleVolumeIconClick}
            isNarrowScreen={isNarrowScreen}
            showVolumeSlider={showVolumeSlider}
            onVolumeChange={handleVolumeChange}
            currentSongInfo={currentSongInfo}
            hideFutureSongs={hideFutureSongs}
            setHideFutureSongs={setHideFutureSongs}
          />
        )}

        {currentSongInfo?.live_call && (
          <div className="flex flex-row items-center gap-1 mt-2 p-2 text-sm bg-light-gray-100 dark:bg-gray-800 rounded px-2">
            <div className="flex items-center shrink-0 border-r pr-3 border-light-gray-300 dark:border-gray-300">
              <span className="ml-1 text-muted-foreground text-nowrap">
                <span className="ml-1 hidden lg:inline">コーレス</span>
                <FaUser className="inline lg:hidden" />
                <Tooltip
                  label="コール＆レスポンスは「+αで覚えたら楽しいよ！」というものです。ライブは楽しむことが最優先ですので、無理に覚える必要はありません！"
                  className="hidden lg:inline"
                  w={300}
                  multiline
                  withArrow
                >
                  <FaInfoCircle className="hidden lg:inline ml-1 -mt-0.75 text-light-gray-300 dark:text-gray-300" />
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
