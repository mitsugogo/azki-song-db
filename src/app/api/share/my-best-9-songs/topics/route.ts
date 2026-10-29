import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { bestNineApi, readBestNineJson } from "@/app/lib/server/bestNineApi";
import { assertSameOrigin } from "@/app/lib/server/bestNineParticipant";
import {
  createBestNineTopic,
  listBestNineTopics,
} from "@/app/lib/server/bestNineTopics";
import { BestNineError } from "@/app/lib/bestNineTopics";

export const GET = (request: NextRequest) =>
  bestNineApi(async () => {
    const userId = await requireUserId();
    if (!userId) throw new BestNineError("UNAUTHORIZED", 401);
    const rawPage = request.nextUrl.searchParams.get("page");
    if (
      rawPage !== null &&
      (!/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage)))
    )
      throw new BestNineError("INVALID_PAGE", 400);
    return NextResponse.json(
      await listBestNineTopics(
        userId,
        request.nextUrl.searchParams.get("scope") === "all",
        rawPage === null ? 1 : Number(rawPage),
      ),
    );
  });

export const POST = (request: NextRequest) =>
  bestNineApi(async () => {
    assertSameOrigin(request);
    const userId = await requireUserId();
    if (!userId) throw new BestNineError("UNAUTHORIZED", 401);
    return NextResponse.json(
      {
        topic: await createBestNineTopic(
          userId,
          await readBestNineJson(request),
        ),
      },
      { status: 201 },
    );
  });
