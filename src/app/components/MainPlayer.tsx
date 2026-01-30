"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import {
  Spotlight,
  SpotlightActionData,
  createSpotlight,
  spotlight,
} from "@mantine/spotlight";
import { YouTubeEvent } from "react-youtube";

// Custom Hooks
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import usePlayerControls from "../hook/usePlayerControls";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
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
    currentSongInfo,
    currentSongRef,
    currentSongInfoRef,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    videoId,
    startTime,
    timedLiveCallText,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handlePlayerOnReady: originalHandlePlayerOnReady,
    handleStateChange: originalHandleStateChange,
    setPreviousAndNextSongs,
  } = usePlayerControls(songs, allSongs);

  // 再生位置復元のためのフラグと前回の動画ID
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const [previousVideoId, setPreviousVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const previousPathnameRef = useRef(pathname);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(100);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const updatePlayerSnapshot = useCallback((playerInstance: any) => {
    if (!playerInstance) return;
    if (typeof playerInstance.getDuration === "function") {
      const duration = playerInstance.getDuration();
      if (Number.isFinite(duration)) {
        setPlayerDuration(duration);
      }
    }
    if (typeof playerInstance.getVolume === "function") {
      const volume = playerInstance.getVolume();
      if (Number.isFinite(volume)) {
        setPlayerVolume(volume);
      }
    }
    if (typeof playerInstance.getCurrentTime === "function") {
      const currentTime = playerInstance.getCurrentTime();
      if (Number.isFinite(currentTime)) {
        setPlayerCurrentTime(currentTime);
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (
      playerRef.current &&
      typeof playerRef.current.seekTo === "function" &&
      typeof playerRef.current.getCurrentTime === "function"
    ) {
      const currentTime = playerRef.current.getCurrentTime();
      const newTime = Math.max(0, currentTime + seconds);
      playerRef.current.seekTo(newTime, true);
    }
  }, []);

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

  // handlePlayerOnReadyをラップして再生位置を復元
  const handlePlayerOnReady = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandlePlayerOnReady(event);
      playerRef.current = event.target;
      updatePlayerSnapshot(event.target);
      setIsPlayerReady(true);

      // 動画IDが変わっていない場合のみ再生位置を復元
      const currentVideoId = currentSongInfo?.video_id;
      const shouldRestorePosition =
        currentVideoId === previousVideoId &&
        globalPlayer.currentTime > 0 &&
        !hasRestoredPosition;

      if (shouldRestorePosition) {
        setTimeout(() => {
          const player = event.target;
          if (player && typeof player.seekTo === "function") {
            player.seekTo(globalPlayer.currentTime, true);
            setHasRestoredPosition(true);
          }
        }, 500);
      } else if (currentVideoId !== previousVideoId) {
        // 動画IDが変わった場合は復元済みフラグをリセット
        setHasRestoredPosition(false);
      }
    },
    [
      originalHandlePlayerOnReady,
      globalPlayer.currentTime,
      hasRestoredPosition,
      currentSongInfo?.video_id,
      previousVideoId,
      updatePlayerSnapshot,
    ],
  );

  const handlePlayerStateChange = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandleStateChange(event);
      updatePlayerSnapshot(event.target);
    },
    [originalHandleStateChange, updatePlayerSnapshot],
  );

  // 再生中は定期的にcurrentTimeを更新（ゆるめのポーリングで再レンダリングを抑制）
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !isPlaying) return;

    let lastTime =
      typeof playerRef.current.getCurrentTime === "function"
        ? playerRef.current.getCurrentTime()
        : 0;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const currentTime = playerRef.current.getCurrentTime();
        if (Number.isFinite(currentTime)) {
          // 0.25秒以上動いたときだけstate更新して再レンダリング回数を削減
          if (Math.abs(currentTime - lastTime) >= 0.25) {
            lastTime = currentTime;
            setPlayerCurrentTime(currentTime);
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  // グローバルプレイヤーと同期（動画が変わったときのみリセット）
  useEffect(() => {
    if (!currentSongInfo) {
      globalPlayer.setCurrentSong(null);
      setPreviousVideoId(null);
      return;
    }

    const currentVideoId = currentSongInfo.video_id;

    // 動画IDが変わった場合のみ再生位置をリセット
    if (currentVideoId !== previousVideoId) {
      if (previousVideoId !== null) {
        // 初回以外で動画が変わった場合
        globalPlayer.setCurrentTime(0);
        setHasRestoredPosition(false);
      }
      setPreviousVideoId(currentVideoId);
    }

    globalPlayer.setCurrentSong(currentSongInfo);
  }, [currentSongInfo, globalPlayer, previousVideoId]);

  useEffect(() => {
    globalPlayer.setIsPlaying(isPlaying);
  }, [isPlaying, globalPlayer]);

  useEffect(() => {
    if (!currentSongInfo) {
      setIsPlayerReady(false);
    }
  }, [currentSongInfo]);

  // 再生位置を定期的に保存
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        globalPlayer.setCurrentTime(time);
      }
    }, 1000); // 1秒ごとに保存

    return () => clearInterval(interval);
  }, [isPlaying, globalPlayer]);

  // ホームページに戻ったらミニプレイヤーを非表示し、グローバルの曲を復元
  // ホームページから他ページへ遷移した瞬間だけ自動でミニプレイヤー化する
  useEffect(() => {
    const isHomePage = pathname === "/";
    const previousPathname = previousPathnameRef.current;

    if (!isHomePage && previousPathname === "/" && currentSongInfo) {
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
  }, [pathname, currentSongInfo, globalPlayer, currentSong, changeCurrentSong]);

  useEffect(() => {
    if (!currentSongInfo) return;
    setPreviousAndNextSongs(currentSongInfo, songs);
  }, [currentSongInfo]);

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
  }, [songs, currentSongInfo, searchTerm, changeCurrentSong, playRandomSong]);

  // URLにvとtが揃ったリクエストが新たに発生した場合
  useEffect(() => {
    if (!currentSongInfo) return;
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");
    const startTime = Number(urlParams.get("t")?.replace("s", "")) || 0;
    if (videoId && Number(currentSongInfo.start) === startTime) {
      changeCurrentSong(null, false, videoId, startTime);
    }
  }, [currentSongInfo]);

  // --- State for UI ---
  const [baseUrl, setBaseUrl] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [openShareModal, setOpenShareModal] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (allSongs.length === 0) return;
    setBaseUrl(window.location.origin);
  }, [allSongs]);

  const setSongsToCurrentVideo = () => {
    if (!currentSongInfo) return;
    const songsInVideo = allSongs.filter(
      (song) => song.video_id === currentSongInfo.video_id,
    );
    setSearchTerm(`video_id:${currentSongInfo.video_id}`);
    changeCurrentSong(currentSongInfo, true);
    setPreviousAndNextSongs(currentSongInfo, songsInVideo);
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
      // プレイヤーが準備できていない場合は何もしない
      if (!isPlayerReady) {
        return;
      }

      if (
        !playerRef.current ||
        typeof playerRef.current.setVolume !== "function"
      ) {
        return;
      }

      try {
        const clampedVolume = Math.min(Math.max(Math.round(volume), 0), 100);
        playerRef.current.setVolume(clampedVolume);
        setPlayerVolume(clampedVolume);
      } catch (error) {
        // エラーが発生しても処理を継続（プレイヤーが完全に準備できていない可能性がある）
        console.warn("Failed to set volume (player may not be ready):", error);
      }
    },
    [isPlayerReady],
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

  const desktopPlayerControls = {
    isReady: isPlayerReady && Boolean(playerRef.current),
    play: playVideo,
    pause: pauseVideo,
    seekTo: seekToAbsolute,
    setVolume: changeVolume,
    currentTime: playerCurrentTime,
    volume: playerVolume,
    duration: playerDuration,
  };

  // --- Spotlight Actions ---
  const searchActions: SpotlightActionData[] = [
    // アーティスト名検索
    ...availableArtists
      .filter((artist) => artist !== "")
      .map((artist) => ({
        id: `artist-${artist}`,
        title: artist,
        description: `アーティスト: ${artist}`,
        group: "アーティスト",
        onClick: () => {
          setSearchTerm(`artist:${artist}`); // 既存の検索クエリを設定
          spotlight.close();
        },
        leftSection: <FaUser />,
      })),

    // 歌手名検索
    ...availableSingers
      .filter((singer) => singer !== "")
      .map((singer) => ({
        id: `singer-${singer}`,
        title: singer,
        description: `歌った人: ${singer}`,
        group: "歌った人",
        onClick: () => {
          setSearchTerm(`singer:${singer}`);
          spotlight.close();
        },
        leftSection: <FaUser />,
      })),

    // タグ検索
    ...availableTags
      .filter((tag) => tag !== "")
      .map((tag) => ({
        id: `tag-${tag}`,
        title: tag,
        description: `タグ: ${tag}`,
        group: "タグ",
        onClick: () => {
          setSearchTerm(`tag:${tag}`);
          spotlight.close();
        },
        leftSection: <FaTag />,
      })),

    // マイルストーン検索
    ...availableMilestones
      .filter((milestone) => milestone !== "")
      .map((milestone) => ({
        id: `milestone-${milestone}`,
        title: milestone,
        description: `マイルストーン: ${milestone}`,
        group: "マイルストーン",
        onClick: () => {
          setSearchTerm(`milestone:${milestone}`);
          spotlight.close();
        },
        leftSection: <FaStar />,
      })),

    // 曲名+アーティスト検索
    ...availableTitleAndArtists
      .filter((s) => s.title !== "")
      .map((s, idx) => ({
        id: `song-and-artist-${idx}`,
        title: s.title + " - " + s.artist,
        description: `${s.title} - ${s.artist}`,
        group: "曲名+アーティスト",
        onClick: () => {
          setSearchTerm(`title:${s.title}|artist:${s.artist}`);
          spotlight.close();
        },
        leftSection: <FaMusic />,
      })),
  ];

  const spotlightActions: SpotlightActionData[] = [
    {
      id: "search-songs",
      title: "楽曲検索",
      label: "楽曲検索",
      description: "楽曲を検索する",
      onClick: () => {
        spotlight.close();
        searchSpotlight.open();
      },
      leftSection: <IoMusicalNotes />,
    },
    {
      id: "share",
      title: "シェア",
      label: "シェア",
      description: "現在の楽曲をシェアする",
      onClick: () => {
        setOpenShareModal(true);
        spotlight.close();
      },
      leftSection: <FaShare />,
    },
    {
      id: "hide-future-songs",
      title: "セトリネタバレ防止モード",
      label: "セトリネタバレ防止モード",
      description: "再生中の動画で歌っている曲以降の曲を非表示にします",
      onClick: () => {
        // toggle
        setHideFutureSongs(!hideFutureSongs);
        spotlight.close();
      },
      leftSection: <BiHide />,
    },
  ];

  // --- Render ---
  if (isSongDataLoading) {
    return <Loading />;
  }

  return (
    <>
      <PlayerSection
        currentSong={currentSong}
        currentSongInfo={currentSongInfo}
        previousSong={previousSong}
        nextSong={nextSong}
        allSongs={allSongs}
        songs={songs}
        searchTerm={searchTerm}
        videoId={videoId}
        startTime={startTime}
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
        isPlaying={isPlaying}
        playerKey={playerKey}
        hideFutureSongs={hideFutureSongs}
        playerControls={desktopPlayerControls}
      />

      <SearchAndSongList
        songs={songs}
        allSongs={allSongs}
        currentSongInfo={currentSongInfo}
        searchTerm={searchTerm}
        hideFutureSongs={hideFutureSongs}
        changeCurrentSong={changeCurrentSong}
        playRandomSong={playRandomSong}
        setSearchTerm={setSearchTerm}
        setSongs={setSongs}
        searchSongs={searchSongs}
      />

      {showToast && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      <ShareModal
        openShareModal={openShareModal}
        currentSongInfo={currentSongInfo}
        baseUrl={baseUrl}
        onClose={() => setOpenShareModal(false)}
      />

      {/* Spotlight */}
      <Spotlight
        actions={spotlightActions}
        store={actionsSpotlightStore}
        nothingFound="検索結果が見つかりません"
        shortcut={["/"]}
        highlightQuery
        scrollable
        searchProps={{
          leftSection: <FaSearch />,
          placeholder: "アクション検索...",
        }}
      />
      <Spotlight
        actions={searchActions}
        store={searchSpotlightStore}
        nothingFound="検索結果が見つかりません"
        shortcut={["ctrl+K"]}
        highlightQuery
        scrollable
        searchProps={{
          leftSection: <FaSearch />,
          placeholder: "アーティスト名・曲名・タグなどで検索...",
        }}
      />
    </>
  );
}
