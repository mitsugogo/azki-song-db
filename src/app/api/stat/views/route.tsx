import { NextRequest } from "next/server";
import { getStatisticsByVideoIds, isValidPeriod, parsePeriod } from "./shared";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const videoIdsParam =
    url.searchParams.get("videoIds") || url.searchParams.get("video_ids");

  if (!videoIdsParam) {
    return new Response(JSON.stringify({ error: "videoIds is required" }), {
      status: 400,
    });
  }

  const videoIds = videoIdsParam
    .split(",")
    .map((videoId) => videoId.trim())
    .filter(Boolean);

  if (videoIds.length === 0) {
    return new Response(JSON.stringify({ error: "videoIds is empty" }), {
      status: 400,
    });
  }

  const periodParam = url.searchParams.get("period");
  if (!isValidPeriod(periodParam)) {
    return new Response(JSON.stringify({ error: "Invalid period" }), {
      status: 400,
    });
  }
  const period = parsePeriod(periodParam) ?? undefined;

  let statisticsByVideoId;
  try {
    statisticsByVideoId = await getStatisticsByVideoIds(videoIds, period);
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch statistics" }),
      { status: 500 },
    );
  }

  if (!statisticsByVideoId) {
    return new Response(
      JSON.stringify({ error: "No statistics found for the given videoIds" }),
      { status: 404 },
    );
  }

  return new Response(
    JSON.stringify({
      statistics: statisticsByVideoId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "max-age=3600, s-maxage=86400, stale-while-revalidate=300",
      },
    },
  );
}
