"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import type { Song } from "../types/song";

const PLAYBACK_TIMEOUT_MS = 15_000;
const YOUTUBE_PLAYER_STATE_PLAYING = 1;

type HomeHeroBackgroundProps = {
  song: Song | null;
};

export const HomeHeroBackground = memo(function HomeHeroBackground({
  song,
}: HomeHeroBackgroundProps) {
  const [isUnavailable, setUnavailable] = useState(false);
  const hasPlayedRef = useRef(false);
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
    hasPlayedRef.current = false;
    setUnavailable(false);

    if (!song?.video_id) {
      return;
    }

    const playbackTimeout = window.setTimeout(() => {
      if (!hasPlayedRef.current) {
        setUnavailable(true);
      }
    }, PLAYBACK_TIMEOUT_MS);

    return () => window.clearTimeout(playbackTimeout);
  }, [song?.video_id]);

  if (!song || isUnavailable) {
    return null;
  }

  const handleReady = (event: YouTubeEvent) => {
    try {
      event.target.mute();
      event.target.playVideo();
    } catch {
      setUnavailable(true);
    }
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <YouTube
        videoId={song.video_id}
        opts={options}
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-full min-w-[177.78dvh] -translate-x-1/2 -translate-y-1/2"
        iframeClassName="h-full w-full"
        title=""
        onReady={handleReady}
        onError={() => setUnavailable(true)}
        onStateChange={(event) => {
          if (event.data === YOUTUBE_PLAYER_STATE_PLAYING) {
            hasPlayedRef.current = true;
          }
        }}
      />
    </div>
  );
});
