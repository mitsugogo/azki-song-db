import { getOptionalServerSession } from "@/app/lib/authSession";
import { markSeichiMapAchievementsSeen } from "@/app/lib/server/seichiMapAchievements";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getOptionalServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedCount = await markSeichiMapAchievementsSeen(userId);
    return NextResponse.json(
      { updatedCount },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to mark seichi map achievements as seen", error);
    return NextResponse.json(
      { error: "バッジの通知状態を更新できませんでした" },
      { status: 500 },
    );
  }
}
