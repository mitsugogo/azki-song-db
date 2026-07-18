import { Song } from "../types/song";
import type { YouTubeVideoData } from "../types/youtube";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { YouTubeEvent } from "react-youtube";
import { FaInfoCircle } from "react-icons/fa";
import { LoadingOverlay, Tooltip } from "@mantine/core";
import { AnimatePresence, motion } from "motion/react";
import PlayerControlsBar from "./PlayerControlsBar";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { FaUser } from "react-icons/fa6";
import { IoChevronUp, IoList, IoSearch } from "react-icons/io5";
import { useTranslations } from "next-intl";
import useControlBar from "../hook/useControlBar";
import SongModeControls from "./SongModeControls";
import type { YouTubePlayerWithVideoData } from "../hook/usePlayerControls";
import { renderLinkedText } from "../lib/textLinkify";
import { YouTubeApiVideoResult } from "../types/api/yt/video";
import { getSongMode } from "./songModeMenu";
import {
  SharedYouTubePlayerSlot,
  useSharedYouTubePlayerSource,
} from "./SharedYouTubePlayer";
import {
  COMPACT_TABLETOP_TAB_HEIGHT,
  type TabletopPanes,
  type TabletopVariant,
  type TabletopView,
  type WatchLayoutMode,
} from "../hook/useWatchLayout";

const resolveTimeDisplayMode = (
  liveBroadcastContent?: string | null,
): "default" | "hidden" | "elapsed-only" => {
  if (liveBroadcastContent === "upcoming") {
    return "hidden";
  }
  if (liveBroadcastContent === "live") {
    return "elapsed-only";
  }
  return "default";
};

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
  currentSongPlayCount?: number;
  isMembersOnlyPlayerRecovering: boolean;
  playerKey: number;
  hideFutureSongs: boolean;
  videoId?: string;
  videoTitle?: string | null;
  videoData?: YouTubeVideoData | null;
  videoInfo?: YouTubeApiVideoResult | null;
  startTime?: number;
  timedLiveCallText?: string;
  handlePlayerOnReady: (
    event: YouTubeEvent<number> & { target: YouTubePlayerWithVideoData },
  ) => boolean | void;
  handleStateChange: (
    event: YouTubeEvent<number> & { target: YouTubePlayerWithVideoData },
  ) => void;
  handlePlayerError?: (event: YouTubeEvent<number>) => void;
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
  isTheaterMode: boolean;
  onToggleTheaterMode: () => void;
  showNowPlayingInfo?: boolean;
  layoutMode?: WatchLayoutMode;
  tabletopPanes?: TabletopPanes;
  tabletopVariant?: TabletopVariant;
  tabletopView?: TabletopView;
  onTabletopViewChange?: (view: TabletopView) => void;
};

