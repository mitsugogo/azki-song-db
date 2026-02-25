import { NextRequest } from "next/server";
import { getStatisticsByVideoId, isValidPeriod, parsePeriod } from "../shared";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ video_id: string }> },
) {
  const { video_id } = await params;
  if (!video_id) {
    return new Response(JSON.stringify({ error: "video_id is required" }), {
      status: 400,
    });
  }

  const periodParam = new URL(request.url).searchParams.get("period");
  if (!isValidPeriod(periodParam)) {
    return new Response(JSON.stringify({ error: "Invalid period" }), {
      status: 400,
    });
  }
  const period = parsePeriod(periodParam) ?? "7d";

  let statistics;
  try {
    statistics = await getStatisticsByVideoId(video_id, period);
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch statistics" }),
      { status: 500 },
    );
  }

  if (!statistics) {
    return new Response(
      JSON.stringify({ error: "No statistics found for the given video_id" }),
      { status: 404 },
    );
  }

  return new Response(JSON.stringify({ statistics }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=300",
      "Vercel-Cache-Tag": buildVercelCacheTagHeader([
        cacheTags.statViews,
        cacheTags.statViewsSingle,
      ]),
    },
  });
}
