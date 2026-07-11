import { NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { createPlaylist } from "@/app/lib/server/userLibrary";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(
      await createPlaylist(userId, await request.json()),
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create playlist", error);
    const invalid =
      error instanceof Error &&
      ["INVALID_ENTRIES", "INVALID_NAME"].includes(error.message);
    return NextResponse.json(
      { error: invalid ? "Invalid playlist" : "Playlist creation failed" },
      { status: invalid ? 400 : 500 },
    );
  }
}