export default function PlayerSection({
  currentSong,
  previousSong,
  nextSong,
  allSongs,
  songs,
  searchTerm,
  isPlaying,
  currentSongPlayCount = 0,
  isMembersOnlyPlayerRecovering,
  playerKey,
  hideFutureSongs,
  videoId,
  videoTitle,
  videoData,
  videoInfo,
  startTime,
  timedLiveCallText,
  handlePlayerOnReady,
  handleStateChange,
  handlePlayerError,
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
  isTheaterMode,
  onToggleTheaterMode,
  showNowPlayingInfo = true,
  layoutMode = "landscape-columns",
  tabletopPanes = null,
  tabletopVariant = null,
  tabletopView = "details",
  onTabletopViewChange,
}: PlayerSectionProps) {
  const t = useTranslations("Watch.tabletop");
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

  const getSongKey = useCallback((song: Song) => {
    if (song.slug) return song.slug;
    return `${song.title}::${song.artist}`;
  }, []);
  const currentSongMode = getSongMode(searchTerm);
  const timeDisplayMode = resolveTimeDisplayMode(
    videoInfo?.snippet?.liveBroadcastContent,
  );
  const sharedVideoId = videoId || currentSong?.video_id;
  const isSharedPlayerActive = Boolean(currentSong && sharedVideoId);
  const isTabletop = layoutMode === "tabletop";
  const isCompactTabletop = isTabletop && tabletopVariant === "compact";

  const sharedPlayerSource = useMemo(
    () => ({
      sourceId: "main",
      active: isSharedPlayerActive,
      videoId: sharedVideoId,
      startTime,
      playerKey,
      zIndex: isTabletop ? 20 : 1,
      onReady: handlePlayerOnReady as (event: YouTubeEvent<any>) => void,
      onStateChange: handleStateChange as (event: YouTubeEvent<any>) => void,
      onError: handlePlayerError as
        ((event: YouTubeEvent<any>) => void) | undefined,
    }),
    [
      isSharedPlayerActive,
      sharedVideoId,
      startTime,
      playerKey,
      isTabletop,
      handlePlayerOnReady,
      handleStateChange,
      handlePlayerError,
    ],
  );

  useSharedYouTubePlayerSource(sharedPlayerSource);

  const hasNextInVideo = useMemo(() => {
    if (!currentSong) return false;
    const songsInVideo = controlBar.songsInVideo;
    const currentIndex = songsInVideo.findIndex(
      (song) =>
        song.video_id === currentSong.video_id &&
        song.start === currentSong.start,
    );
    if (currentIndex < 0) return false;
    const currentKey = getSongKey(currentSong);
    for (let i = currentIndex + 1; i < songsInVideo.length; i += 1) {
      if (getSongKey(songsInVideo[i]) !== currentKey) {
        return true;
      }
    }
    return false;
  }, [controlBar.songsInVideo, currentSong, getSongKey]);

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

  const topPaneFallback = tabletopPanes?.top;
  const bottomPaneFallback = tabletopPanes?.bottom;
  const topPaneStyle: CSSProperties = {
    position: "fixed",
    left: `env(viewport-segment-left 0 0, ${topPaneFallback?.left ?? 0}px)`,
    top: `env(viewport-segment-top 0 0, ${topPaneFallback?.top ?? 0}px)`,
    width: `env(viewport-segment-width 0 0, ${
      topPaneFallback ? `${topPaneFallback.width}px` : "100vw"
    })`,
    height: `env(viewport-segment-height 0 0, ${
      topPaneFallback ? `${topPaneFallback.height}px` : "50dvh"
    })`,
  };
  const bottomPaneWidthFallback = bottomPaneFallback
    ? `${bottomPaneFallback.width}px`
    : "100vw";
  const bottomPaneLeft = `env(viewport-segment-left 0 1, ${bottomPaneFallback?.left ?? 0}px)`;
  const bottomPaneTop = `env(viewport-segment-top 0 1, ${
    bottomPaneFallback ? `${bottomPaneFallback.top}px` : "50dvh"
  })`;
  const bottomPaneWidth = `env(viewport-segment-width 0 1, ${bottomPaneWidthFallback})`;
  const bottomPaneHeight = `env(viewport-segment-height 0 1, ${
    bottomPaneFallback ? `${bottomPaneFallback.height}px` : "50dvh"
  })`;
  const detailPaneStyle: CSSProperties = {
    position: "fixed",
    left: bottomPaneLeft,
    top: isCompactTabletop
      ? `calc(${bottomPaneTop} + ${COMPACT_TABLETOP_TAB_HEIGHT}px)`
      : bottomPaneTop,
    width: isCompactTabletop ? bottomPaneWidth : `calc(${bottomPaneWidth} / 2)`,
    height: isCompactTabletop
      ? `calc(${bottomPaneHeight} - ${COMPACT_TABLETOP_TAB_HEIGHT}px)`
      : bottomPaneHeight,
    display:
      isCompactTabletop && tabletopView !== "details" ? "none" : undefined,
  };
  const compactTabletopTabsStyle: CSSProperties = {
    position: "fixed",
    left: bottomPaneLeft,
    top: bottomPaneTop,
    width: bottomPaneWidth,
    height: `${COMPACT_TABLETOP_TAB_HEIGHT}px`,
  };

  const videoPane = (
    <div
      data-testid="watch-video-pane"
      data-segment-layout={isTabletop ? "css-env" : undefined}
      className={`relative w-full bg-black shadow-md dark:shadow-none ${
        isTabletop ? "z-10 h-full" : "aspect-video"
      }`}
      style={isTabletop ? topPaneStyle : undefined}
    >
      <LoadingOverlay
        visible={isMembersOnlyPlayerRecovering}
        zIndex={20}
        loaderProps={{ color: "pink", type: "bars" }}
        overlayProps={{ blur: 2, backgroundOpacity: 0.35 }}
      />
      <div className="absolute top-0 left-0 w-full h-full">
        <SharedYouTubePlayerSlot
          sourceId="main"
          active={isSharedPlayerActive}
          className="h-full w-full"
        />
      </div>
    </div>
  );

  const detailsPane = (
    <div
      data-testid="watch-player-details-pane"
      data-segment-layout={isTabletop ? "css-env" : undefined}
      className={
        isTabletop
          ? "z-10 min-h-0 overflow-y-auto bg-background px-2"
          : "flex flex-col"
      }
      style={isTabletop ? detailPaneStyle : undefined}
      aria-hidden={isCompactTabletop && tabletopView !== "details"}
    >
      {/* Mobile: オーバーレイ検索ボタン */}
      {!isTabletop && (
        <div
          className={`${
            layoutMode === "portrait-theater" ? "block" : "md:hidden"
          } fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-2 invert`}
        >
          <button
            aria-label="Open song list"
            onClick={() => setOpenSongListOverlay?.(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full cursor-pointer bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-100 dark:border-gray-500 text-gray-800 dark:text-white"
          >
            <IoSearch className="w-6 h-6" />
          </button>
        </div>
      )}

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
          timeDisplayMode={timeDisplayMode}
          displaySongTitle={controlBar.displaySongTitle}
          displaySongArtist={controlBar.displaySongArtist}
          onOpenShareModal={() => setOpenShareModal(true)}
          volumeValue={controlBar.volumeValue}
          tempVolumeValue={controlBar.isMuted ? 0 : controlBar.tempVolumeValue}
          onVolumeIconClick={controlBar.handleVolumeIconClick}
          isTouchDevice={controlBar.isTouchDevice}
          showVolumeSlider={controlBar.showVolumeSlider}
          onVolumeChange={(e) =>
            controlBar.handleVolumeChange(
              e as import("react").ChangeEvent<HTMLInputElement>,
            )
          }
          currentSong={currentSong}
          hideFutureSongs={hideFutureSongs}
          setHideFutureSongs={setHideFutureSongs}
          isTheaterMode={isTheaterMode}
          onToggleTheaterMode={onToggleTheaterMode}
          showTheaterToggle={layoutMode === "landscape-columns"}
        />
      )}

      {!isCompactTabletop && (
        <div
          className={`${
            layoutMode === "landscape-columns" ? "block md:hidden" : "block"
          } mx-2 mt-2`}
        >
          <SongModeControls
            onSurprise={() => playRandomSong?.(songs)}
            onSelectSongMode={(mode) => setSearchTerm?.(mode)}
            currentSongMode={currentSongMode}
            onPlaylist={() => setShowPlaylistSelector?.(true)}
            variant="mobile"
          />
        </div>
      )}

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
                >
                  {renderLinkedText(timedLiveCallText ?? "")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {showNowPlayingInfo && (
        <NowPlayingSongInfo
          currentSong={currentSong}
          currentSongPlayCount={currentSongPlayCount}
          allSongs={allSongs}
          searchTerm={searchTerm}
          isPlaying={isPlaying}
          hideFutureSongs={hideFutureSongs}
          setSearchTerm={setSearchTerm}
          setOpenShereModal={setOpenShareModal}
          changeCurrentSong={changeCurrentSong}
          videoTitle={videoTitle}
          videoData={videoData}
          videoInfo={videoInfo}
          setHideFutureSongs={setHideFutureSongs}
        />
      )}
    </div>
  );

  const compactTabletopTabs = isCompactTabletop ? (
    <div
      data-testid="compact-tabletop-tabs"
      role="tablist"
      aria-label={t("viewSwitcher")}
      style={compactTabletopTabsStyle}
      className="z-30 grid grid-cols-2 border-b border-gray-200 bg-background px-2 dark:border-gray-700"
    >
      {(["details", "songs"] as const).map((view) => {
        const isActive = tabletopView === view;
        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabletopViewChange?.(view)}
            className={`flex min-w-0 items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-pink-500 text-pink-600 dark:text-pink-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {view === "details" ? (
              <FaInfoCircle className="h-4 w-4 shrink-0" />
            ) : (
              <IoList className="h-5 w-5 shrink-0" />
            )}
            <span className="truncate">{t(view)}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <aside
      className={
        isTabletop
          ? "contents"
          : `watch-player-section flex min-w-0 pr-0 transition-[width] duration-300 ease-in-out ${
              isTheaterMode || layoutMode === "portrait-theater"
                ? "w-full shrink-0"
                : "w-3/5 xl:w-7/12"
            }`
      }
    >
      {isTabletop ? (
        <>
          {videoPane}
          {compactTabletopTabs}
          {detailsPane}
        </>
      ) : (
        <OverlayScrollbarsComponent
          options={{ scrollbars: { autoHide: "leave" } }}
          element="div"
          className="player-section-scrollbars flex flex-col h-full w-full bg-background pr-0 lg:pr-3"
          defer
        >
          {videoPane}
          {detailsPane}
        </OverlayScrollbarsComponent>
      )}
    </aside>
  );
}
