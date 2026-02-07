import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { YouTubeEvent } from "react-youtube";
import { FaInfoCircle } from "react-icons/fa";
import { Tooltip } from "@mantine/core";
import { AnimatePresence, motion } from "motion/react";
import PlayerControlsBar from "./PlayerControlsBar";
import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa6";
import { IoChevronUp, IoSearch } from "react-icons/io5";
import useControlBar from "../hook/useControlBar";
import MobileActionButtons from "./MobileActionButtons";

type DesktopPlayerControls = {
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
};

// Propsの型定義
type PlayerSectionProps = {
  currentSong: Song | null;
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
  setOpenSongListOverlay?: (open: boolean) => void;
  setShowPlaylistSelector?: (open: boolean) => void;
  playerControls?: DesktopPlayerControls;
};

export default function PlayerSection({
  currentSong,
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
  setOpenSongListOverlay,
  setShowPlaylistSelector,
}: PlayerSectionProps) {
  // ライブコール表示用の状態
  const [timedLiveCallKey, setTimedLiveCallKey] = useState(0);
  const [timedLiveCallLineCount, setTimedLiveCallLineCount] = useState(1);

  // useControlBar フックでコントロールバー関連のロジックを一元管理
  const controlBar = useControlBar({
    allSongs,
    currentSong,
    nextSong,
    isPlaying,
    playerControls,
    changeCurrentSong,
  });

  // timedLiveCallText が変更されたら行数を計算
  useEffect(() => {
    const lineCount = timedLiveCallText
      ?.replace(/\\r\\n|\\n/g, "<br>")
      ?.split("<br>").length;
    if (lineCount) {
      setTimedLiveCallLineCount(lineCount);
    }

    setTimedLiveCallKey((prevKey) => prevKey + 1);
  }, [timedLiveCallText]);

  return (
    <aside className="flex md:w-2/3 xl:w-9/12 w-full foldable:w-full md:foldable:w-1/2 pr-0">
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
                key={`youtube-player-${playerKey}-${currentSong?.video_id ?? "none"}`}
                song={currentSong}
                video_id={videoId}
                startTime={startTime}
                onReady={handlePlayerOnReady}
                onStateChange={handleStateChange}
              />
            )}
          </div>
        </div>

        {/* Mobile: オーバーレイ検索ボタン */}
        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-2">
          <button
            aria-label="Open song list"
            onClick={() => setOpenSongListOverlay?.(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full cursor-pointer bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-100 dark:border-gray-500 text-gray-800 dark:text-white"
          >
            <IoSearch className="w-6 h-6" />
          </button>
        </div>

        {controlBar.canUsePlayerControls && (
          <PlayerControlsBar
            songsInVideo={controlBar.songsInVideo}
            allSongsHaveEnd={controlBar.allSongsHaveEnd}
            songCumulativeMap={controlBar.songCumulativeMap}
            totalSongsDuration={controlBar.totalSongsDuration}
            videoDuration={controlBar.videoDuration}
            videoStartTime={controlBar.videoStartTime}
            displayDuration={controlBar.displayDuration}
            tempSeekValue={controlBar.tempSeekValue}
            setTempSeekValue={controlBar.setTempSeekValue}
            handleSeekChange={controlBar.handleSeekChange}
            onSeekStart={controlBar.handleSeekStart}
            onSeekEnd={controlBar.handleSeekEnd}
            hoveredChapter={controlBar.hoveredChapter}
            setHoveredChapter={controlBar.setHoveredChapter}
            isPlaying={isPlaying}
            onTogglePlay={controlBar.handleTogglePlay}
            disabled={!playerControls?.isReady}
            isMuted={controlBar.isMuted}
            onNext={nextSong ? controlBar.handleNext : undefined}
            nextDisabled={!nextSong}
            formattedCurrentTime={controlBar.formattedCurrentTime}
            formattedDuration={controlBar.formattedDuration}
            displaySongTitle={controlBar.displaySongTitle}
            displaySongArtist={controlBar.displaySongArtist}
            onOpenShareModal={() => setOpenShareModal(true)}
            volumeValue={controlBar.volumeValue}
            tempVolumeValue={
              controlBar.isMuted ? 0 : controlBar.tempVolumeValue
            }
            onVolumeIconClick={controlBar.handleVolumeIconClick}
            isTouchDevice={controlBar.isTouchDevice}
            showVolumeSlider={controlBar.showVolumeSlider}
            onVolumeChange={controlBar.handleVolumeChange}
            currentSong={currentSong}
            hideFutureSongs={hideFutureSongs}
            setHideFutureSongs={setHideFutureSongs}
          />
        )}

        <div className="block md:hidden mx-2 mt-2">
          <MobileActionButtons
            onSurprise={() => playRandomSong?.(songs)}
            onOriginal={() => setSearchTerm?.("original-songs")}
            onPlaylist={() => setShowPlaylistSelector?.(true)}
          />
        </div>

        {currentSong?.live_call && (
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
          currentSong={currentSong}
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
