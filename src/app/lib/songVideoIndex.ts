import type { Song } from "../types/song";

export function createFirstSongsByVideoId(songs: readonly Song[]) {
  const firstSongsByVideoId = new Map<string, Song>();

  songs.forEach((song) => {
    if (!song.video_id) {
      return;
    }

    const currentSong = firstSongsByVideoId.get(song.video_id);
    if (!currentSong || Number(song.start) < Number(currentSong.start)) {
      firstSongsByVideoId.set(song.video_id, song);
    }
  });

  return firstSongsByVideoId;
}
