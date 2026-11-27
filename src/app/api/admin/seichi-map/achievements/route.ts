import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/admin";
import {
  previewSeichiMapAchievementSync,
  SeichiMapAchievementError,
  syncSeichiMapAchievementLocations,
} from "@/app/lib/server/seichiMapAchievements";
import type { SeichiMapAchievementErrorCode } from "@/app/types/seichiMapAchievements";

export const dynamic = "force-dynamic";
// KML取得・都道府県の判定・全ユーザーの再判定を1リクエストで行う。
export const maxDuration = 60;

const failure = (code: SeichiMapAchievementErrorCode, status: number) =>
  NextResponse.json(
    { error: code },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user?.id) return failure("forbidden", 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return failure("forbidden", 403);
  }
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return failure("invalid_request", 400);
    }
    body = value as Record<string, unknown>;
  } catch {
    return failure("invalid_request", 400);
  }
  if (Object.keys(body).length !== 1) return failure("invalid_request", 400);

  try {
    if (body.action === "preview") {
      return NextResponse.json(await previewSeichiMapAchievementSync(), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (body.action === "sync") {
      return NextResponse.json(
        await syncSeichiMapAchievementLocations({
          syncedBy: session.user.id,
        }),
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return failure("invalid_request", 400);
  } catch (error) {
    if (error instanceof SeichiMapAchievementError) {
      return failure(error.code, error.status);
    }
    // 接続先や資格情報を含み得るDB例外はレスポンスに出さない。
    console.error("Failed to sync seichi map achievements");
    return failure("storage_failed", 500);
  }
}
