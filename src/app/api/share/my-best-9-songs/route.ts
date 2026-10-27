import { NextRequest, NextResponse } from "next/server";
import { saveBestNineResponse } from "@/app/lib/server/bestNineTopics";
import { requireUserId } from "@/app/lib/server/requireUser";
import {
  assertSameOrigin,
  readGuestToken,
} from "@/app/lib/server/bestNineParticipant";
import { bestNineApi, readBestNineJson } from "@/app/lib/server/bestNineApi";

export const POST = (request: NextRequest) =>
  bestNineApi(async () => {
    assertSameOrigin(request);
    const userId = await requireUserId();
    return NextResponse.json(
      await saveBestNineResponse(
        await readBestNineJson(request),
        userId,
        readGuestToken(request),
      ),
      { status: 201 },
    );
  });
