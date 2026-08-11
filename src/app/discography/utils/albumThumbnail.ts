import type { Song } from "../../types/song";
import { isArtTrack } from "./releaseVariants";

/** アルバムに収録されたアートトラックを、アルバムアートとして優先する。 */
export function getAlbumThumbnailSong(songs: Song[], fallback: Song): Song {
  return songs.find(isArtTrack) ?? fallback;
}
