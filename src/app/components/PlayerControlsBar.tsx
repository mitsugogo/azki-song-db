import React, { ChangeEvent, useState } from "react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaPlus,
  FaStar,
  FaRegStar,
  FaShare,
} from "react-icons/fa";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { BiHide } from "react-icons/bi";
import { Song } from "../types/song";
import { Menu, MenuItem, ScrollArea, Switch, Tooltip } from "@mantine/core";
import { useClickOutside, useMediaQuery } from "@mantine/hooks";
import usePlaylists, { Playlist } from "../hook/usePlaylists";
import useFavorites from "../hook/useFavorites";
import {
  MdOutlineCreateNewFolder,
  MdPlaylistAdd,
  MdPlaylistAddCheck,
} from "react-icons/md";
import CreatePlaylistModal from "./CreatePlaylistModal";

type Hovered = {
  song: Song;
  x: number;
  containerWidth: number;
} | null;

type CumulativeItem = {
  song: Song;
  cumulativeStart: number;
  cumulativeEnd: number;
  actualStart: number;
  actualEnd: number;
  duration: number;
};

type Props = {
  // progress related
  songsInVideo: Song[];
  allSongsHaveEnd: boolean;
  songCumulativeMap: CumulativeItem[];
  totalSongsDuration: number;
  videoDuration: number;
  videoStartTime: number;
  displayDuration: number;
  tempSeekValue: number;
  setTempSeekValue: (v: number) => void;
  handleSeekChange: (e: ChangeEvent<HTMLInputElement>) => void;
  hoveredChapter: Hovered;
  setHoveredChapter: (h: Hovered) => void;

  // controls
  isPlaying: boolean;
  onTogglePlay: () => void;
  disabled: boolean;
  isMuted?: boolean;
  onNext?: () => void;
  nextDisabled?: boolean;
  formattedCurrentTime: string;
  formattedDuration: string;
  displaySongTitle: string;
  displaySongArtist: string;
  onOpenShareModal: () => void;
  volumeValue: number;
  tempVolumeValue: number;
  onVolumeIconClick: () => void;
  isTouchDevice: boolean;
  showVolumeSlider: boolean;
  onVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;

  // player settings
  currentSong: Song | null;
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
};

