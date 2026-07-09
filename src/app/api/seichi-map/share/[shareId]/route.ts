import {
  getSeichiMapSharedVisits,
  validateSeichiMapShareId,
} from "@/app/lib/seichiMapShareSheet";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    shareId: string;
  }>;
};

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
  } catch (error) {
    console.error("Failed to load shared seichi map visits", error);
    return NextResponse.json(
      { error: "共有データの取得に失敗しました" },
      { status: 500 },
    );
  }
}
