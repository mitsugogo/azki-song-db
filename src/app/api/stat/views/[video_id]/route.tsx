import { NextRequest } from "next/server";
import { getStatisticsByVideoId, isValidPeriod, parsePeriod } from "../shared";

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
  const period = parsePeriod(periodParam) ?? undefined;

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
        "max-age=3600, s-maxage=86400, stale-while-revalidate=300",
    },
  });
}
