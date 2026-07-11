import { NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { migrateLegacyLibrary } from "@/app/lib/server/userLibrary";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(
      await migrateLegacyLibrary(userId, await request.json()),
    );
  } catch (error) {
    console.error("Failed to migrate legacy library", error);
    const invalid =
      error instanceof Error &&
      ["INVALID_MIGRATION", "INVALID_ENTRIES", "INVALID_NAME"].includes(
        error.message,
      );
    return NextResponse.json(
      { error: invalid ? "Invalid legacy library" : "Migration failed" },
      { status: invalid ? 400 : 500 },
    );
  }
}
