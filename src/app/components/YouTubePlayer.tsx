import React, { useMemo } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";

interface YouTubePlayerProps {
  song: Song;
  video_id?: string;
  startTime?: number;
  onReady: (event: YouTubeEvent<number>) => void;
  onStateChange: (event: YouTubeEvent<number>) => void;
}

function YouTubePlayerComponent({
  song,
  video_id,
  startTime,
  onReady,
  onStateChange,
}: YouTubePlayerProps) {
  const videoId = video_id || song.video_id;
  const start = startTime || song.start || 0;
  const end = song.end || 0;

  const opts = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        start,
        end,
      },
    }),
    [videoId, start, end]
  );

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
      prevProps.startTime === nextProps.startTime
      // onStateChange は比較しない
    );
  }
);

export default YouTubePlayer;
