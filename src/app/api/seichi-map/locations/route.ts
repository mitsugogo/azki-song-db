import {
  AZKI_SEICHI_MAP_KML_URL,
  parseSeichiMapKml,
} from "@/app/lib/seichiMap";
import { SEICHI_MAP_USER_COUNT_HEADER } from "@/app/lib/seichiMapHeaders";
import {
  loadSeichiMapUniqueVisitorCounts,
  loadSeichiMapUserCount,
} from "@/app/lib/seichiMapVisitedSheet";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [response, uniqueVisitorCounts, userCount] = await Promise.all([
      fetch(AZKI_SEICHI_MAP_KML_URL, {
        cache: "no-store",
        headers: {
          Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*",
        },
      }),
      loadSeichiMapUniqueVisitorCounts().catch<Record<string, number>>(
        (error) => {
          console.error("Failed to load seichi map visitor counts", error);
          return {};
        },
      ),
      loadSeichiMapUserCount().catch<number | null>((error) => {
        console.error("Failed to load seichi map user count", error);
        return null;
      }),
    ]);

    if (!response.ok) {
      return NextResponse.json(
        { error: `KMLの取得に失敗しました: ${response.status}` },
        { status: 502 },
      );
    }

    const kml = await response.text();
    const items = parseSeichiMapKml(kml);

    const headers = new Headers({ "Cache-Control": "no-store" });
    if (userCount !== null) {
      headers.set(SEICHI_MAP_USER_COUNT_HEADER, String(userCount));
    }

    return NextResponse.json(
      items.map((item) => ({
        ...item,
        uniqueVisitorCount: uniqueVisitorCounts[item.id] ?? 0,
      })),
      { headers },
    );
  } catch (error) {
    console.error("Failed to fetch AZKi seichi map KML", error);
    return NextResponse.json(
      { error: "聖地マップの取得に失敗しました" },
      { status: 500 },
    );
  }
}
