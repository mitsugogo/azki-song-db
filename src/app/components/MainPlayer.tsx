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
    advancedSearchOpen,
    setAdvancedSearchOpen,
    setSearchTitle,
    setSearchArtist,
    setSearchSinger,
    setSearchTag,
    setSearchMilestone,
    searchTitleRef,
    searchArtistRef,
    searchSingerRef,
    searchTagRef,
    searchMilestoneRef,
    handleAdvancedSearch,
    searchSongs,
    isInitialLoading,
    setIsInitialLoading,
  } = useSearch(allSongs);

  const {
    currentSong,
    currentSongInfo,
    previousSong,
    nextSong,
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
  const [showCopied, setShowCopied] = useState(false);
  const [showCopiedYoutube, setShowCopiedYoutube] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (allSongs.length === 0) return;

    setBaseUrl(window.location.origin);
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    const videoId = urlParams.get("v");
    const startTime = urlParams.get("t")?.replace("s", "");

    let filteredSongs = allSongs;
    if (query) {
      setSearchTerm(query);
      filteredSongs = searchSongs(allSongs, query);
    }

    if (videoId && startTime) {
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
    } else {
      playRandomSong(filteredSongs);
    }
    setSongs(filteredSongs);
    setIsInitialLoading(false);
  }, [allSongs]);

  // --- Handlers ---
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setToastMessage("コピーしました");
        setShowToast(true);
      },
      () => {
        setToastMessage("コピーに失敗しました");
        setShowToast(true);
      }
    );
  };

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
    return (
      <div className="flex w-full h-dvh items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
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
      />

      <SearchAndSongList
        songs={songs}
        allSongs={allSongs}
        currentSongInfo={currentSongInfo}
        searchTerm={searchTerm}
        advancedSearchOpen={advancedSearchOpen}
        availableSongTitles={availableSongTitles}
        availableArtists={availableArtists}
        availableSingers={availableSingers}
        availableTags={availableTags}
        availableMilestones={availableMilestones}
        searchTitleRef={searchTitleRef}
        searchArtistRef={searchArtistRef}
        searchSingerRef={searchSingerRef}
        searchTagRef={searchTagRef}
        searchMilestoneRef={searchMilestoneRef}
        changeCurrentSong={changeCurrentSong}
        playRandomSong={playRandomSong}
        setSearchTerm={setSearchTerm}
        setAdvancedSearchOpen={setAdvancedSearchOpen}
        handleAdvancedSearch={handleAdvancedSearch}
        setSearchTitle={setSearchTitle}
        setSearchArtist={setSearchArtist}
        setSearchSinger={setSearchSinger}
        setSearchTag={setSearchTag}
        setSearchMilestone={setSearchMilestone}
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
        showCopied={showCopied}
        showCopiedYoutube={showCopiedYoutube}
        onClose={() => setOpenShareModal(false)}
        copyToClipboard={copyToClipboard}
        setShowCopied={setShowCopied}
        setShowCopiedYoutube={setShowCopiedYoutube}
      />
    </>
  );
}
