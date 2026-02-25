import { google } from "googleapis";
import { NextResponse } from "next/server";
import { YouTubeApiVideoResult } from "@/app/types/api/yt/video";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";

type FetchVideoOutcome = {
  result: YouTubeApiVideoResult | null;
  notFound: boolean;
};

const fetchFromYouTubeDataApi = async (
  videoId: string,
  hl: string,
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
      part: [
        "id",
        "snippet",
        "statistics",
        "contentDetails",
        "liveStreamingDetails",
        "status",
        "topicDetails",
        "recordingDetails",
        "player",
        "localizations",
      ],
      id: [videoId],
      hl: hl,
    });

    const item = response?.data?.items?.[0];
    if (!item) {
      return { result: null, notFound: true };
    }

    return {
      result: { ...item, lastFetchedAt: new Date().toISOString() },
      notFound: false,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video data (data api):", error);
    return { result: null, notFound: false };
  }
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ video_id: string; hl?: string }> },
) {
  const { video_id, hl } = await params;
  if (!video_id) {
    return NextResponse.json(
      { error: "video_id is required" },
      { status: 400 },
    );
  }

  // TODO:言語コードごとに取得するとAPIレートが厳しそうなので、今は日本語で固定
  // 将来的にはキャッシュを工夫して対応する
  const language = "ja";

  // YouTube Data API を使って動画情報を取得
  const result = await fetchFromYouTubeDataApi(video_id, language);
  if (result.result) {
    return NextResponse.json(result.result, {
      headers: {
        "Cache-Control":
          "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=300",
        "Vercel-Cache-Tag": buildVercelCacheTagHeader([
          cacheTags.ytVideo,
          `yt:video:${video_id}`,
        ]),
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
