import { getOptionalServerSession } from "@/app/lib/authSession";
import { setSeichiMapUserTitle } from "@/app/lib/server/seichiMapAchievements";
import type { SeichiMapTitleSelection } from "@/app/types/seichiMapAchievements";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ACHIEVEMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

const parseSelection = (
  value: unknown,
): SeichiMapTitleSelection | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const body = value as Record<string, unknown>;
  if (body.achievementId === null && Object.keys(body).length === 1) {
    return null;
  }
  if (
    Object.keys(body).length === 2 &&
    typeof body.achievementId === "string" &&
    ACHIEVEMENT_ID_PATTERN.test(body.achievementId) &&
    typeof body.level === "number" &&
    Number.isSafeInteger(body.level) &&
    body.level >= 1 &&
    body.level <= 100
  ) {
    return { achievementId: body.achievementId, level: body.level };
  }
  return undefined;
};

/** 表示する称号を設定する。{ achievementId: null } で自動選択に戻す。 */
export async function PUT(request: Request) {
  try {
    const session = await getOptionalServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const selection = parseSelection(await request.json().catch(() => null));
    if (selection === undefined) {
      return NextResponse.json(
        { error: "称号の指定が不正です" },
        { status: 400 },
      );
    }
    if (!(await setSeichiMapUserTitle(userId, selection))) {
      return NextResponse.json(
        { error: "獲得していない称号は設定できません" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to set seichi map title", error);
    return NextResponse.json(
      { error: "称号を設定できませんでした" },
      { status: 500 },
    );
  }
}
