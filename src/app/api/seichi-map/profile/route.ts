import { getOptionalServerSession } from "@/app/lib/authSession";
import {
  getSeichiMapProfileByUserId,
  upsertSeichiMapProfile,
  validateSeichiMapProfileSettings,
} from "@/app/lib/seichiMapProfile";
import { toSeichiMapVisitedWriteError } from "@/app/lib/seichiMapVisitedSheet";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requireUserId = async (): Promise<string | null> => {
  const session = await getOptionalServerSession();
  return session?.user?.id ?? null;
};

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await getSeichiMapProfileByUserId(userId);
    return NextResponse.json(
      { item },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map profile", error);
    return NextResponse.json(
      { error: "プロフィールの取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      nickname?: unknown;
      showNicknameInRanking?: unknown;
    };
    const validated = validateSeichiMapProfileSettings(
      body.nickname,
      body.showNicknameInRanking,
    );
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const item = await upsertSeichiMapProfile({ userId, ...validated });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to save seichi map profile", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}
