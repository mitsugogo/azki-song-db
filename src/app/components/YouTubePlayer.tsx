import React from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";

interface YouTubePlayerProps {
  song: Song;
  onStateChange: (event: YouTubeEvent<number>) => void;
}

export default function YouTubePlayer({
  song,
  onStateChange,
}: YouTubePlayerProps) {
  // startがない場合はvideo_idの先頭から再生
  const start = song.start ? song.start : 0;
  // endがない場合はvideo_idの最後まで再生
  const end = song.end ? song.end : 0;

  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      start: start,
      end: end,
    },
  };

  return (
    <YouTube
      videoId={song.video_id}
      className="w-full h-full"
      opts={opts}
      onStateChange={onStateChange}
      onReady={(event) => {
        event.target.playVideo();
      }}
    />
  );
}
