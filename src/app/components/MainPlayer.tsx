"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import YouTube, { YouTubeEvent } from "react-youtube";
import ToastNotification from "./ToastNotification";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  TextInput,
  Label,
} from "flowbite-react";
import {
  HiChevronDown,
  HiChevronUp,
  HiClipboardCopy,
  HiSearch,
  HiX,
} from "react-icons/hi";
import { GiPreviousButton, GiNextButton } from "react-icons/gi";
import {
  FaCompactDisc,
  FaDatabase,
  FaMusic,
  FaShare,
  FaShuffle,
  FaTag,
  FaUser,
  FaX,
  FaYoutube,
} from "react-icons/fa6";
import { RiPlayListFill } from "react-icons/ri";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import SongsList from "./SongList";
import FlowbiteReactAutocomplete from "./FlowbiteReactAutocomplete";
import YoutubeThumbnail from "./YoutubeThumbnail";
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import usePlayerControls from "../hook/usePlayerControls";

// ============================================================================
// Main Component
// ============================================================================

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

  // --- State for UI ---
  const [baseUrl, setBaseUrl] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [openShareModal, setOpenShareModal] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showCopiedYoutube, setShowCopiedYoutube] = useState(false);

  // --- Effects ---
  // 初期化処理
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
  }, [allSongs]); // allSongsがロードされた後に一度だけ実行

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
      {/* Player and Song Info Section */}
      <aside className="flex md:w-8/12 lg:w-2/3 xl:w-9/12 sm:w-full">
        <div className="flex flex-col h-full w-full bg-background overflow-auto">
          <div className="relative aspect-video w-full bg-black">
            <div className="absolute top-0 left-0 w-full h-full">
              {currentSong && (
                <YouTubePlayer
                  key="youtube-player"
                  song={currentSong}
                  onStateChange={handleStateChange}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col p-2 pl-2 lg:px-0 text-sm text-foreground">
            {/* Previous/Next Song Display (Desktop) */}
            <div className="hidden lg:flex w-full justify-between gap-2">
              <div
                className="h-14 w-2/6 p-0 truncate rounded bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer hover:bg-gray-300"
                onClick={() => changeCurrentSong(previousSong)}
              >
                {previousSong && (
                  <div className="flex items-center h-14">
                    <div className="flex w-24 min-w-24 max-w-24 align-middle">
                      <YoutubeThumbnail
                        videoId={previousSong.video_id}
                        alt={previousSong.video_title}
                        fill={true}
                      />
                    </div>
                    <div className="flex flex-auto flex-col px-2 truncate">
                      <span className="text-left font-bold truncate">
                        {previousSong.title}
                      </span>
                      <span className="text-left text-xs text-muted truncate">
                        {previousSong.artist}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="relative h-14 w-2/6 p-0 truncate rounded bg-primary-300 dark:bg-primary-900 dark:text-gray-300 border-0 shadow-none cursor-pointer hover:bg-primary-400"
                onClick={setSongsToCurrentVideo}
              >
                {currentSongInfo && (
                  <div className="flex items-center h-14">
                    <div className="flex w-24 min-w-24 max-w-24 align-middle">
                      <YoutubeThumbnail
                        videoId={currentSongInfo.video_id}
                        alt={currentSongInfo.video_title}
                        fill={true}
                      />
                    </div>
                    <div className="flex flex-auto flex-col px-2 truncate">
                      <span className="text-left font-bold truncate">
                        {currentSongInfo.title}
                      </span>
                      <span className="text-left text-xs text-muted truncate">
                        {currentSongInfo.artist}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="h-14 w-2/6 p-0 truncate rounded bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-right cursor-pointer hover:bg-gray-300"
                onClick={() => changeCurrentSong(nextSong)}
              >
                {nextSong && (
                  <div className="flex items-center h-14">
                    <div className="flex w-24 min-w-24 max-w-24 align-middle">
                      <YoutubeThumbnail
                        videoId={nextSong.video_id}
                        alt={nextSong.video_title}
                        fill={true}
                      />
                    </div>
                    <div className="flex flex-col px-2 truncate">
                      <span className="text-left font-bold truncate">
                        {nextSong.title}
                      </span>
                      <span className="text-left text-xs text-muted truncate">
                        {nextSong.artist}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Player Controls (Mobile) */}
            <div className="flex lg:hidden justify-between">
              <ButtonGroup className="shadow-none">
                <Button
                  onClick={() => changeCurrentSong(previousSong)}
                  disabled={!previousSong}
                  className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary border-none text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <GiPreviousButton />
                </Button>
                <Button
                  onClick={() => changeCurrentSong(nextSong)}
                  disabled={!nextSong}
                  className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <GiNextButton />
                </Button>
              </ButtonGroup>
              <Button
                onClick={setSongsToCurrentVideo}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer"
              >
                <RiPlayListFill />
                &nbsp;この歌枠を連続再生
              </Button>
              <ButtonGroup className="shadow-none">
                <Button
                  onClick={() => playRandomSong(songs)}
                  className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm  cursor-pointer"
                >
                  <FaShuffle />
                  &nbsp;ランダム
                </Button>
              </ButtonGroup>
              <div className="flex justify-end">
                <Button
                  onClick={() => setOpenShareModal(true)}
                  className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer"
                >
                  <FaShare />
                  &nbsp;Share
                </Button>
              </div>
            </div>
          </div>
          <NowPlayingSongInfo
            currentSongInfo={currentSongInfo}
            allSongs={allSongs}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setOpenShereModal={setOpenShareModal}
            changeCurrentSong={changeCurrentSong}
          />
        </div>
      </aside>

      {/* Song List and Search Section */}
      <section className="flex md:w-4/12 lg:w-1/3 xl:w-5/12 sm:w-full flex-col min-h-0 h-dvh md:h-full lg:h-full lg:ml-3 sm:mx-0">
        <div className="flex flex-col h-full bg-background px-2 lg:px-0 lg:pl-2 py-0">
          <Button
            onClick={() => playRandomSong(songs)}
            className="hidden lg:block px-3 py-2 bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition mb-2 shadow-md shadow-primary-400/20 dark:shadow-none"
          >
            ランダムで他の曲にする
          </Button>
          <div className="mb-4 md:mt-2 lg:mt-0">
            {/* Search Bar */}
            <div className="relative">
              <TextInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="検索"
                icon={HiSearch}
                disabled={advancedSearchOpen}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setSearchTerm("")}
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Advanced Search */}
            <Button
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
              className={`text-xs h-5 p-4 py-0 w-full transition focus:ring-0 mt-1 cursor-pointer ${
                !advancedSearchOpen
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white"
                  : "bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white"
              }`}
            >
              高度な検索{" "}
              {!advancedSearchOpen ? <HiChevronUp /> : <HiChevronDown />}
            </Button>
            <div
              className={`mb-6 ${
                advancedSearchOpen ? "visible" : "hidden"
              } transition-all duration-300 ease-in-out mt-1`}
            >
              <div className="relative mt-1">
                <FlowbiteReactAutocomplete
                  options={availableSongTitles}
                  onSelect={(value) => {
                    searchTitleRef.current = value;
                    setSearchTitle(value);
                    handleAdvancedSearch();
                  }}
                  inputProps={{ icon: FaMusic, placeholder: "曲名" }}
                />
              </div>
              <div className="relative mt-1">
                <FlowbiteReactAutocomplete
                  options={availableArtists}
                  onSelect={(value) => {
                    searchArtistRef.current = value;
                    setSearchArtist(value);
                    handleAdvancedSearch();
                  }}
                  inputProps={{ icon: FaUser, placeholder: "アーティスト" }}
                />
              </div>
              <div className="relative mt-1">
                <FlowbiteReactAutocomplete
                  options={availableSingers}
                  onSelect={(value) => {
                    searchSingerRef.current = value;
                    setSearchSinger(value);
                    handleAdvancedSearch();
                  }}
                  inputProps={{ icon: FaCompactDisc, placeholder: "歌った人" }}
                />
              </div>
              <div className="relative mt-1">
                <FlowbiteReactAutocomplete
                  options={availableTags}
                  onSelect={(value) => {
                    searchTagRef.current = value;
                    setSearchTag(value);
                    handleAdvancedSearch();
                  }}
                  inputProps={{ icon: FaTag, placeholder: "タグ" }}
                />
              </div>
              <div className="relative mt-1">
                <FlowbiteReactAutocomplete
                  options={availableMilestones}
                  onSelect={(value) => {
                    searchMilestoneRef.current = value;
                    setSearchMilestone(value);
                    handleAdvancedSearch();
                  }}
                  inputProps={{
                    icon: FaCompactDisc,
                    placeholder: "マイルストーン",
                  }}
                />
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground dark:text-white mb-2">
              楽曲一覧 ({songs.length}曲/{allSongs.length}曲)
            </p>
          </div>
          <SongsList
            songs={songs}
            currentSongInfo={currentSongInfo}
            changeCurrentSong={changeCurrentSong}
          />
        </div>
      </section>

      {/* Toast Notification */}
      {showToast && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Share Modal */}
      <Modal
        show={openShareModal}
        onClose={() => setOpenShareModal(false)}
        size="md"
        style={{ zIndex: 999 }}
      >
        <ModalHeader className="bg-white dark:bg-gray-800 dark:text-white">
          シェア
        </ModalHeader>
        <ModalBody className="bg-white dark:bg-gray-800 dark:text-white">
          <p className="mb-4">AZKiさんの素敵な歌声をシェアしましょう！</p>
          {/* YouTube URL */}
          <div>
            <Label>
              <FaYoutube className="inline" />
              &nbsp;YouTube URL (AZKi Channel)
            </Label>
            <div className="relative">
              <TextInput
                className="w-full"
                value={`https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`}
                readOnly
                onClick={() => {
                  copyToClipboard(
                    `https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`
                  );
                  setShowCopiedYoutube(true);
                  setTimeout(() => setShowCopiedYoutube(false), 3000);
                }}
              />
              <button
                className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  copyToClipboard(
                    `https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`
                  );
                  setShowCopiedYoutube(true);
                  setTimeout(() => setShowCopiedYoutube(false), 3000);
                }}
              >
                <HiClipboardCopy className="w-4 h-4" />
              </button>
              {showCopiedYoutube && (
                <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                  copied!
                </div>
              )}
            </div>
            <div className="mt-2">
              <Button
                size="xs"
                className="bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900"
                onClick={() => {
                  const text = `${currentSongInfo?.video_title} \nhttps://www.youtube.com/watch/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                  window.open(
                    `https://x.com/intent/tweet?text=${encodeURIComponent(
                      text
                    )}`
                  );
                }}
              >
                <FaX className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* AZKi Song Database URL */}
          <div className="mt-4">
            <Label>
              <FaDatabase className="inline" />
              &nbsp;AZKi Song Database
            </Label>
            <div className="relative">
              <TextInput
                className="w-full"
                value={`${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`}
                readOnly
                onClick={() => {
                  copyToClipboard(
                    `${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`
                  );
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 3000);
                }}
              />
              <button
                className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  copyToClipboard(
                    `${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`
                  );
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 3000);
                }}
              >
                <HiClipboardCopy className="w-4 h-4" />
              </button>
              {showCopied && (
                <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                  copied!
                </div>
              )}
            </div>
            <div className="mt-2">
              <Button
                size="xs"
                className="bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900"
                onClick={() => {
                  const text = `Now Playing♪ ${currentSongInfo?.title} - ${currentSongInfo?.artist} \n${currentSongInfo?.video_title} \n${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                  window.open(
                    `https://x.com/intent/tweet?text=${encodeURIComponent(
                      text
                    )}`
                  );
                }}
              >
                <FaX className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-white dark:bg-gray-800 dark:text-white">
          <Button
            className="bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm"
            onClick={() => setOpenShareModal(false)}
          >
            閉じる
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
