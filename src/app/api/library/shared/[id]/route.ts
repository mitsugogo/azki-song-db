import { NextResponse } from "next/server";
import { getOptionalServerSession } from "@/app/lib/authSession";
import { loadSharedPlaylist } from "@/app/lib/server/userLibrary";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const session = await getOptionalServerSession();
  const result = await loadSharedPlaylist((await params).id, session?.user?.id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
