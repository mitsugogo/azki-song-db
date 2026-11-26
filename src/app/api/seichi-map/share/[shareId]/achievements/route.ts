import { validateSeichiMapShareId } from "@/app/lib/seichiMapShareSheet";
import { loadSharedSeichiMapAchievementSummary } from "@/app/lib/server/seichiMapAchievements";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    shareId: string;
  }>;
};

/** 共有された聖地マップの持ち主のバッジ状況。閲覧専用。 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { shareId: rawShareId } = await context.params;
    const shareId = validateSeichiMapShareId(rawShareId);
    if (!shareId) {
      return NextResponse.json(
        { error: "共有URLの形式が不正です" },
        { status: 400 },
      );
    }

    const summary = await loadSharedSeichiMapAchievementSummary(shareId);
    if (!summary) {
      return NextResponse.json(
        { error: "共有設定が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load shared seichi map achievements", error);
    return NextResponse.json(
      { error: "バッジの取得に失敗しました" },
      { status: 500 },
    );
  }
}
