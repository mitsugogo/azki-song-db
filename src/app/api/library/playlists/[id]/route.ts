import { NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { deletePlaylist, replacePlaylist } from "@/app/lib/server/userLibrary";

type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await replacePlaylist(
      userId,
      (await params).id,
      await request.json(),
    );
    return result
      ? NextResponse.json(result)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to update playlist", error);
    return NextResponse.json({ error: "Invalid playlist" }, { status: 400 });
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await deletePlaylist(userId, (await params).id);
  return result
    ? NextResponse.json(result)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
