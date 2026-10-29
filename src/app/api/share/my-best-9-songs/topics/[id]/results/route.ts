import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { bestNineApi } from "@/app/lib/server/bestNineApi";
import { getBestNineResults } from "@/app/lib/server/bestNineTopics";
import { BestNineError } from "@/app/lib/bestNineTopics";

export const GET = (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) =>
  bestNineApi(async () => {
    const userId = await requireUserId();
    if (!userId) throw new BestNineError("UNAUTHORIZED", 401);
    return NextResponse.json(
      await getBestNineResults((await context.params).id, userId),
    );
  });
