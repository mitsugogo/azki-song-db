import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/app/lib/server/requireUser";
import { bestNineApi, readBestNineJson } from "@/app/lib/server/bestNineApi";
import {
  assertSameOrigin,
  participantKey,
  readGuestToken,
} from "@/app/lib/server/bestNineParticipant";
import {
  editBestNineTopic,
  deleteBestNineTopic,
  loadBestNineTopic,
} from "@/app/lib/server/bestNineTopics";
import { BestNineError } from "@/app/lib/bestNineTopics";
import { getPrisma } from "@/app/lib/prisma";
import { normalizeSelection } from "@/app/lib/myBestNineSongs";

type Context = { params: Promise<{ id: string }> };
export const GET = (request: NextRequest, context: Context) =>
  bestNineApi(async () => {
    const { id } = await context.params;
    const userId = await requireUserId();
    const topic = await loadBestNineTopic(id, userId);
    const guest = readGuestToken(request);
    let response = null;
    if (userId || guest) {
      const key = participantKey(
        id,
        userId ? "user" : "guest",
        userId || guest!,
      );
      const row = await getPrisma().bestNineResponse.findFirst({
        where: {
          respondentKey: key,
          revision: { topicId: id },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: { id: true, selection: true },
      });
      if (row)
        response = { id: row.id, selection: normalizeSelection(row.selection) };
    }
    return NextResponse.json({ topic, response });
  });

export const PATCH = (request: NextRequest, context: Context) =>
  bestNineApi(async () => {
    assertSameOrigin(request);
    const userId = await requireUserId();
    if (!userId) throw new BestNineError("UNAUTHORIZED", 401);
    return NextResponse.json({
      topic: await editBestNineTopic(
        (await context.params).id,
        userId,
        await readBestNineJson(request),
      ),
    });
  });

export const DELETE = (request: NextRequest, context: Context) =>
  bestNineApi(async () => {
    assertSameOrigin(request);
    const userId = await requireUserId();
    if (!userId) throw new BestNineError("UNAUTHORIZED", 401);
    await deleteBestNineTopic((await context.params).id, userId);
    return NextResponse.json({ deleted: true });
  });
