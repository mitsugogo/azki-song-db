import { getOptionalServerSession } from "@/app/lib/authSession";
import {
  deleteSeichiMapShareByUserId,
  getSeichiMapSharedVisits,
  getSeichiMapShareByUserId,
  toSeichiMapVisitedWriteError,
  upsertSeichiMapShare,
  validateSeichiMapShareId,
  validateSeichiMapShareNickname,
} from "@/app/lib/seichiMapShareSheet";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requireUserId = async (): Promise<string | null> => {
  const session = await getOptionalServerSession();
  return session?.user?.id ?? null;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shareId = validateSeichiMapShareId(url.searchParams.get("shareId"));
    if (shareId) {
      const data = await getSeichiMapSharedVisits(shareId);
      if (!data) {
        return NextResponse.json(
          { error: "共有設定が見つかりません" },
          { status: 404 },
        );
      }

      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await getSeichiMapShareByUserId(userId);
    return NextResponse.json(
      { item },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map share row", error);
    return NextResponse.json(
      { error: "共有設定の取得に失敗しました" },
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
    };
    const validated = validateSeichiMapShareNickname(body.nickname);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const item = await upsertSeichiMapShare({
      userId,
      nickname: validated.nickname,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to save seichi map share row", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteSeichiMapShareByUserId(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete seichi map share row", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}
