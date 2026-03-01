import { useMemo } from "react";
import { Song } from "../types/song";
import { createStatistics } from "../lib/statisticsHelpers";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../config/filters";

type UseStatisticsProps = {
  songs: Song[];
};

const isOfficialOriginalRelease = (song: Song) => {
  return (
    Boolean(song.album) ||
    song.tags.some((tag) => tag.includes("MV")) ||
    song.tags.includes("アートトラック")
  );
};

const getOriginalReleaseKey = (song: Song) => {
  const baseKey = `${song.title}__${song.artist}`;

  if (song.tags.some((tag) => tag.includes("MV"))) {
    return `${baseKey}__mv`;
  }
  if (song.tags.includes("アートトラック")) {
    return `${baseKey}__art-track`;
  }

  return `${baseKey}__other`;
};

export function useStatistics({ songs }: UseStatisticsProps) {
  const songCounts = useMemo(
    () => createStatistics(songs, (s) => s.title),
    [songs],
  );
  const artistCounts = useMemo(
    () => createStatistics(songs, (s) => s.artist),
    [songs],
  );
  const originalSongCounts = useMemo(() => {
    const originals = songs.filter((s) => {
      return (
        isPossibleOriginalSong(s, true) ||
        (s.artist.includes("AZKi") && s.sing.includes("AZKi"))
      );
    });
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
            (isPossibleOriginalSong(s) || isCollaborationSong(s)) &&
            isOfficialOriginalRelease(s),
        ),
        getOriginalReleaseKey,
        (a, b) =>
          new Date(b.firstVideo.broadcast_at).getTime() -
          new Date(a.firstVideo.broadcast_at).getTime(),
      ),
    [songs],
  );
  const coverSongCountsByReleaseDate = useMemo(
    () =>
      createStatistics(
        songs.filter((s) => isCoverSong(s)),
        (s) => `${s.title} (${s.artist}) (${s.sing})`,
        (a, b) =>
          new Date(b.firstVideo.broadcast_at).getTime() -
          new Date(a.firstVideo.broadcast_at).getTime(),
      ),
    [songs],
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
