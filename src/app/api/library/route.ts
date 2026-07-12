import { NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { loadLibrary } from "@/app/lib/server/userLibrary";

export const dynamic = "force-dynamic";
export async function GET() {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await loadLibrary(userId), {
    headers: { "Cache-Control": "no-store" },
  });
}
