import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import { NextResponse, type NextRequest } from "next/server";
import {
  getReleaseViewStatistics,
  isValidPeriod,
  parsePeriod,
} from "../shared";

export async function GET(request: NextRequest) {
  const periodParam = request.nextUrl.searchParams.get("period");
  if (!isValidPeriod(periodParam)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const period = parsePeriod(periodParam) ?? "7d";

  try {
    const statistics = await getReleaseViewStatistics(period);

    return NextResponse.json(
      { statistics },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, must-revalidate, s-maxage=180, stale-while-revalidate=300",
          "Vercel-Cache-Tag": buildVercelCacheTagHeader([
            cacheTags.statViews,
            cacheTags.statViewsReleases,
          ]),
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch release view statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch release view statistics" },
      { status: 500 },
    );
  }
}
