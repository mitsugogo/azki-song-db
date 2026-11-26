import {
  AZKI_SEICHI_MAP_KML_URL,
  parseSeichiMapKml,
} from "@/app/lib/seichiMap";
import { SEICHI_MAP_USER_COUNT_HEADER } from "@/app/lib/seichiMapHeaders";
import {
  loadSeichiMapLocationVisitorSummaries,
  loadSeichiMapUserCount,
  type SeichiMapLocationVisitorSummary,
} from "@/app/lib/seichiMapVisitedSheet";
import { after, NextResponse } from "next/server";
import { loadSeichiMapIdentityRegistry } from "@/app/lib/server/seichiMapIdentityRegistry";
import { syncSeichiMapAchievementsIfChanged } from "@/app/lib/server/seichiMapAchievements";

export const dynamic = "force-dynamic";
// レスポンス後のバッジ判定用の同期（after）もこの上限で打ち切られる。
export const maxDuration = 60;

export async function GET() {
  try {
    const [response, visitorSummaries, userCount, registry] = await Promise.all(
      [
        fetch(AZKI_SEICHI_MAP_KML_URL, {
          cache: "no-store",
          headers: {
            Accept: "application/vnd.google-earth.kml+xml,text/xml,*/*",
          },
        }),
        loadSeichiMapLocationVisitorSummaries().catch<
          Record<string, SeichiMapLocationVisitorSummary>
        >((error) => {
          console.error("Failed to load seichi map visitor counts", error);
          return {};
        }),
        loadSeichiMapUserCount().catch<number | null>((error) => {
          console.error("Failed to load seichi map user count", error);
          return null;
        }),
        loadSeichiMapIdentityRegistry(),
      ],
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `KMLの取得に失敗しました: ${response.status}` },
        { status: 502 },
      );
    }

    const kml = await response.text();
    const items = parseSeichiMapKml(kml, registry.identities);

    // マップが編集されていたら、レスポンス後にバッジ判定用の地点を同期する。
    after(async () => {
      try {
        await syncSeichiMapAchievementsIfChanged({
          kml,
          registry,
          locations: items,
        });
      } catch (error) {
        console.error("Failed to sync seichi map achievements", error);
      }
    });

    const headers = new Headers({ "Cache-Control": "no-store" });
    if (userCount !== null) {
      headers.set(SEICHI_MAP_USER_COUNT_HEADER, String(userCount));
    }

    return NextResponse.json(
      items.map((item) => {
        const visitorSummary = visitorSummaries[item.id];
        return {
          ...item,
          uniqueVisitorCount: visitorSummary?.uniqueVisitorCount ?? 0,
          singleVisitorNickname: visitorSummary?.singleVisitorNickname ?? null,
        };
      }),
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
