import type { YouTubeApiVideoResult } from "../types/api/yt/video";

export function resolveVideoMetaDate(
  videoInfo?: YouTubeApiVideoResult | null,
): string | null {
  return (
    videoInfo?.liveStreamingDetails?.actualStartTime ??
    videoInfo?.snippet?.publishedAt ??
    null
  );
}
