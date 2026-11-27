import { loadSeichiMapAchievementTargetLocationIds } from "@/app/lib/server/seichiMapAchievements";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    achievementId: string;
  }>;
};

const ACHIEVEMENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * バッジの達成条件の対象になっている地点の ID 一覧。
 * 地点の情報だけで個人の記録は含まないので、ログインは要らない。
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { achievementId } = await context.params;
    if (!ACHIEVEMENT_ID_PATTERN.test(achievementId)) {
      return NextResponse.json(
        { error: "バッジのIDの形式が不正です" },
        { status: 400 },
      );
    }

    const locationIds =
      await loadSeichiMapAchievementTargetLocationIds(achievementId);
    if (!locationIds) {
      return NextResponse.json(
        { error: "対象地点を取得できません" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { locationIds },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map achievement targets", error);
    return NextResponse.json(
      { error: "対象地点の取得に失敗しました" },
      { status: 500 },
    );
  }
}
