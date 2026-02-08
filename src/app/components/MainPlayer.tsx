"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import {
  Spotlight,
  SpotlightActionData,
  createSpotlight,
  spotlight,
} from "@mantine/spotlight";

// Custom Hooks
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import usePlayerControls from "../hook/usePlayerControls";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import usePlayerLifecycle from "../hook/usePlayerLifecycle";
import usePlayerVolume from "../hook/usePlayerVolume";
import { usePathname } from "next/navigation";

// Components
import PlayerSection from "./PlayerSection";
import SearchAndSongList from "./SearchAndSongList";
import ShareModal from "./ShareModal";
import ToastNotification from "./ToastNotification";
import Loading from "../loading";
import { FaMusic, FaShare, FaStar, FaTag, FaUser } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiHide } from "react-icons/bi";
import { IoMusicalNotes } from "react-icons/io5";

/**
 * メインプレイヤー
 */
export default function MainPlayer() {
  // Actions
  const [actionsSpotlightStore, actionsSpotlight] = createSpotlight();
  const [searchSpotlightStore, searchSpotlight] = createSpotlight();

  // グローバルプレイヤー
  const globalPlayer = useGlobalPlayer();
  const pathname = usePathname();
  const sharedPlayerRef = useRef<any>(null);

  // --- Hooks ---
  const {
    allSongs,
    isLoading: isSongDataLoading,
    availableTags,
    availableArtists,
    availableSingers,
    availableSongTitles,
    availableMilestones,
    availableTitleAndArtists,
  } = useSongs();

  const { songs, setSongs, searchTerm, setSearchTerm, searchSongs } =
    useSearch(allSongs);

  const {
    currentSong,
    currentSongRef,
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
    handlePlayerOnReady: originalHandlePlayerOnReady,
    handleStateChange: originalHandleStateChange,
    setPreviousAndNextSongs,
  } = usePlayerControls(songs, allSongs, globalPlayer);

  const {
    playerRef,
    isPlayerReady,
    playerDuration,
    playerCurrentTime,
    handlePlayerOnReady,
    handlePlayerStateChange,
    hasRestoredPosition,
    setHasRestoredPosition,
    previousVideoId,
    setPreviousVideoId,
  } = usePlayerLifecycle({
    originalHandlePlayerOnReady,
    originalHandleStateChange,
    globalPlayer,
    currentSong,
    isPlaying,
    playerRef: sharedPlayerRef,
  });

  // プレイヤーボリューム（ローカル状態はフックで管理）
  const {
    playerVolume,
    setPlayerVolume,
    changeVolume: changePlayerVolume,
    isMuted: persistedIsMuted,
    setMuted: setPersistedMuted,
  } = usePlayerVolume(sharedPlayerRef, isPlayerReady);

  const previousPathnameRef = useRef(pathname);

  const seekTo = useCallback(
    (seconds: number) => {
      if (
        playerRef.current &&
        typeof playerRef.current.seekTo === "function" &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const currentTime = playerRef.current.getCurrentTime();
        const newTime = Math.max(0, currentTime + seconds);
        playerRef.current.seekTo(newTime, true);
      }
    },
    [playerRef],
  );

  // キーボードイベント: 左右キーで動画を10秒前後させる
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 入力フィールドやテキストエリアにフォーカスがある場合は無視
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // 左右キーの処理
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekTo(-10);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekTo(10);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seekTo]);

  // isPlaying をグローバルプレイヤーに同期
  useEffect(() => {
    globalPlayer.setIsPlaying(isPlaying);
  }, [isPlaying, globalPlayer]);

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
  }, [pathname, currentSong, globalPlayer, currentSong, changeCurrentSong]);

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
    if (videoId && Number(currentSong.start) === startTime) {
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

  // --- Effects ---
  useEffect(() => {
    if (allSongs.length === 0) return;
    setBaseUrl(window.location.origin);
  }, [allSongs]);

  const setSongsToCurrentVideo = () => {
    if (!currentSong) return;
    const songsInVideo = allSongs.filter(
      (song) => song.video_id === currentSong.video_id,
    );
    setSearchTerm(`video_id:${currentSong.video_id}`);
    setSongs(songsInVideo);
    setPreviousAndNextSongs(currentSong, songsInVideo);
  };

  const playVideo = useCallback(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.playVideo === "function"
    ) {
      try {
        playerRef.current.playVideo();
      } catch (error) {
        console.error("Failed to play video:", error);
      }
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.pauseVideo === "function"
    ) {
      try {
        playerRef.current.pauseVideo();
      } catch (error) {
        console.error("Failed to pause video:", error);
      }
    }
  }, []);

  const changeVolume = useCallback(
    (volume: number) => {
      changePlayerVolume(volume);
    },
    [changePlayerVolume],
  );

  const seekToAbsolute = useCallback(
    (absoluteSeconds: number) => {
      if (
        !playerRef.current ||
        typeof playerRef.current.seekTo !== "function"
      ) {
        return;
      }
      try {
        const boundedAbsolute =
          playerDuration > 0
            ? Math.min(Math.max(absoluteSeconds, 0), playerDuration)
            : Math.max(absoluteSeconds, 0);
        playerRef.current.seekTo(boundedAbsolute, true);
        globalPlayer.setCurrentTime(boundedAbsolute);
      } catch (error) {
        console.error("Failed to seek:", error);
      }
    },
    [playerDuration, globalPlayer],
  );

  // seekToAbsolute を globalPlayer に登録
  useEffect(() => {
    globalPlayer.setSeekTo(seekToAbsolute);
    return () => {
      globalPlayer.setSeekTo(null);
    };
  }, [seekToAbsolute, globalPlayer]);

  const desktopPlayerControls = {
    isReady: isPlayerReady && Boolean(playerRef.current),
    play: playVideo,
    pause: pauseVideo,
    seekTo: seekToAbsolute,
    setVolume: changeVolume,
    mute: () => {
      setPersistedMuted?.(true);
    },
    unMute: () => {
      setPersistedMuted?.(false);
    },
    currentTime: playerCurrentTime,
    volume: playerVolume,
    isMuted: persistedIsMuted,
    duration: playerDuration,
  };

  // --- Render ---
  if (isSongDataLoading) {
    return <Loading />;
  }

  return (
    <>
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
        playerControls={desktopPlayerControls}
      />

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
      />

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
