import { google } from "googleapis";
import { NextResponse } from "next/server";
import { YouTubeApiVideoResult } from "@/app/types/api/yt/video";

type FetchVideoOutcome = {
  result: YouTubeApiVideoResult | null;
  notFound: boolean;
};

const parseIsoDurationToSeconds = (duration: string | null | undefined) => {
  if (!duration) return null;
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration) ?? [];
  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const seconds = match[3] ? Number.parseInt(match[3], 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
};

const mapYouTubeDataApiResult = (
  item: any,
  videoId: string,
): YouTubeApiVideoResult => {
  const thumbnails = item?.snippet?.thumbnails
    ? Object.values(item.snippet.thumbnails).map((t: any) => ({
        url: t?.url ?? null,
        width: t?.width ?? null,
        height: t?.height ?? null,
      }))
    : null;

  return {
    id: item?.id ?? videoId,
    title: item?.snippet?.title ?? null,
    author: item?.snippet?.channelTitle ?? null,
    uploadDate: item?.snippet?.publishedAt ?? null,
    viewCount: item?.statistics?.viewCount
      ? Number.parseInt(item.statistics.viewCount, 10)
      : null,
    isLiveContent: item?.snippet?.liveBroadcastContent === "live",
    thumbnails,
    likeCount: item?.statistics?.likeCount
      ? Number.parseInt(item.statistics.likeCount, 10)
      : null,
    tags: Array.isArray(item?.snippet?.tags) ? item.snippet.tags : [],
    description: item?.snippet?.description ?? null,
    duration: parseIsoDurationToSeconds(item?.contentDetails?.duration),
    chapters: [],
    music: null,
    lastFetchedAt: new Date().toISOString(),
  };
};

const fetchFromYouTubeDataApi = async (
  videoId: string,
): Promise<FetchVideoOutcome> => {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return { result: null, notFound: false };
  }

  try {
    const youtubeData = google.youtube({
      version: "v3",
      auth: apiKey,
    });

    const response = await youtubeData.videos.list({
      part: ["id", "snippet", "statistics", "contentDetails"],
      id: [videoId],
    });

    const item = response?.data?.items?.[0];
    if (!item) {
      return { result: null, notFound: true };
    }

    return {
      result: mapYouTubeDataApiResult(item, videoId),
      notFound: false,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video data (data api):", error);
    return { result: null, notFound: false };
  }
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ video_id: string }> },
) {
  const { video_id } = await params;
  if (!video_id) {
    return NextResponse.json(
      { error: "video_id is required" },
      { status: 400 },
    );
  }

  // YouTube Data API を使って動画情報を取得
  const result = await fetchFromYouTubeDataApi(video_id);
  if (result.result) {
    return NextResponse.json(result.result, {
      headers: {
        "Cache-Control":
          "max-age=3600, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  }

  if (result.notFound) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Failed to fetch video data" },
    { status: 500 },
  );
}
