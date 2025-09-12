import { google } from "googleapis";
import { MethodOptions } from "googleapis/build/src/apis/abusiveexperiencereport";
import { NextRequest, NextResponse } from "next/server";

// 50件ずつに分割するヘルパー関数
const chunkArray = (arr: Array<string>, size: number) => {
  const chunkedArr = [];
  for (let i = 0; i < arr.length; i += size) {
    chunkedArr.push(arr.slice(i, i + size));
  }
  return chunkedArr;
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_DATA_API_KEY is not set" },
      { status: 500 }
    );
  }

  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  const params = req.nextUrl.searchParams;
  const videoIdsParam = params.get("videoIds");

  if (!videoIdsParam) {
    return NextResponse.json(
      { error: "videoIds parameter is required" },
      { status: 400 }
    );
  }
  const videoIds = videoIdsParam.split(",");
  const chunkedVideoIds = chunkArray(videoIds, 50);

  try {
    const requests = chunkedVideoIds.map((chunk) => {
      return youtube.videos.list({
        part: ["id", "snippet", "statistics"] as string[],
        id: chunk.join(","),
      } as MethodOptions);
    });

    const responses = await Promise.all(requests);

    const allVideoInfos = responses.flatMap((response) =>
      response?.data?.items?.map((item) => ({
        videoId: item.id,
        title: item.snippet?.title,
        snippet: item.snippet,
        statistics: item.statistics,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url,
      }))
    );

    return NextResponse.json(allVideoInfos, {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch YouTube video data:", error);
    return NextResponse.json(
      { error: "Failed to fetch video data" },
      { status: 500 }
    );
  }
}
