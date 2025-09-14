import { useState, useEffect } from "react";
import { Song } from "../types/song";
import { VideoInfo } from "../types/videoInfo";

export function useSongData() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [coverSongInfo, setCoverSongInfo] = useState<VideoInfo[]>([]);
  const [originalSongInfo, setOriginalSongInfo] = useState<VideoInfo[]>([]);

  // 曲リストの取得
  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // YouTube動画情報の取得
  useEffect(() => {
    if (songs.length === 0) return;

    const fetchVideoInfo = async (
      filterFn: (s: Song) => boolean,
      setter: (d: VideoInfo[]) => void,
    ) => {
      const videoIds = songs.filter(filterFn).map((s) => s.video_id);
      if (videoIds.length === 0) return setter([]);

      try {
        const res = await fetch(`/api/yt/info?videoIds=${videoIds.join(",")}`);
        if (!res.ok) throw new Error(`API call failed: ${res.status}`);
        setter(await res.json());
      } catch (e) {
        console.error("Failed to fetch video info:", e);
        setter([]);
      }
    };

    // カバー曲の情報
    fetchVideoInfo((s) => s.tags.includes("カバー曲"), setCoverSongInfo);

    // オリ曲の情報
    fetchVideoInfo(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        s.sing.includes("AZKi") &&
        ["AZKi", "瀬名航", "Star Flower", "SorAZ"].some((a) =>
          s.artist.includes(a),
        ),
      setOriginalSongInfo,
    );
  }, [songs]);

  return { loading, songs, coverSongInfo, originalSongInfo };
}
