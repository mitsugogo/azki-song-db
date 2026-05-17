import React, { useMemo } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";
import { Options } from "youtube-player/dist/types";
import type { YouTubePlayerWithVideoData } from "../hook/usePlayerControls";
import { useLocale } from "next-intl";

interface YouTubePlayerProps {
  video_id?: string;
  startTime?: number;
  skipInitialStart?: boolean;
  showNativeControls?: boolean;
  onReady: (event: YouTubeEvent<any>) => void;
  onStateChange: (event: YouTubeEvent<any>) => void;
  onError?: (event: YouTubeEvent<any>) => void;
}

function YouTubePlayerComponent({
  video_id,
  startTime,
  skipInitialStart,
  showNativeControls,
  onReady,
  onStateChange,
  onError,
}: YouTubePlayerProps) {
  const showControls =
    typeof showNativeControls === "boolean" ? showNativeControls : true;

  const locale = useLocale();

  const opts: Options = useMemo(() => {
    const playerVars: NonNullable<Options["playerVars"]> = {
      enablejsapi: 1,
      autoplay: 1,
      playsinline: 1,
      controls: showControls ? 1 : 0,
      rel: 0, // 再生終了後に同じチャンネルの動画を表示
      hl: locale || "ja", // 動画のUI
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    };

    if (!skipInitialStart && typeof startTime === "number") {
      playerVars.start = startTime;
    }

    return {
      width: "100%",
      height: "100%",
      /**
       * YouTube Player API のパラメータ設定
       * @see https://developers.google.com/youtube/player_parameters
       */
      playerVars,
    } as Options;
  }, [video_id, startTime, skipInitialStart, showNativeControls, locale]);

  return (
    <YouTube
      videoId={video_id}
      className="w-full h-full"
      opts={opts}
      onStateChange={onStateChange}
      onReady={onReady}
      onError={onError}
    />
  );
}

// props が同じなら再レンダリングを防ぐ
const YouTubePlayer = React.memo(
  YouTubePlayerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.video_id === nextProps.video_id &&
      prevProps.startTime === nextProps.startTime &&
      prevProps.skipInitialStart === nextProps.skipInitialStart &&
      prevProps.showNativeControls === nextProps.showNativeControls
      // onStateChange は比較しない
    );
  },
);

export default YouTubePlayer;
