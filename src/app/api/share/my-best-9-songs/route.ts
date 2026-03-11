import { NextResponse } from "next/server";
import { createMyBestNineSongsEntry } from "@/app/lib/myBestNineSongsSheet";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createMyBestNineSongsEntry(body);
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
