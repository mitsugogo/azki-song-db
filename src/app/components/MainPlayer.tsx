"use client";

import { useState, useEffect, useRef } from "react";
import { useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { motion } from "motion/react";

// Custom Hooks
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import useMainPlayerControls from "../hook/useMainPlayerControls";
import { usePathname } from "next/navigation";

// Components
import PlayerSection from "./PlayerSection";
import SearchAndSongList from "./SearchAndSongList";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import ShareModal from "./ShareModal";
import ToastNotification from "./ToastNotification";
import Loading from "../loading";

/**
 * メインプレイヤー
 */
export default function MainPlayer() {
  // グローバルプレイヤー
  const globalPlayer = useGlobalPlayer();
  const pathname = usePathname();

  // --- Hooks ---
  const { allSongs, isLoading: isSongDataLoading } = useSongs();

  const { songs, setSongs, searchTerm, setSearchTerm, searchSongs } =
    useSearch(allSongs);

  const {
    currentSong,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    videoId,
    videoTitle,
    videoData,
    videoInfo,
    startTime,
    timedLiveCallText,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handlePlayerOnReady,
    handlePlayerStateChange,
    setPreviousAndNextSongs,
    setHasRestoredPosition,
    setPreviousVideoId,
    playerControls,
  } = useMainPlayerControls({
    songs,
    allSongs,
    globalPlayer,
  });

  const previousPathnameRef = useRef(pathname);

  // ホームページに戻ったらミニプレイヤーを非表示し、グローバルの曲を復元
  // ホームページから他ページへ遷移した瞬間だけ自動でミニプレイヤー化する
  useEffect(() => {
    const isHomePage = pathname === "/";
    const previousPathname = previousPathnameRef.current;

    if (!isHomePage && previousPathname === "/" && currentSong) {
      globalPlayer.setIsMinimized(true);
    } else if (isHomePage) {
      globalPlayer.maximizePlayer();
      const urlParams = new URLSearchParams(window.location.search);

      // 検索クエリで遷移してきたらグローバルプレイヤーを初期化
      if (urlParams.has("q")) {
        globalPlayer.setCurrentSong(null);
        globalPlayer.setIsPlaying(false);
        globalPlayer.setIsMinimized(false);
        globalPlayer.setCurrentTime(0);
        setHasRestoredPosition(false);
        setPreviousVideoId(null);
      } else {
        // URLパラメータがない場合のみ、グローバルプレイヤーから曲を復元
        const hasUrlParams =
          urlParams.has("v") ||
          urlParams.has("videoId") ||
          urlParams.has("playlist");
        if (hasUrlParams) {
          // URLパラメータのvideoIdを取得
          const urlVideoId = urlParams.get("v") || urlParams.get("videoId");
          // 現在の動画と異なる場合のみ再生位置をリセット
          if (urlVideoId && globalPlayer.currentSong?.video_id !== urlVideoId) {
            globalPlayer.setCurrentTime(0);
          }
        } else if (globalPlayer.currentSong && !currentSong) {
          changeCurrentSong(globalPlayer.currentSong);
        }
      }
    }

    previousPathnameRef.current = pathname;
  }, [pathname, currentSong, globalPlayer, changeCurrentSong]);

  useEffect(() => {
    if (!currentSong) return;
    setPreviousAndNextSongs(currentSong, songs);
  }, [currentSong]);

  // 曲を再生
  useEffect(() => {
    if (songs.length === 0) return;

    if (currentSong) return;

    const urlParams = new URLSearchParams(window.location.search);
    const playlist = urlParams.get("playlist");

    // URLパラメータがない場合のみ、グローバルプレイヤーに曲がある場合はそれを優先
    const hasUrlParams =
      urlParams.has("v") ||
      urlParams.has("videoId") ||
      urlParams.has("playlist");
    if (!hasUrlParams && globalPlayer.currentSong) {
      changeCurrentSong(globalPlayer.currentSong);
      return;
    }

    const videoId = urlParams.get("v");
    const startTime = Number(urlParams.get("t")?.replace("s", "")) || 0;

    if (videoId) {
      const song = songs.find(
        (s) => s.video_id === videoId && Number(s.start) === startTime,
      );
      // videoIdとstartTimeを直指定で再生する場合
      if (song) {
        changeCurrentSong(song);
        return;
      }
      if (!song) {
        // videoIdのみで曲を検索して再生する場合（startTimeは無視）
        const songByVideoId = songs.find((s) => s.video_id === videoId);
        if (songByVideoId) {
          changeCurrentSong(songByVideoId);
          return;
        }
      }
    }

    if (playlist) {
      // プレイリストモード → 先頭曲
      changeCurrentSong(songs[0]);
      return;
    }

    if (
      searchTerm.includes("sololive2025") ||
      searchTerm.includes("original-songs")
    ) {
      // オリ曲モード → 先頭曲
      changeCurrentSong(songs[0]);
      return;
    }

    // それ以外 → ランダム再生
    playRandomSong(songs);
  }, [songs, currentSong, searchTerm, changeCurrentSong, playRandomSong]);

  // URLにvとtが揃ったリクエストが新たに発生した場合
  useEffect(() => {
    if (!currentSong) return;
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");
    const startTime = Number(urlParams.get("t")?.replace("s", "")) || 0;
    // URL の `v` と `t` による外部リクエストは、現在選択中の動画と異なる動画を対象とする場合のみ処理
    // `song.start` を示し続けさせる
    if (videoId && (!currentSong || currentSong.video_id !== videoId)) {
      changeCurrentSong(null, videoId, startTime);
    }
  }, [currentSong]);

  // --- State for UI ---
  const [baseUrl, setBaseUrl] = useState("");
  // Mobile song list overlay state
  const [isSongListOverlayOpen, setIsSongListOverlayOpen] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [openShareModal, setOpenShareModal] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useLocalStorage<boolean>({
    key: "player-theater-mode",
    defaultValue: false,
  });
  const isDesktopControlsVisible = useMediaQuery("(min-width: 1024px)");
  const [foldableMode] = useLocalStorage<"default" | "foldable">({
    key: "foldable-mode",
    defaultValue: "default",
  });
  const canUseTheaterMode =
    isDesktopControlsVisible || foldableMode === "foldable";

  // --- Effects ---
  useEffect(() => {
    if (allSongs.length === 0) return;
    setBaseUrl(window.location.origin);
  }, [allSongs]);

  useEffect(() => {
    if (canUseTheaterMode) return;
    if (!isTheaterMode) return;
    setIsTheaterMode(false);
  }, [canUseTheaterMode, isTheaterMode, setIsTheaterMode]);

  const setSongsToCurrentVideo = () => {
    if (!currentSong) return;
    const songsInVideo = allSongs.filter(
      (song) => song.video_id === currentSong.video_id,
    );
    setSearchTerm(`video_id:${currentSong.video_id}`);
    setSongs(songsInVideo);
    setPreviousAndNextSongs(currentSong, songsInVideo);
  };

  // --- Render ---
  if (isSongDataLoading) {
    return <Loading />;
  }

  return (
    <>
      <div
        className={`flex min-h-0 w-full flex-col md:h-full ${
          isTheaterMode
            ? "md:flex-col md:overflow-y-auto md:[scrollbar-width:none] md:[-ms-overflow-style:none] md:[&::-webkit-scrollbar]:hidden"
            : "md:flex-row"
        }`}
      >
        <PlayerSection
          currentSong={currentSong}
          previousSong={previousSong}
          nextSong={nextSong}
          allSongs={allSongs}
          songs={songs}
          searchTerm={searchTerm}
          videoId={videoId}
          startTime={startTime}
          videoTitle={videoTitle}
          videoData={videoData}
          videoInfo={videoInfo}
          timedLiveCallText={timedLiveCallText ?? ""}
          setSongs={setSongs}
          searchSongs={searchSongs}
          handlePlayerOnReady={handlePlayerOnReady}
          handleStateChange={handlePlayerStateChange}
          changeCurrentSong={changeCurrentSong}
          playRandomSong={playRandomSong}
          setSongsToCurrentVideo={setSongsToCurrentVideo}
          setOpenShareModal={setOpenShareModal}
          setSearchTerm={setSearchTerm}
          setHideFutureSongs={setHideFutureSongs}
          setOpenSongListOverlay={setIsSongListOverlayOpen}
          setShowPlaylistSelector={setShowPlaylistSelector}
          isPlaying={isPlaying}
          playerKey={playerKey}
          hideFutureSongs={hideFutureSongs}
          playerControls={playerControls}
          isTheaterMode={isTheaterMode}
          onToggleTheaterMode={() => setIsTheaterMode((prev) => !prev)}
          showNowPlayingInfo={!isTheaterMode}
        />

        {/* 通常モード: 右カラムに楽曲一覧 */}
        {!isTheaterMode && (
          <SearchAndSongList
            songs={songs}
            allSongs={allSongs}
            currentSong={currentSong}
            searchTerm={searchTerm}
            hideFutureSongs={hideFutureSongs}
            changeCurrentSong={changeCurrentSong}
            playRandomSong={playRandomSong}
            setSearchTerm={setSearchTerm}
            setSongs={setSongs}
            searchSongs={searchSongs}
            showPlaylistSelector={showPlaylistSelector}
            setShowPlaylistSelector={setShowPlaylistSelector}
            isOverlayOpen={isSongListOverlayOpen}
            setIsOverlayOpen={setIsSongListOverlayOpen}
            isTheaterMode={false}
          />
        )}

        {/* シアターモード: プレイヤー下段に楽曲詳細(左)＋楽曲一覧(右) */}
        {isTheaterMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex w-full flex-col mt-2 md:flex-row md:items-start md:gap-2 lg:gap-4 foldable:flex-col"
          >
            <div className="hidden md:block md:w-2/3 xl:w-9/12 pr-0 lg:pr-3 foldable:w-full">
              <NowPlayingSongInfo
                currentSong={currentSong}
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
            </div>

            <div className="w-full md:w-1/3 xl:w-5/12 foldable:w-full">
              <SearchAndSongList
                songs={songs}
                allSongs={allSongs}
                currentSong={currentSong}
                searchTerm={searchTerm}
                hideFutureSongs={hideFutureSongs}
                changeCurrentSong={changeCurrentSong}
                playRandomSong={playRandomSong}
                setSearchTerm={setSearchTerm}
                setSongs={setSongs}
                searchSongs={searchSongs}
                showPlaylistSelector={showPlaylistSelector}
                setShowPlaylistSelector={setShowPlaylistSelector}
                isOverlayOpen={isSongListOverlayOpen}
                setIsOverlayOpen={setIsSongListOverlayOpen}
                isTheaterMode={true}
              />
            </div>
          </motion.div>
        )}
      </div>

      {showToast && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      <ShareModal
        openShareModal={openShareModal}
        currentSong={currentSong}
        baseUrl={baseUrl}
        onClose={() => setOpenShareModal(false)}
      />
    </>
  );
}
