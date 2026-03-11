import { NextResponse } from "next/server";
import { findMyBestNineSongsEntryById } from "@/app/lib/myBestNineSongsSheet";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params;
    const entry = await findMyBestNineSongsEntryById(id);

    if (!entry) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ id: entry.id, selection: entry.selection });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
