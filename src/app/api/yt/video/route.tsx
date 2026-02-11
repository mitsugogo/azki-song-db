import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint expects a video id. Use /api/yt/video/[video_id]" },
    { status: 400 },
  );
}
