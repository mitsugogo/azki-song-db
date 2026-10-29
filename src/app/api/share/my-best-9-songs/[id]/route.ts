import { NextResponse } from "next/server";
import { findMyBestNineSongsEntryById } from "@/app/lib/myBestNineSongsSheet";
import { loadBestNineResponse } from "@/app/lib/server/bestNineTopics";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params;
    let databaseError: unknown;
    const saved = await loadBestNineResponse(id).catch((error: unknown) => {
      databaseError = error;
      return null;
    });
    const entry =
      saved ??
      (process.env.SAVE_SPREADSHEET_ID
        ? await findMyBestNineSongsEntryById(id)
        : null);
    if (!entry && databaseError) throw databaseError;

    if (!entry) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json(
      { id: entry.id, selection: entry.selection },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
