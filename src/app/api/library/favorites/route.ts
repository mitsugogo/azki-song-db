import { NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { replaceFavorites } from "@/app/lib/server/userLibrary";

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await replaceFavorites(userId, body.favorites));
  } catch (error) {
    console.error("Failed to update favorites", error);
    return NextResponse.json({ error: "Invalid favorites" }, { status: 400 });
  }
}
