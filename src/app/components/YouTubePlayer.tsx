interface YouTubePlayerProps {
  song: {
    video_id: string;
    start: number;
    end: number;
  };
}

export default function YouTubePlayer({ song }: YouTubePlayerProps) {
  // startがない場合はvideo_idの先頭から再生
  const start = song.start ? song.start : 0;
  // endがない場合はvideo_idの最後まで再生
  const end = song.end ? song.end : 0;

  return (
    <iframe
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${song.video_id}?start=${start}&end=${end}&autoplay=1`}
      allow="autoplay; encrypted-media"
      allowFullScreen
    ></iframe>
  );
}