import React, {
  ChangeEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  Menu,
  MenuItem,
  ScrollArea,
  Slider,
  Switch,
  Tooltip,
} from "@mantine/core";
import { useClickOutside, useMediaQuery } from "@mantine/hooks";
import usePlaylists, { Playlist } from "../hook/usePlaylists";
import useFavorites from "../hook/useFavorites";
import {
  MdOutlineCreateNewFolder,
  MdPlaylistAdd,
  MdPlaylistAddCheck,
} from "react-icons/md";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { FaGear } from "react-icons/fa6";

type Hovered = {
  song: Song;
  x: number;
  containerWidth: number;
} | null;

type CumulativeItem = {
  song: Song;
  /**
   * 自前シークバー上の曲の開始位置（動画開始からの累積時間）
   */
  cumulativeStart: number;
  /**
   * 自前シークバー上の曲の終了位置（動画開始からの累積時間）。曲に終了位置がない場合は次の曲の開始位置、次の曲もない場合は動画の終了位置とする
   */
  cumulativeEnd: number;

  /**
   * YouTubeの実際の動画内での曲の開始位置（動画開始からの時間）
   */
  actualStart: number;
  /**
   * YouTubeの実際の動画内での曲の終了位置（動画開始からの時間）。曲に終了位置がない場合は次の曲の開始位置、次の曲もない場合は動画の終了位置とする
   */
  actualEnd: number;
  /**
   * 曲の長さ
   */
  duration: number;

  /**
   * スライダー表示上の開始/終了位置（display timeline 単位）
   * - allSongsHaveEnd のとき: cumulative 単位（0..totalSongsDuration）
   * - それ以外: video 時間を videoStartTime 基準にした値（0..displayDuration）
   */
  displayStart?: number;
  displayEnd?: number;
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
  handleSeekChange: (value: number) => void;
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
  onVolumeChange: (
    e: ChangeEvent<HTMLInputElement> | SyntheticEvent<HTMLInputElement>,
  ) => void;
  onSeekStart?: () => void;
  onSeekEnd?: (value?: number) => void;

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

  // PC menu state (右端に表示するメニュー)
  const [isPcMenuOpen, setIsPcMenuOpen] = useState(false);
  const pcMenuRef = useClickOutside(() => setIsPcMenuOpen(false));

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

  // Check if it's PC screen (lg breakpoint)
  const isPcScreen = useMediaQuery("(min-width: 1024px)");

  // Volume slider hover state for PC
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  const sliderMax = useMemo(() => {
    return allSongsHaveEnd ? totalSongsDuration : displayDuration;
  }, [allSongsHaveEnd, totalSongsDuration, displayDuration]);

  const sliderRootRef = useRef<HTMLDivElement | null>(null);
  const [trackInsets, setTrackInsets] = useState({ left: 0, right: 0 });

  // チャプター計算
  // `displayStart`/`displayEnd` は常に「スライダー上の表示単位」で統一する
  // - allSongsHaveEnd のときは cumulative 単位 (0..totalSongsDuration)
  // - それ以外は実時間を videoStartTime 基準にした値 (0..displayDuration)
  const chapters: CumulativeItem[] = useMemo(() => {
    if (allSongsHaveEnd) {
      return songCumulativeMap.map((item) => ({
        ...item,
        displayStart: item.cumulativeStart,
        displayEnd: item.cumulativeEnd,
      }));
    }
    return songsInVideo.map((song, idx) => {
      const start = Number(song.start);
      const nextSong = songsInVideo[idx + 1];
      const end =
        song.end && Number(song.end) > 0
          ? Number(song.end)
          : nextSong
            ? Number(nextSong.start)
            : videoDuration;
      return {
        song,
        cumulativeStart: start,
        cumulativeEnd: end,
        actualStart: start,
        actualEnd: end,
        duration: end - start,
        displayStart: start - videoStartTime,
        displayEnd: end - videoStartTime,
      };
    });
  }, [allSongsHaveEnd, songCumulativeMap, songsInVideo]);

  useEffect(() => {
    const root = sliderRootRef.current;
    if (!root) return;

    const update = () => {
      const track = root.querySelector(
        ".youtube-progress-track",
      ) as HTMLElement | null;
      if (!track) return;
      const rootRect = root.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();

      const left = Math.max(0, trackRect.left - rootRect.left);
      const right = Math.max(0, rootRect.right - trackRect.right);
      setTrackInsets((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right },
      );

      // Calculate visualTrackLeft (track left corrected by half thumb) and update
      // Slider marks so they line up exactly with the visual red bar.
      const thumbEl = root.querySelector(
        ".youtube-progress-thumb",
      ) as HTMLElement | null;
      const halfThumb = thumbEl ? thumbEl.offsetWidth / 2 : 0;
      const trackLeftRelToRoot = Math.max(0, trackRect.left - rootRect.left);
      const visualTrackLeft = Math.max(0, trackLeftRelToRoot - halfThumb);
      const trackWidthPx = trackRect.width;

      // Position Mantine-generated marks (override their left to pixel-precise values)
      try {
        const markEls = Array.from(
          root.querySelectorAll(".youtube-progress-mark"),
        ) as HTMLElement[];
        markEls.forEach((el, idx) => {
          // NOTE: Slider に渡している `marks` は `chapters.filter((_, idx) => idx !== 0)`
          // で先頭要素を除外しているため、DOM 内の mark 要素のインデックスは
          // `chapters` の (idx + 1) に対応します。
          const ch = chapters[idx + 1];
          if (!ch) return;
          const ds = ch.displayStart ?? 0;
          const frac = sliderMax > 0 ? ds / sliderMax : 0;
          const leftPx = visualTrackLeft + frac * trackWidthPx;
          el.style.left = `${Math.round(leftPx)}px`;
          // ensure no additional transform is applied (we set exact px left)
          el.style.transform = "none";
        });
      } catch (_) {
        // ignore
      }

      // Mirror Mantine's internal bar offset into the root so CSS can read it
      try {
        const bar = root.querySelector(
          ".youtube-progress-bar-fill",
        ) as HTMLElement | null;
        let barOffsetPx = 0;

        if (bar) {
          const val = window
            .getComputedStyle(bar)
            .getPropertyValue("--slider-bar-offset")
            .trim();
          const m = val.match(/(-?\d+\.?\d*)px/);
          if (m) barOffsetPx = Number(m[1]);
        }

        // fallback to thumb half width (positive) so CSS transform moves marks right
        if (!barOffsetPx && halfThumb) barOffsetPx = halfThumb;

        root.style.setProperty("--slider-bar-offset", `${barOffsetPx}px`);
      } catch (_) {
        // ignore
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [sliderMax]);

  return (
    <div
      id="player-controls-bar"
      className="flex w-full flex-col rounded-b-lg bg-linear-to-b from-black/95 to-black/98 px-0 pb-3 text-white shadow-md backdrop-blur-sm"
    >
      {/* Progress Bar */}
      <div className="group relative mb-2 flex items-center gap-2 px-1 -mt-2">
        <div className="relative flex-1">
          {/* Chapter markers */}
          {songsInVideo.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex mt-4 z-50">
              {chapters.map((item, idx) => {
                const ds = item.displayStart ?? 0;
                const de = item.displayEnd ?? ds + item.duration;
                const isHovered =
                  hoveredChapter?.song?.title === item.song.title &&
                  hoveredChapter?.song?.start === item.song.start;

                // トラック DOM を基準に px 計算（tooltip と同じ座標系に揃える）
                const trackEl = sliderRootRef.current?.querySelector(
                  ".youtube-progress-track",
                ) as HTMLElement | null;
                const trackRect = trackEl?.getBoundingClientRect();
                const parentRect =
                  sliderRootRef.current?.parentElement?.getBoundingClientRect();

                const trackLeftRelToParent =
                  trackRect && parentRect
                    ? trackRect.left - parentRect.left
                    : trackInsets.left;
                const trackWidth =
                  trackRect?.width ??
                  Math.max(
                    0,
                    sliderRootRef.current?.getBoundingClientRect().width ?? 0,
                  );

                // まず Mantine が使っている CSS 変数 (--slider-bar-offset) を確認して
                // bar の実際の開始オフセットが root にセットされていればそれを反映する。
                // これで .youtube-progress-mark の margin-left と同じ基準に揃える。
                const thumbEl = sliderRootRef.current?.querySelector(
                  ".youtube-progress-thumb",
                ) as HTMLElement | null;
                const halfThumb = thumbEl ? thumbEl.offsetWidth / 2 : 0;

                let cssBarOffset = 0;
                try {
                  const val =
                    sliderRootRef.current?.style.getPropertyValue(
                      "--slider-bar-offset",
                    ) ?? "";
                  const m = val.match(/(-?\d+\.?\d*)px/);
                  if (m) cssBarOffset = Number(m[1]);
                } catch (_) {
                  cssBarOffset = 0;
                }

                // mark と同じ基準で track の左端を算出する（halfThumb 補正 + CSS bar offset）
                const visualTrackLeft = Math.max(
                  0,
                  trackLeftRelToParent - halfThumb + cssBarOffset,
                );

                const startPx =
                  sliderMax > 0 && trackWidth > 0
                    ? visualTrackLeft + (ds / sliderMax) * trackWidth
                    : undefined;
                const widthPx =
                  sliderMax > 0 && trackWidth > 0
                    ? ((de - ds) / sliderMax) * trackWidth
                    : undefined;

                const startPct = sliderMax > 0 ? (ds / sliderMax) * 100 : 0;
                const widthPct =
                  sliderMax > 0 ? ((de - ds) / sliderMax) * 100 : 0;

                return (
                  <div key={`chapter-${idx}`}>
                    {isHovered && (
                      <div
                        className="absolute h-1.5 bg-white/30"
                        style={
                          startPx != null && widthPx != null
                            ? {
                                left: `${startPx}px`,
                                width: `${widthPx}px`,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }
                            : {
                                left: `${startPct}%`,
                                width: `${widthPct}%`,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div
            ref={sliderRootRef}
            onPointerDownCapture={() => {
              if (disabled) return;
              try {
                document.documentElement.setAttribute(
                  "data-seek-dragging",
                  "1",
                );
              } catch (_) {}
              onSeekStart?.();
            }}
            onPointerUpCapture={() => {
              if (disabled) return;
              try {
                document.documentElement.removeAttribute("data-seek-dragging");
              } catch (_) {}
              onSeekEnd?.(tempSeekValue);
            }}
            onPointerCancelCapture={() => {
              if (disabled) return;
              try {
                document.documentElement.removeAttribute("data-seek-dragging");
              } catch (_) {}
              onSeekEnd?.(tempSeekValue);
            }}
          >
            <Slider
              min={0}
              max={sliderMax}
              value={tempSeekValue}
              color="red"
              step={0.1}
              size="md"
              label={(value: number) => {
                // 00:00形式にフォーマット
                const hours = Math.floor(value / 3600);
                const minutes = Math.floor((value % 3600) / 60);
                const seconds = Math.floor(value % 60);
                if (hours > 0) {
                  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`;
                }
                return `${minutes.toString().padStart(2, "0")}:${seconds
                  .toString()
                  .padStart(2, "0")}`;
              }}
              marks={chapters
                .filter((it, idx) => idx !== 0)
                .map((it: CumulativeItem) => ({
                  value: it.displayStart ?? 0,
                }))}
              onChange={(value) => {
                if (Array.isArray(value)) return;
                handleSeekChange(value);
              }}
              onMouseMove={(e) => {
                if (songsInVideo.length === 0) return;

                // トラック要素を基準にマウス位置を算出（値→px のマッピングと一致させる）
                const rootRect =
                  sliderRootRef.current?.getBoundingClientRect() ??
                  e.currentTarget.getBoundingClientRect();
                const trackEl = sliderRootRef.current?.querySelector(
                  ".youtube-progress-track",
                ) as HTMLElement | null;
                const trackRect = trackEl?.getBoundingClientRect() ?? rootRect;
                // Use the actual track width (do NOT subtract trackInsets here)
                const trackWidth = Math.max(0, trackRect.width);

                const xRel = Math.min(
                  trackWidth,
                  Math.max(0, e.clientX - trackRect.left),
                );
                const percentage =
                  trackWidth > 0 ? (xRel / trackWidth) * 100 : 0;

                let foundSongData: Hovered = null;

                // 表示単位（sliderMax）に基づく割合 -> 親幅(px) に変換して tooltip/x を統一
                if (sliderMax > 0) {
                  const displayValue = (sliderMax * percentage) / 100;
                  const foundItem = chapters.find((item) => {
                    const ds = item.displayStart ?? 0;
                    const de = item.displayEnd ?? ds + item.duration;
                    return displayValue >= ds && displayValue <= de;
                  });

                  if (foundItem) {
                    const ds = foundItem.displayStart ?? 0;
                    const de = foundItem.displayEnd ?? ds + foundItem.duration;

                    // トラック要素を基準に center を px で計算して tooltip/x を合わせる
                    const trackEl = sliderRootRef.current?.querySelector(
                      ".youtube-progress-track",
                    ) as HTMLElement | null;
                    const trackRect = trackEl?.getBoundingClientRect();
                    const parentRect =
                      sliderRootRef.current?.parentElement?.getBoundingClientRect() ??
                      e.currentTarget.getBoundingClientRect();

                    const trackLeftRelToParent =
                      trackRect && parentRect
                        ? trackRect.left - parentRect.left
                        : trackInsets.left;
                    const trackW =
                      trackRect?.width ??
                      Math.max(
                        0,
                        sliderRootRef.current?.getBoundingClientRect().width ??
                          0,
                      );

                    const thumbEl = sliderRootRef.current?.querySelector(
                      ".youtube-progress-thumb",
                    ) as HTMLElement | null;
                    const halfThumb = thumbEl ? thumbEl.offsetWidth / 2 : 0;

                    let cssBarOffset = 0;
                    try {
                      const val =
                        sliderRootRef.current?.style.getPropertyValue(
                          "--slider-bar-offset",
                        ) ?? "";
                      const m = val.match(/(-?\d+\.?\d*)px/);
                      if (m) cssBarOffset = Number(m[1]);
                    } catch (_) {
                      cssBarOffset = 0;
                    }

                    // mark と同じ基準で track の左端を算出する（halfThumb 補正 + CSS bar offset）
                    const visualTrackLeft = Math.max(
                      0,
                      trackLeftRelToParent - halfThumb + cssBarOffset,
                    );

                    const centerPxRelativeToParent =
                      visualTrackLeft +
                      ((ds + (de - ds) / 2) / sliderMax) * trackW;

                    foundSongData = {
                      song: foundItem.song,
                      x: centerPxRelativeToParent,
                      containerWidth: parentRect.width,
                    };
                  }
                }

                setHoveredChapter(foundSongData);
              }}
              onMouseLeave={() => setHoveredChapter(null)}
              disabled={sliderMax <= 0 || disabled}
              classNames={{
                root: "youtube-progress-bar",
                track: "youtube-progress-track",
                bar: "youtube-progress-bar-fill",
                thumb: "youtube-progress-thumb",
                mark: "youtube-progress-mark",
              }}
              styles={{
                track: { backgroundColor: "rgba(255,255,255,0.3)" },
                bar: { backgroundColor: "#ff0000" },
              }}
              data-seek-slider
            />
          </div>

          {/* Chapter Tooltip */}
          {hoveredChapter && (
            <div
              id="youtube-progress-bar-chapter-tooltip"
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
              <div className="text-sm font-semibold whitespace-nowrap">
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

          <div className="flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-2 text-[13px] font-medium tabular-nums text-white/90 select-none leading-tight">
            <span>{formattedCurrentTime}</span>
            <div className="flex items-end lg:items-center gap-1 lg:gap-2">
              <span className="text-white/50">/</span>
              <span className="text-white/70">{formattedDuration}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 border-l border-white/10 pl-3">
            <div
              className="line-clamp-1 text-sm font-medium text-white select-none"
              aria-label="曲名"
            >
              {displaySongTitle}
            </div>
            <div
              className="line-clamp-1 text-xs text-white/60 select-none"
              aria-label="アーティスト"
            >
              {displaySongArtist}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* PC */}
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

              {/* PC 設定ボタン */}
              <Tooltip label="設定">
                <div className="relative" ref={pcMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsPcMenuOpen(!isPcMenuOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 text-white"
                    aria-label="設定"
                  >
                    <FaGear className="text-base" />
                  </button>

                  {isPcMenuOpen && (
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
                        <Menu
                          width={260}
                          withArrow
                          opened={showPlaylistMenu}
                          withinPortal={false}
                        >
                          <Menu.Target>
                            <button
                              onClick={() =>
                                setShowPlaylistMenu(!showPlaylistMenu)
                              }
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
                                      setIsPcMenuOpen(false);
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
                                setIsPcMenuOpen(false);
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
              </Tooltip>
            </>
          )}

          {/* Mobile */}
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
                    <Menu
                      width={260}
                      withArrow
                      opened={showPlaylistMenu}
                      withinPortal={false}
                    >
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
