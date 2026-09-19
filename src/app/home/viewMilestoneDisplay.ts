import { getArtTrackVideoIdsHiddenWhenMusicVideoExists } from "../discography/utils/releaseVariants";
import type { Song } from "../types/song";

export function getArtTrackVideoIdsHiddenFromHomeViewMilestones(songs: Song[]) {
  return getArtTrackVideoIdsHiddenWhenMusicVideoExists(songs);
}
