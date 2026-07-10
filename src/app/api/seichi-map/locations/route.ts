import {
  AZKI_SEICHI_MAP_KML_URL,
  parseSeichiMapKml,
} from "@/app/lib/seichiMap";
import { loadSeichiMapUniqueVisitorCounts } from "@/app/lib/seichiMapVisitedSheet";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(AZKI_SEICHI_MAP_KML_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `KMLの取得に失敗しました: ${response.status}` },
        { status: 502 },
      );
    }

    const kml = await response.text();
    const items = parseSeichiMapKml(kml);
    let uniqueVisitorCounts: Record<string, number> = {};

    try {
      uniqueVisitorCounts = await loadSeichiMapUniqueVisitorCounts();
    } catch (error) {
      console.error("Failed to load seichi map visitor counts", error);
    }

    return NextResponse.json(
      items.map((item) => ({
        ...item,
        uniqueVisitorCount: uniqueVisitorCounts[item.id] ?? 0,
      })),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch AZKi seichi map KML", error);
    return NextResponse.json(
      { error: "聖地マップの取得に失敗しました" },
      { status: 500 },
    );
  }
}
