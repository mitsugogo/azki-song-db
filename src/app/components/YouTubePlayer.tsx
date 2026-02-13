import React, { useMemo } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";
import { Options } from "youtube-player/dist/types";

interface YouTubePlayerProps {
  song: Song;
  video_id?: string;
  startTime?: number;
  disableEnd?: boolean;
  showNativeControls?: boolean;
  onReady: (event: YouTubeEvent<number>) => void;
  onStateChange: (event: YouTubeEvent<number>) => void;
}

function YouTubePlayerComponent({
  song,
  video_id,
  startTime,
  disableEnd,
  showNativeControls,
  onReady,
  onStateChange,
}: YouTubePlayerProps) {
  const videoId = video_id || song.video_id;
  const start = Number(startTime ?? song.start ?? 0);
  const end = Number(song.end ?? 0);
  const showControls =
    typeof showNativeControls === "boolean" ? showNativeControls : true;

  const opts: Options = useMemo(() => {
    return {
      width: "100%",
      height: "100%",
      /**
       * YouTube Player API のパラメータ設定
       * @see https://developers.google.com/youtube/player_parameters
       */
      playerVars: {
        enablejsapi: 1,
        autoplay: 1,
        playsinline: 1,
        controls: showControls ? 1 : 0,
        start: start,
        end: !disableEnd && end > 0 ? end : undefined,
        rel: 0, // 再生終了後に同じチャンネルの動画を表示
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    } as Options;
  }, [videoId, start, end, disableEnd, showNativeControls]);

  return (
    <YouTube
      videoId={videoId}
      className="w-full h-full"
      opts={opts}
      onStateChange={onStateChange}
      onReady={onReady}
    />
  );
}

// props が同じなら再レンダリングを防ぐ
const YouTubePlayer = React.memo(
  YouTubePlayerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.song.video_id === nextProps.song.video_id &&
      prevProps.song.start === nextProps.song.start &&
      prevProps.song.end === nextProps.song.end &&
      prevProps.video_id === nextProps.video_id &&
      prevProps.startTime === nextProps.startTime &&
      prevProps.disableEnd === nextProps.disableEnd &&
      prevProps.showNativeControls === nextProps.showNativeControls
      // onStateChange は比較しない
    );
  },
);

export default YouTubePlayer;
