"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import type { Song } from "../types/song";

const PLAYBACK_TIMEOUT_MS = 15_000;
const YOUTUBE_PLAYER_STATE_UNSTARTED = -1;
const YOUTUBE_PLAYER_STATE_PLAYING = 1;
const YOUTUBE_PLAYER_STATE_PAUSED = 2;
const YOUTUBE_PLAYER_STATE_CUED = 5;
const PLAYBACK_RETRY_STATES = new Set([
  YOUTUBE_PLAYER_STATE_UNSTARTED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_CUED,
]);
const PAGE_BACKGROUND_MASK = {
  WebkitMaskImage:
    "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
  maskImage:
    "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
} as const;

// onReady の target は Promise ラッパーではなく、生の IFrame API プレイヤー。
export type HomeHeroPlayer = {
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
};

type HomeHeroBackgroundProps = {
  song: Song | null;
  onPlayerChange?: (player: HomeHeroPlayer | null) => void;
  onPlaybackSuccess?: (videoId: string) => void;
  onPlaybackFailure?: (videoId: string) => void;
  layout?: "page" | "frame";
};

export const HomeHeroBackground = memo(function HomeHeroBackground({
  song,
  ...props
}: HomeHeroBackgroundProps) {
  return song ? (
    <HomeHeroVideo key={song.video_id} song={song} {...props} />
  ) : null;
});

function HomeHeroVideo({
  song,
  onPlayerChange,
  onPlaybackSuccess,
  onPlaybackFailure,
  layout = "page",
}: HomeHeroBackgroundProps & { song: Song }) {
  const [isUnavailable, setUnavailable] = useState(false);
  const activeRef = useRef(false);
  const hasFailedRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const playbackRetryCountRef = useRef(0);
  const failPlayback = useCallback(() => {
    if (!activeRef.current || hasFailedRef.current) {
      return;
    }
    hasFailedRef.current = true;
    setUnavailable(true);
    onPlaybackFailure?.(song.video_id);
  }, [onPlaybackFailure, song.video_id]);
  const options = useMemo<YouTubeProps["opts"]>(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        mute: 1,
        playlist: song?.video_id,
        playsinline: 1,
        rel: 0,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [song?.video_id],
  );

  useEffect(() => {
    activeRef.current = true;

    const playbackTimeout = window.setTimeout(() => {
      if (!hasPlayedRef.current) {
        failPlayback();
      }
    }, PLAYBACK_TIMEOUT_MS);

    return () => {
      activeRef.current = false;
      window.clearTimeout(playbackTimeout);
    };
  }, [failPlayback]);

  useEffect(() => {
    return () => onPlayerChange?.(null);
  }, [song?.video_id, isUnavailable, onPlayerChange]);

  if (isUnavailable) {
    return null;
  }

  const handleReady = (event: YouTubeEvent) => {
    if (!activeRef.current || hasFailedRef.current) {
      return;
    }
    try {
      event.target.mute();
      event.target.playVideo();
      onPlayerChange?.(event.target as unknown as HomeHeroPlayer);
    } catch {
      failPlayback();
    }
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${layout === "frame" ? "unit-hero-video-container" : ""}`}
      style={layout === "page" ? PAGE_BACKGROUND_MASK : undefined}
      aria-hidden="true"
    >
      <YouTube
        videoId={song.video_id}
        opts={options}
        className={
          layout === "frame"
            ? "unit-hero-video-player"
            : "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-full min-w-[177.78dvh] -translate-x-1/2 -translate-y-1/2"
        }
        iframeClassName="h-full w-full"
        title=""
        onReady={handleReady}
        onError={failPlayback}
        onStateChange={(event) => {
          if (!activeRef.current || hasFailedRef.current) {
            return;
          }
          if (event.data === YOUTUBE_PLAYER_STATE_PLAYING) {
            if (!hasPlayedRef.current) {
              hasPlayedRef.current = true;
              onPlaybackSuccess?.(song.video_id);
            }
            return;
          }
          if (
            !hasPlayedRef.current &&
            playbackRetryCountRef.current < 3 &&
            PLAYBACK_RETRY_STATES.has(event.data)
          ) {
            playbackRetryCountRef.current += 1;
            try {
              event.target.mute();
              event.target.playVideo();
            } catch {
              failPlayback();
            }
          }
        }}
      />
    </div>
  );
}
