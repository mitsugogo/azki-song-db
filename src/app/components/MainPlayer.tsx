"use client";

import { useState, useEffect } from "react";
import { Spinner } from "flowbite-react";

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

  const {
    songs,
    setSongs,
    searchTerm,
    setSearchTerm,
    searchSongs,
    setIsInitialLoading,
  } = useSearch(allSongs);

  const {
    currentSong,
    currentSongInfo,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handleStateChange,
    setPreviousAndNextSongs,
  } = usePlayerControls(songs, allSongs);

  useEffect(() => {
    if (!currentSongInfo) return;
    setPreviousAndNextSongs(currentSongInfo, songs);
  }, [currentSongInfo, songs]);

  // --- State for UI ---
  const [baseUrl, setBaseUrl] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [openShareModal, setOpenShareModal] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (allSongs.length === 0) return;

    setBaseUrl(window.location.origin);
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    const videoId = urlParams.get("v");
    const startTime = urlParams.get("t")?.replace("s", "");
    const pvId = urlParams.get("pvid");

    let filteredSongs = allSongs;
    if (query) {
      setSearchTerm(query);
      filteredSongs = searchSongs(allSongs, query);
    }

    // ソロライブモードの場合は強制的に先頭の曲(Creating world)からスタート
    if (urlParams.get("q") === "sololive2025") {
      changeCurrentSong(filteredSongs[0]);
      setSongs(filteredSongs);
      setIsInitialLoading(false);
      return;
    }

    if (pvId) {
      // この動画idから再生する
      const song = filteredSongs.find((s) => s.video_id === pvId);
      if (song) {
        changeCurrentSong(song);
      } else {
        playRandomSong(filteredSongs);
      }
    } else if (videoId && startTime) {
      const targetSong = filteredSongs.find(
        (song) =>
          song.video_id === videoId &&
          Math.abs(parseInt(song.start) - parseInt(startTime || "0")) <= 2
      );
      if (targetSong) {
        changeCurrentSong(targetSong);
      } else {
        playRandomSong(filteredSongs);
      }
    } else if (videoId) {
      const targetSong = filteredSongs.find(
        (song) => song.video_id === videoId
      );
      if (targetSong) {
        changeCurrentSong(targetSong);
      }
    } else {
      playRandomSong(filteredSongs);
    }
    setSongs(filteredSongs);
    setIsInitialLoading(false);
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
