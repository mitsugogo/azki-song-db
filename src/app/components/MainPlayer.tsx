"use client";

import { useState, useEffect, Suspense } from "react";

// Custom Hooks
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import usePlayerControls from "../hook/usePlayerControls";

// Components
import PlayerSection from "./PlayerSection";
import SearchAndSongList from "./SearchAndSongList";
import ShareModal from "./ShareModal";
import ToastNotification from "./ToastNotification";
import Loading from "../loading";
import usePlaylists from "../hook/usePlaylists";

/**
 * メインプレイヤー
 */
export default function MainPlayer() {
  // --- Hooks ---
  const {
    allSongs,
    isLoading: isSongDataLoading,
    availableTags,
    availableArtists,
    availableSingers,
    availableSongTitles,
    availableMilestones,
  } = useSongs();

  const { songs, setSongs, searchTerm, setSearchTerm } = useSearch(allSongs);

  const {
    currentSong,
    currentSongInfo,
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
    handleStateChange,
    setPreviousAndNextSongs,
  } = usePlayerControls(songs, allSongs);

  const { decodePlaylistUrlParam } = usePlaylists();

  useEffect(() => {
    if (!currentSongInfo) return;
    setPreviousAndNextSongs(currentSongInfo, songs);
  }, [currentSongInfo]);

  // 初回ロード完了で曲を再生
  useEffect(() => {
    if (songs.length === 0 || currentSongInfo) return;

    const urlParams = new URLSearchParams(window.location.search);
    const playlist = urlParams.get("playlist");

    if (playlist) {
      // プレイリストモード → 先頭曲
      changeCurrentSong(songs[0]);
      return;
    }

    if (searchTerm.includes("sololive2025")) {
      // ソロライブモード → 先頭曲
      changeCurrentSong(songs[0]);
      return;
    }

    // それ以外 → ランダム再生
    playRandomSong(songs);
  }, [songs, currentSongInfo, searchTerm, changeCurrentSong, playRandomSong]);

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
      (song) => song.video_id === currentSongInfo.video_id
    );
    setSearchTerm(`video_id:${currentSongInfo.video_id}`);
    changeCurrentSong(currentSongInfo, true);
    setPreviousAndNextSongs(currentSongInfo, songsInVideo);
  };

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
        handleStateChange={handleStateChange}
        changeCurrentSong={changeCurrentSong}
        playRandomSong={playRandomSong}
        setSongsToCurrentVideo={setSongsToCurrentVideo}
        setOpenShareModal={setOpenShareModal}
        setSearchTerm={setSearchTerm}
        setHideFutureSongs={setHideFutureSongs}
        isPlaying={isPlaying}
        playerKey={playerKey}
        hideFutureSongs={hideFutureSongs}
      />

      <SearchAndSongList
        songs={songs}
        allSongs={allSongs}
        currentSongInfo={currentSongInfo}
        searchTerm={searchTerm}
        availableSongTitles={availableSongTitles}
        availableArtists={availableArtists}
        availableSingers={availableSingers}
        availableTags={availableTags}
        availableMilestones={availableMilestones}
        hideFutureSongs={hideFutureSongs}
        changeCurrentSong={changeCurrentSong}
        playRandomSong={playRandomSong}
        setSearchTerm={setSearchTerm}
        setSongs={setSongs}
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
    </>
  );
}
