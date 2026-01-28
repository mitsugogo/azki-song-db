import React, { ChangeEvent } from "react";
import { FaPlay, FaPause, FaStepForward } from "react-icons/fa";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { Song } from "../types/song";

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
  isNarrowScreen: boolean;
  showVolumeSlider: boolean;
  onVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  isNarrowScreen,
  showVolumeSlider,
  onVolumeChange,
}: Props) {
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

          <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2 text-[13px] font-medium tabular-nums text-white/90 select-none leading-tight">
            <span>{formattedCurrentTime}</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-white/50">/</span>
              <span className="text-white/70">{formattedDuration}</span>
            </div>
          </div>

          <div
            className="min-w-0 flex-1 border-l border-white/10 pl-3"
            onClick={onOpenShareModal}
          >
            <div className="truncate text-sm font-medium text-white select-none">
              {displaySongTitle}
            </div>
            <div className="truncate text-xs text-white/60 select-none">
              {displaySongArtist}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onVolumeIconClick}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={
              isNarrowScreen
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
          {(!isNarrowScreen || showVolumeSlider) && (
            <input
              type="range"
              min={0}
              max={100}
              value={tempVolumeValue}
              onInput={onVolumeChange}
              onChange={onVolumeChange}
              disabled={disabled}
              className="youtube-volume-bar w-24"
              style={{
                background: `linear-gradient(to right, #fff 0%, #fff ${tempVolumeValue}%, rgba(255,255,255,0.3) ${tempVolumeValue}%, rgba(255,255,255,0.3) 100%)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
