import {
  AZKI_SEICHI_MAP_KML_URL,
  buildSeichiMapGoogleMapsSearchUrl,
  loadSeichiMapAdministrativeArea,
  parseSeichiMapKml,
} from "@/app/lib/seichiMap";
import {
  loadSeichiMapLocationVisitorRanking,
  loadSeichiMapVisitorRanking,
  SEICHI_MAP_RANKING_LIMIT,
} from "@/app/lib/seichiMapVisitedSheet";
import { NextResponse } from "next/server";
import { loadSeichiMapIdentityRegistry } from "@/app/lib/server/seichiMapIdentityRegistry";
import { loadSeichiMapRankingBadges } from "@/app/lib/server/seichiMapAchievements";
import type { SeichiMapRankingBadge } from "@/app/types/seichiMapAchievements";

export const dynamic = "force-dynamic";

const ADMINISTRATIVE_AREA_CONCURRENCY = 5;

export async function GET() {
  try {
    const [response, locationRows, registry] = await Promise.all([
      fetch(AZKI_SEICHI_MAP_KML_URL, {
        cache: "no-store",
        headers: {
          Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*",
        },
      }),
      loadSeichiMapLocationVisitorRanking(),
      loadSeichiMapIdentityRegistry(),
    ]);

    if (!response.ok) {
      return NextResponse.json(
        { error: `KMLの取得に失敗しました: ${response.status}` },
        { status: 502 },
      );
    }

    const currentLocations = parseSeichiMapKml(
      await response.text(),
      registry.identities,
    );
    const locationsById = new Map(
      currentLocations.map((location) => [location.id, location]),
    );
    const visitors = await loadSeichiMapVisitorRanking(
      currentLocations.map((location) => location.id),
    );
    // バッジの集計に失敗してもランキング自体は返す。
    const badgesRequest = loadSeichiMapRankingBadges(
      visitors.map(({ userId }) => userId),
    ).catch<Map<string, SeichiMapRankingBadge>>((error) => {
      console.error("Failed to load seichi map ranking badges", error);
      return new Map();
    });
    const rankedLocations = locationRows
      .flatMap((row) => {
        const location = locationsById.get(row.locationId);
        return location
          ? [
              {
                id: location.id,
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                uniqueVisitorCount: row.uniqueVisitorCount,
              },
            ]
          : [];
      })
      .sort(
        (left, right) =>
          right.uniqueVisitorCount - left.uniqueVisitorCount ||
          left.name.localeCompare(right.name, "ja"),
      )
      .slice(0, SEICHI_MAP_RANKING_LIMIT);
    const administrativeAreas = new Array<string | null>(
      rankedLocations.length,
    );
    for (
      let start = 0;
      start < rankedLocations.length;
      start += ADMINISTRATIVE_AREA_CONCURRENCY
    ) {
      const group = rankedLocations.slice(
        start,
        start + ADMINISTRATIVE_AREA_CONCURRENCY,
      );
      const areas = await Promise.all(
        group.map((location) => loadSeichiMapAdministrativeArea(location)),
      );
      areas.forEach((area, index) => {
        administrativeAreas[start + index] = area;
      });
    }
    const locations = rankedLocations.map((location, index) => ({
      id: location.id,
      name: location.name,
      administrativeArea: administrativeAreas[index] ?? null,
      seichiMapUrl: `/seichi-map?location=${encodeURIComponent(location.id)}`,
      googleMapUrl: buildSeichiMapGoogleMapsSearchUrl(location),
      uniqueVisitorCount: location.uniqueVisitorCount,
    }));

    const badges = await badgesRequest;

    return NextResponse.json(
      {
        locations,
        // userId は内部の照合にだけ使い、レスポンスには含めない。
        visitors: visitors.map(({ userId, nickname, visitCount }) => ({
          nickname,
          visitCount,
          achievement: badges.get(userId) ?? null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map rankings", error);
    return NextResponse.json(
      { error: "聖地マップのランキング取得に失敗しました" },
      { status: 500 },
    );
  }
}
