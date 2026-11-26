import { getOptionalServerSession } from "@/app/lib/authSession";
import { loadSeichiMapUserAchievementSummary } from "@/app/lib/server/seichiMapAchievements";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getOptionalServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      await loadSeichiMapUserAchievementSummary(userId),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map achievements", error);
    return NextResponse.json(
      { error: "バッジの取得に失敗しました" },
      { status: 500 },
    );
  }
}
