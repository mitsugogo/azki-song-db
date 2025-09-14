import { useMemo } from "react";
import { Song } from "../types/song";
import { VideoInfo } from "../types/videoInfo";
import { createStatistics } from "../lib/statisticsHelpers"; // 元のファイルからヘルパー関数を分離

type UseStatisticsProps = {
  songs: Song[];
  coverSongInfo: VideoInfo[];
  originalSongInfo: VideoInfo[];
};

export function useStatistics({
  songs,
  coverSongInfo,
  originalSongInfo,
}: UseStatisticsProps) {
  const songCounts = useMemo(
    () => createStatistics(songs, (s) => s.title),
    [songs],
  );
  const artistCounts = useMemo(
    () => createStatistics(songs, (s) => s.artist),
    [songs],
  );
  const originalSongCounts = useMemo(() => {
    const originals = songs.filter((s) =>
      s.artist.split("、").some((a) => a.includes("AZKi")),
    );
    return createStatistics(originals, (s) => s.title);
  }, [songs]);
  const tagCounts = useMemo(
    () => createStatistics(songs, (s) => s.tags),
    [songs],
  );
  const milestoneCounts = useMemo(
    () =>
      createStatistics(
        songs,
        (s) => s.milestones,
        (a, b) =>
          new Date(b.lastVideo?.broadcast_at || "").getTime() -
          new Date(a.lastVideo?.broadcast_at || "").getTime(),
      ),
    [songs],
  );
  const videoCounts = useMemo(
    () => createStatistics(songs, (s) => s.video_id),
    [songs],
  );
  const originalSongCountsByReleaseDate = useMemo(
    () =>
      createStatistics(
        songs.filter(
          (s) =>
            (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
            s.sing.includes("AZKi") &&
            ["AZKi", "瀬名航", "Star Flower", "SorAZ"].some((a) =>
              s.artist.includes(a),
            ),
        ),
        (s) => s.title,
        (a, b) =>
          new Date(b.firstVideo.broadcast_at).getTime() -
          new Date(a.firstVideo.broadcast_at).getTime(),
        originalSongInfo,
      ),
    [songs, originalSongInfo],
  );
  const coverSongCountsByReleaseDate = useMemo(
    () =>
      createStatistics(
        songs.filter((s) => s.tags.includes("カバー曲")),
        (s) => `${s.title} (${s.artist}) (${s.sing})`,
        (a, b) =>
          new Date(b.firstVideo.broadcast_at).getTime() -
          new Date(a.firstVideo.broadcast_at).getTime(),
        coverSongInfo,
      ),
    [songs, coverSongInfo],
  );

  return {
    songCounts,
    artistCounts,
    originalSongCounts,
    tagCounts,
    milestoneCounts,
    videoCounts,
    originalSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  };
}