export default function PlayerControlsBar({
  songsInVideo,
  allSongsHaveEnd,
  songCumulativeMap,
  totalSongsDuration,
  videoDuration,
  videoStartTime,
  displayDuration,
  tempSeekValue,
  setTempSeekValue,
  handleSeekChange,
  onSeekStart,
  onSeekEnd,
  hoveredChapter,
  setHoveredChapter,
  isPlaying,
  onTogglePlay,
  disabled,
  isMuted,
  onNext,
  nextDisabled,
  formattedCurrentTime,
  formattedDuration,
  displaySongTitle,
  displaySongArtist,
  onOpenShareModal,
  volumeValue,
  tempVolumeValue,
  onVolumeIconClick,
  isTouchDevice,
  showVolumeSlider,
  onVolumeChange,
  currentSong,
  hideFutureSongs,
  setHideFutureSongs,
}: Props) {
  // Mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsMenuOpen(false));

  // Playlist menu state
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const playlistRef = useClickOutside(() => setShowPlaylistMenu(false));

  // Create playlist modal
  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);

  // Playlists
  const {
    playlists,
    addToPlaylist,
    isInPlaylist,
    removeFromPlaylist,
    isInAnyPlaylist,
  } = usePlaylists();

  // Favorites
  const { isInFavorites, toggleFavorite } = useFavorites();

  const addOrRemovePlaylist = (playlist: Playlist) => {
    if (currentSong && isInPlaylist(playlist, currentSong)) {
      removeFromPlaylist(playlist, currentSong);
    } else if (currentSong) {
      addToPlaylist(playlist, currentSong);
    }
  };

  // Check if it's PC screen (md breakpoint)
  const isPcScreen = useMediaQuery("(min-width: 768px)");

  // Volume slider hover state for PC
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  // seek start/end are handled by parent via optional handlers
  return (
    <div className="flex w-full flex-col rounded-b-lg bg-linear-to-b from-black/95 to-black/98 px-0 pb-3 text-white shadow-2xl backdrop-blur-sm">
      {/* Progress Bar */}
      <div className="group relative mb-2 flex items-center gap-2 px-1 -mt-4">
        <div className="relative flex-1">
          {/* Chapter markers */}
          {songsInVideo.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex mt-4 z-50">
              {allSongsHaveEnd
                ? // 空白を除いた連続表示
                  songCumulativeMap.map((item, idx) => {
                    const startPosition =
                      totalSongsDuration > 0
                        ? (item.cumulativeStart / totalSongsDuration) * 100
                        : 0;
                    const width =
                      totalSongsDuration > 0
                        ? (item.duration / totalSongsDuration) * 100
                        : 0;
                    const isHovered =
                      hoveredChapter?.song?.title === item.song.title &&
                      hoveredChapter?.song?.start === item.song.start;

                    return (
                      <div key={`chapter-${idx}`}>
                        {isHovered && (
                          <div
                            className="absolute h-1.5 bg-white/30"
                            style={{
                              left: `${startPosition}%`,
                              width: `${width}%`,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                        )}
                        <div
                          className="absolute h-1.5 w-0.5 bg-white/60"
                          style={{
                            left: `${startPosition}%`,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        />
                      </div>
                    );
                  })
                : // 絶対時間表示
                  songsInVideo.map((song, idx) => {
                    const songStart = Number(song.start);
                    const nextSong = songsInVideo[idx + 1];
                    const songEnd =
                      song.end && Number(song.end) > 0
                        ? Number(song.end)
                        : nextSong
                          ? Number(nextSong.start)
                          : videoDuration;
                    const seekBarRange = videoDuration - videoStartTime;
                    const startPosition =
                      seekBarRange > 0
                        ? ((songStart - videoStartTime) / seekBarRange) * 100
                        : 0;
                    const endPosition =
                      seekBarRange > 0
                        ? ((songEnd - videoStartTime) / seekBarRange) * 100
                        : 0;
                    const width = endPosition - startPosition;
                    const isHovered =
                      hoveredChapter?.song?.title === song.title &&
                      hoveredChapter?.song?.start === song.start;

                    return (
                      <div key={`chapter-${idx}`}>
                        {isHovered && (
                          <div
                            className="absolute h-1.5 bg-white/30"
                            style={{
                              left: `${startPosition}%`,
                              width: `${width}%`,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                        )}
                        <div
                          className="absolute h-1.5 w-0.5 bg-white/60"
                          style={{
                            left: `${startPosition}%`,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        />
                      </div>
                    );
                  })}
            </div>
          )}

          <input
            type="range"
            min={0}
            max={allSongsHaveEnd ? totalSongsDuration : displayDuration}
            value={tempSeekValue}
            step="0.1"
            onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTempSeekValue(Number(e.target.value))
            }
            onTouchStart={() => onSeekStart?.()}
            onMouseDown={() => onSeekStart?.()}
            onMouseUp={() => onSeekEnd?.()}
            onTouchEnd={() => onSeekEnd?.()}
            onChange={handleSeekChange}
            onMouseMove={(e: React.MouseEvent<HTMLInputElement>) => {
              if (songsInVideo.length === 0) return;

              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = (x / rect.width) * 100;

              let foundSongData: Hovered = null;

              if (allSongsHaveEnd) {
                const hoveredCumulativeTime =
                  (totalSongsDuration * percentage) / 100;
                const foundItem = songCumulativeMap.find((item) => {
                  return (
                    hoveredCumulativeTime >= item.cumulativeStart &&
                    hoveredCumulativeTime <= item.cumulativeEnd
                  );
                });

                if (foundItem) {
                  const startPct =
                    totalSongsDuration > 0
                      ? foundItem.cumulativeStart / totalSongsDuration
                      : 0;
                  const widthPct =
                    totalSongsDuration > 0
                      ? foundItem.duration / totalSongsDuration
                      : 0;
                  const leftPx = startPct * rect.width;
                  const widthPx = widthPct * rect.width;
                  const centerPx = leftPx + widthPx / 2;

                  foundSongData = {
                    song: foundItem.song,
                    x: centerPx,
                    containerWidth: rect.width,
                  };
                }
              } else {
                const seekBarRange = videoDuration - videoStartTime;
                const hoverTime =
                  videoStartTime + (seekBarRange * percentage) / 100;

                const foundSong = songsInVideo
                  .slice()
                  .reverse()
                  .find((s) => {
                    const start = Number(s.start);
                    const end = s.end ? Number(s.end) : Infinity;
                    return hoverTime >= start && hoverTime < end;
                  });

                if (foundSong) {
                  const start = Number(foundSong.start);
                  const nextSong = songsInVideo.find(
                    (s) => Number(s.start) > start,
                  );
                  const songEnd =
                    foundSong.end && Number(foundSong.end) > 0
                      ? Number(foundSong.end)
                      : nextSong
                        ? Number(nextSong.start)
                        : videoDuration;

                  const seekBarRange = videoDuration - videoStartTime;
                  const startPosPx =
                    seekBarRange > 0
                      ? ((start - videoStartTime) / seekBarRange) * rect.width
                      : 0;
                  const endPosPx =
                    seekBarRange > 0
                      ? ((songEnd - videoStartTime) / seekBarRange) * rect.width
                      : 0;
                  const centerPx = (startPosPx + endPosPx) / 2;

                  foundSongData = {
                    song: foundSong,
                    x: centerPx,
                    containerWidth: rect.width,
                  };
                }
              }

              setHoveredChapter(foundSongData);
            }}
            onMouseLeave={() => setHoveredChapter(null)}
            disabled={videoDuration <= 0 || disabled}
            className="youtube-progress-bar relative z-20 w-full"
            style={{
              background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${
                displayDuration > 0
                  ? (tempSeekValue / displayDuration) * 100
                  : 0
              }%, rgba(255,255,255,0.3) ${
                displayDuration > 0
                  ? (tempSeekValue / displayDuration) * 100
                  : 0
              }%, rgba(255,255,255,0.3) 100%)`,
            }}
          />

          {/* Chapter Tooltip */}
          {hoveredChapter && (
            <div
              className="pointer-events-none absolute z-50 max-w-xs rounded-lg bg-black/95 px-3 py-2 text-white shadow-2xl backdrop-blur-sm"
              style={{
                left: `${hoveredChapter.x}px`,
                bottom: `calc(100% + 8px)`,
                transform:
                  hoveredChapter.x < 160
                    ? "translateX(0)"
                    : hoveredChapter.x > hoveredChapter.containerWidth - 160
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
              }}
            >
              <div className="text-sm font-semibold">
                {hoveredChapter.song.title}
              </div>
              <div className="text-xs text-white/70">
                {hoveredChapter.song.artist}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 px-2 lg:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={disabled}
            className="group flex h-7 w-7 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? (
              <FaPause className="text-xl text-white" />
            ) : (
              <FaPlay className="ml-0.5 text-xl text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="group flex h-7 w-7 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || nextDisabled}
            aria-label="次の曲へ"
          >
            <FaStepForward className="text-xl text-white" />
          </button>

          <div
            className="flex items-center gap-0"
            onMouseEnter={() => !isTouchDevice && setIsVolumeHovered(true)}
            onMouseLeave={() => !isTouchDevice && setIsVolumeHovered(false)}
          >
            <button
              type="button"
              onClick={onVolumeIconClick}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={
                isTouchDevice
                  ? "音量調整"
                  : isMuted || volumeValue === 0
                    ? "ミュート解除"
                    : "ミュート"
              }
            >
              {isMuted || volumeValue === 0 ? (
                <LuVolumeX className="text-xl text-white" />
              ) : (
                <LuVolume2 className="text-xl text-white" />
              )}
            </button>
            <div
              className="flex items-center transition-all duration-300 ease-in-out py-1"
              style={{
                width: isTouchDevice
                  ? showVolumeSlider
                    ? "6rem"
                    : "0"
                  : isVolumeHovered || showVolumeSlider
                    ? "6rem"
                    : "0",
                opacity: isTouchDevice
                  ? showVolumeSlider
                    ? 1
                    : 0
                  : isVolumeHovered || showVolumeSlider
                    ? 1
                    : 0,
              }}
            >
              <div className="overflow-visible w-full flex items-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tempVolumeValue}
                  onInput={onVolumeChange}
                  onChange={onVolumeChange}
                  disabled={disabled}
                  className="youtube-volume-bar w-24 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${tempVolumeValue}%, rgba(255,255,255,0.3) ${tempVolumeValue}%, rgba(255,255,255,0.3) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2 text-[13px] font-medium tabular-nums text-white/90 select-none leading-tight">
            <span>{formattedCurrentTime}</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-white/50">/</span>
              <span className="text-white/70">{formattedDuration}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 border-l border-white/10 pl-3">
            <div className="line-clamp-1 text-sm font-medium text-white select-none">
              {displaySongTitle}
            </div>
            <div className="line-clamp-1 text-xs text-white/60 select-none">
              {displaySongArtist}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* PC: Show 4 buttons */}
          {isPcScreen && currentSong && (
            <>
              {/* Favorite button */}
              <Tooltip
                label={
                  isInFavorites(currentSong)
                    ? "お気に入りから削除"
                    : "お気に入りに追加"
                }
              >
                <button
                  type="button"
                  onClick={() => toggleFavorite(currentSong)}
                  className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 text-white"
                  aria-label={
                    isInFavorites(currentSong)
                      ? "お気に入りから削除"
                      : "お気に入りに追加"
                  }
                >
                  {isInFavorites(currentSong) ? (
                    <FaStar className="text-base text-yellow-400 dark:text-yellow-500" />
                  ) : (
                    <FaRegStar className="text-base" />
                  )}
                </button>
              </Tooltip>

              {/* Playlist button */}
              <div className="relative" ref={playlistRef}>
                <Menu width={300} withArrow opened={showPlaylistMenu}>
                  <Menu.Target>
                    <Tooltip
                      label={
                        isInAnyPlaylist(currentSong)
                          ? "プレイリスト追加済み"
                          : "プレイリストに追加"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                        className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 text-white"
                        aria-label={
                          isInAnyPlaylist(currentSong)
                            ? "プレイリスト追加済み"
                            : "プレイリストに追加"
                        }
                      >
                        {isInAnyPlaylist(currentSong) ? (
                          <FaStar className="text-base" />
                        ) : (
                          <FaPlus className="text-base" />
                        )}
                      </button>
                    </Tooltip>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>プレイリスト</Menu.Label>

                    {playlists.length === 0 && (
                      <div className="ml-3 mb-3">
                        <span className="text-sm text-light-gray-300 dark:text-gray-300">
                          プレイリストはありません
                        </span>
                      </div>
                    )}

                    <ScrollArea mah={200}>
                      {playlists.map((playlist, index) => (
                        <MenuItem
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            addOrRemovePlaylist(playlist);

                            if (playlists.length === 1) {
                              setShowPlaylistMenu(false);
                            }
                          }}
                          leftSection={
                            isInPlaylist(playlist, currentSong) ? (
                              <MdPlaylistAddCheck className="mr-2 inline w-5 h-5" />
                            ) : (
                              <MdPlaylistAdd className="mr-2 inline w-5 h-5" />
                            )
                          }
                          component="div"
                          bg={isInPlaylist(playlist, currentSong) ? "blue" : ""}
                          color={
                            isInPlaylist(playlist, currentSong) ? "white" : ""
                          }
                          className="mb-0.5"
                        >
                          {playlist.name}
                        </MenuItem>
                      ))}
                    </ScrollArea>

                    <Menu.Divider />
                    <MenuItem
                      onClick={() => {
                        setShowPlaylistMenu(false);
                        setOpenCreatePlaylistModal(true);
                      }}
                      name="新しいプレイリストを作成"
                    >
                      <MdOutlineCreateNewFolder className="mr-2 inline w-5 h-5" />
                      新しいプレイリストを作成
                    </MenuItem>
                  </Menu.Dropdown>
                </Menu>
              </div>

              {/* Share button */}
              <Tooltip label="現在の楽曲をシェア">
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 text-white"
                  aria-label="現在の楽曲をシェア"
                >
                  <FaShare className="text-base" />
                </button>
              </Tooltip>

              {/* Hide future songs button */}
              <Tooltip label="セトリネタバレ防止モード">
                <button
                  type="button"
                  onClick={() => setHideFutureSongs(!hideFutureSongs)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 ${
                    hideFutureSongs ? "text-pink-400" : "text-white/60"
                  }`}
                  aria-label="セトリネタバレ防止モード"
                >
                  <BiHide className="text-xl" />
                </button>
              </Tooltip>
            </>
          )}

          {/* Mobile: Show menu button */}
          {!isPcScreen && currentSong && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 text-white"
                aria-label="メニュー"
              >
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 3"
                >
                  <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute bottom-12 right-0 z-50 bg-white divide-y rounded-lg shadow-lg w-72 divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                  <ul className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-100">
                    <li>
                      <div className="flex p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                        <Switch
                          checked={hideFutureSongs}
                          onChange={(event) =>
                            setHideFutureSongs(event.target.checked)
                          }
                          color="pink"
                          label="セトリネタバレ防止モード"
                          className="cursor-pointer w-full"
                        />
                      </div>
                    </li>
                  </ul>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        toggleFavorite(currentSong);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-100"
                    >
                      {isInFavorites(currentSong) ? (
                        <FaStar className="inline mr-2 text-yellow-400" />
                      ) : (
                        <FaRegStar className="inline mr-2" />
                      )}
                      {isInFavorites(currentSong)
                        ? "お気に入りから削除"
                        : "お気に入りに追加"}
                    </button>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onOpenShareModal();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-100"
                    >
                      <FaShare className="inline mr-2" />
                      現在の楽曲をシェア
                    </button>
                  </div>
                  <div className="py-2">
                    <Menu width={260} withArrow opened={showPlaylistMenu}>
                      <Menu.Target>
                        <button
                          onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-100"
                        >
                          {isInAnyPlaylist(currentSong) ? (
                            <FaStar className="inline mr-2" />
                          ) : (
                            <FaPlus className="inline mr-2" />
                          )}
                          {isInAnyPlaylist(currentSong)
                            ? "プレイリスト追加済み"
                            : "プレイリストに追加"}
                        </button>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Label>プレイリスト</Menu.Label>

                        {playlists.length === 0 && (
                          <div className="ml-3 mb-3">
                            <span className="text-sm text-gray-300">
                              プレイリストはありません
                            </span>
                          </div>
                        )}

                        <ScrollArea mah={200}>
                          {playlists.map((playlist, index) => (
                            <MenuItem
                              key={index}
                              onClick={(e) => {
                                e.preventDefault();
                                addOrRemovePlaylist(playlist);
                                if (playlists.length === 1) {
                                  setShowPlaylistMenu(false);
                                  setIsMenuOpen(false);
                                }
                              }}
                              leftSection={
                                isInPlaylist(playlist, currentSong) ? (
                                  <MdPlaylistAddCheck className="mr-2 inline w-5 h-5" />
                                ) : (
                                  <MdPlaylistAdd className="mr-2 inline w-5 h-5" />
                                )
                              }
                              component="div"
                              bg={
                                isInPlaylist(playlist, currentSong)
                                  ? "blue"
                                  : ""
                              }
                              color={
                                isInPlaylist(playlist, currentSong)
                                  ? "white"
                                  : ""
                              }
                              className="mb-0.5"
                            >
                              {playlist.name}
                            </MenuItem>
                          ))}
                        </ScrollArea>

                        <Menu.Divider />
                        <MenuItem
                          onClick={() => {
                            setShowPlaylistMenu(false);
                            setIsMenuOpen(false);
                            setOpenCreatePlaylistModal(true);
                          }}
                        >
                          <MdOutlineCreateNewFolder className="mr-2 inline w-5 h-5" />
                          新しいプレイリストを作成
                        </MenuItem>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
      />
    </div>
  );
}
