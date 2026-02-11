import React, { useMemo } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";

interface YouTubePlayerProps {
  song: Song;
  video_id?: string;
  startTime?: number;
  disableEnd?: boolean;
  onReady: (event: YouTubeEvent<number>) => void;
  onStateChange: (event: YouTubeEvent<number>) => void;
}

function YouTubePlayerComponent({
  song,
  video_id,
  startTime,
  disableEnd,
  onReady,
  onStateChange,
}: YouTubePlayerProps) {
  const videoId = video_id || song.video_id;
  const start = Number(startTime ?? song.start ?? 0);
  const end = Number(song.end ?? 0);

  const opts = useMemo(() => {
    const playerVars: Record<string, number> = {
      enablejsapi: 1,
      autoplay: 1,
      start,
    };
    if (!disableEnd && end > 0) {
      playerVars.end = end;
    }
    return {
      width: "100%",
      height: "100%",
      playerVars,
    };
  }, [videoId, start, end, disableEnd]);

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
      prevProps.disableEnd === nextProps.disableEnd
      // onStateChange は比較しない
    );
  },
);

export default YouTubePlayer;
