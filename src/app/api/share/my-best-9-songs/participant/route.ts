import { NextRequest, NextResponse } from "next/server";
import { bestNineApi } from "@/app/lib/server/bestNineApi";
import {
  assertSameOrigin,
  ensureParticipantCookie,
} from "@/app/lib/server/bestNineParticipant";

export const POST = (request: NextRequest) =>
  bestNineApi(async () => {
    assertSameOrigin(request);
    const response = NextResponse.json({ ready: true });
    ensureParticipantCookie(request, response);
    return response;
  });
