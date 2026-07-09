import { getOptionalServerSession } from "@/app/lib/authSession";
import {
  createSeichiMapVisited,
  deleteSeichiMapVisited,
  loadSeichiMapVisitedRows,
  toSeichiMapVisitedItem,
  toSeichiMapVisitedWriteError,
  updateSeichiMapVisited,
  validateSeichiMapVisitedBody,
  type UpsertSeichiMapVisitedBody,
} from "@/app/lib/seichiMapVisitedSheet";
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

    const rows = await loadSeichiMapVisitedRows(userId);
    const items = rows.map(toSeichiMapVisitedItem);

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load seichi map visited rows", error);
    return NextResponse.json(
      { error: "訪問ログの取得に失敗しました" },
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

    const body = (await request.json()) as UpsertSeichiMapVisitedBody;
    const validated = validateSeichiMapVisitedBody(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const item = await createSeichiMapVisited(userId, validated);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to add seichi map visited item", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpsertSeichiMapVisitedBody;
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const validated = validateSeichiMapVisitedBody(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const item = await updateSeichiMapVisited(id, userId, validated);
    if (!item) {
      return NextResponse.json(
        { error: "対象データが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to update seichi map visited item", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const deleted = await deleteSeichiMapVisited(id, userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "対象データが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete seichi map visited item", error);
    const handled = toSeichiMapVisitedWriteError(error);
    return NextResponse.json(
      { error: handled.message, detail: handled.detail },
      { status: handled.status },
    );
  }
}
