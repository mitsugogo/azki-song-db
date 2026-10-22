import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/admin";
import {
  applySeichiMapIdentityRegistry,
  previewSeichiMapIdentityRegistry,
  SeichiMapIdentityError,
} from "@/app/lib/server/seichiMapIdentityRegistry";
import type { SeichiMapIdentityErrorCode } from "@/app/types/seichiMapIdentityRegistry";

export const dynamic = "force-dynamic";

const failure = (code: SeichiMapIdentityErrorCode, status: number) =>
  NextResponse.json(
    { error: code },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
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
  try {
    if (body.action === "preview" && Object.keys(body).length === 1) {
      return NextResponse.json(await previewSeichiMapIdentityRegistry(), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (
      body.action === "apply" &&
      Object.keys(body).length === 3 &&
      typeof body.baseVersion === "number" &&
      Number.isSafeInteger(body.baseVersion) &&
      body.baseVersion >= 0 &&
      body.baseVersion < 2_147_483_647 &&
      typeof body.candidateHash === "string" &&
      /^[0-9a-f]{64}$/.test(body.candidateHash)
    ) {
      return NextResponse.json(
        await applySeichiMapIdentityRegistry({
          baseVersion: body.baseVersion,
          candidateHash: body.candidateHash,
          userId: session.user.id,
        }),
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return failure("invalid_request", 400);
  } catch (error) {
    if (error instanceof SeichiMapIdentityError) {
      return failure(error.code, error.status);
    }
    // 接続先や資格情報を含み得るDB例外はレスポンスやログに出さない。
    return failure("storage_failed", 500);
  }
}
