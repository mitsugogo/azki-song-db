import {
  groupReleaseVariants,
  isArtTrack,
  isMusicVideo,
} from "../discography/utils/releaseVariants";
import type { Song } from "../types/song";

export function getArtTrackVideoIdsHiddenFromHomeViewMilestones(songs: Song[]) {
  return new Set(
    groupReleaseVariants(songs)
      .filter(
        (group) =>
          group.variants.some(isMusicVideo) && group.variants.some(isArtTrack),
      )
      .flatMap((group) =>
        group.variants
          .filter((song) => isArtTrack(song) && !isMusicVideo(song))
          .map((song) => song.video_id),
      ),
  );
}
