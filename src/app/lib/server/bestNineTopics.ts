import {
  buildBestNineLiveChoices,
  isBestNineVideoAllowed,
  isBestNineLiveAllowed,
  bestNineWorkKey,
} from "../bestNineLive";
import { fetchLiveTitleGroupsFromApi } from "./fetchLives";
import {
  normalizeBestNineSettings,
  bestNineSettingsSnapshot,
} from "../bestNineSettings";
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "../prisma";
import { isAdminGoogleAccountId } from "../adminConfig";
import {
  BestNineError,
  BEST_NINE_TOPICS_PAGE_SIZE,
  validTopicId,
  validateTopicInput,
} from "../bestNineTopics";
import type {
  BestNineResults,
  BestNineTopicView,
  BestNineTopicPage,
} from "../bestNineTopics";
import {
  emptyThemes,
  hasFixedSlots,
  normalizeSelection,
  normalizeStart,
  bestNineEntryKey,
} from "../myBestNineSongs";
import type { MyBestNineSongs } from "../myBestNineSongs";
import { fetchSongsFromApiWithRecentFallback } from "./fetchSongs";
import { participantKey } from "./bestNineParticipant";
import { prepareBestNineResultSlots } from "../bestNineResults";
import type { Prisma } from "@/generated/prisma/client";
import {
  normalizeSlotCategories,
  emptySlotCategories,
  hasCategoryRestrictions,
} from "../bestNineCategories";

const transaction = async <T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getPrisma().$transaction(action);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : null;
      if (attempt < 2 && (code === "P2002" || code === "P2034")) continue;
      if (code === "P2002" || code === "P2034")
        throw new BestNineError("TOPIC_CHANGED", 409);
      throw error;
    }
  }
};

const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const checkId = (id: string) => {
  if (!validTopicId(id)) throw new BestNineError("NOT_FOUND", 404);
};
const topicView = (
  topic: { id: string; ownerId: string; createdAt: Date },
  revision: {
    title: string;
    themes: unknown;
    version: number;
    slotCategories?: unknown;
    songCount?: number;
    allowedLiveIds?: unknown;
    hashtags?: unknown;
  },
  userId?: string | null,
): BestNineTopicView => ({
  id: topic.id,
  title: revision.title,
  themes: revision.themes as string[],
  slotCategories:
    normalizeSlotCategories(revision.slotCategories ?? undefined) ??
    emptySlotCategories(),
  ...bestNineSettingsSnapshot(
    normalizeBestNineSettings({
      songCount: revision.songCount,
      allowedLiveIds: revision.allowedLiveIds ?? undefined,
      hashtags: revision.hashtags ?? undefined,
    }) ?? {},
  ),
  version: revision.version,
  createdAt: topic.createdAt.toISOString(),
  canEdit: !!userId && topic.ownerId === userId,
  canDelete:
    !!userId && (topic.ownerId === userId || isAdminGoogleAccountId(userId)),
  canViewResults:
    !!userId && (topic.ownerId === userId || isAdminGoogleAccountId(userId)),
});

export const loadBestNineTopic = async (id: string, userId?: string | null) => {
  checkId(id);
  const topic = await getPrisma().bestNineTopic.findUnique({
    where: { id },
    include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!topic?.revisions[0]) throw new BestNineError("NOT_FOUND", 404);
  return topicView(topic, topic.revisions[0], userId);
};

export const listBestNineTopics = async (
  userId: string,
  all = false,
  requestedPage = 1,
): Promise<BestNineTopicPage> => {
  if (all && !isAdminGoogleAccountId(userId))
    throw new BestNineError("FORBIDDEN", 403);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1)
    throw new BestNineError("INVALID_PAGE", 400);
  return transaction(async (tx) => {
    const where = all ? {} : { ownerId: userId };
    const total = await tx.bestNineTopic.count({ where });
    const totalPages = Math.max(
      1,
      Math.ceil(total / BEST_NINE_TOPICS_PAGE_SIZE),
    );
    const page = Math.min(requestedPage, totalPages);
    const topics = await tx.bestNineTopic.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * BEST_NINE_TOPICS_PAGE_SIZE,
      take: BEST_NINE_TOPICS_PAGE_SIZE,
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    });
    return {
      topics: topics.map((topic) =>
        topicView(topic, topic.revisions[0], userId),
      ),
      total,
      page,
      pageSize: BEST_NINE_TOPICS_PAGE_SIZE,
      totalPages,
    };
  });
};

export const createBestNineTopic = async (userId: string, input: unknown) => {
  const definition = validateTopicInput(input);
  const topic = await getPrisma().bestNineTopic.create({
    data: {
      ownerId: userId,
      revisions: {
        create: { version: 1, ...definition, themes: json(definition.themes) },
      },
    },
    include: { revisions: true },
  });
  return topicView(topic, topic.revisions[0], userId);
};

export const editBestNineTopic = async (
  id: string,
  userId: string,
  input: unknown,
) => {
  checkId(id);
  const definition = validateTopicInput(input);
  const version = (input as Record<string, unknown>).version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1)
    throw new BestNineError("INVALID_TOPIC", 400);
  return transaction(async (tx) => {
    const topic = await tx.bestNineTopic.findUnique({ where: { id } });
    if (!topic) throw new BestNineError("NOT_FOUND", 404);
    if (topic.ownerId !== userId) throw new BestNineError("FORBIDDEN", 403);
    const updated = await tx.bestNineTopic.updateMany({
      where: { id, ownerId: userId, currentVersion: version },
      data: { currentVersion: { increment: 1 } },
    });
    if (updated.count !== 1) throw new BestNineError("TOPIC_CHANGED", 409);
    const revision = await tx.bestNineTopicRevision.create({
      data: {
        topicId: id,
        version: version + 1,
        ...definition,
        themes: json(definition.themes),
      },
    });
    return topicView(topic, revision, userId);
  });
};

export const deleteBestNineTopic = async (id: string, userId: string) => {
  checkId(id);
  await transaction(async (tx) => {
    const topic = await tx.bestNineTopic.findUnique({ where: { id } });
    if (!topic) throw new BestNineError("NOT_FOUND", 404);
    if (topic.ownerId !== userId && !isAdminGoogleAccountId(userId))
      throw new BestNineError("FORBIDDEN", 403);
    // 回答者が共有したページは、保存済みの曲・お題のスナップショットで維持する。
    await tx.bestNineResponse.updateMany({
      where: { revision: { topicId: id } },
      data: { revisionId: null },
    });
    await tx.bestNineTopicRevision.deleteMany({ where: { topicId: id } });
    await tx.bestNineTopic.delete({ where: { id } });
  });
};

export const saveBestNineResponse = async (
  input: unknown,
  userId: string | null,
  guestToken: string | null,
) => {
  if (!input || typeof input !== "object")
    throw new BestNineError("INVALID_RESPONSE", 400);
  const body = input as Record<string, unknown>;
  let selection = normalizeSelection(body);
  if (
    !selection ||
    selection.title.length > 50 ||
    (selection.author?.length ?? 0) > 30
  )
    throw new BestNineError("INVALID_RESPONSE", 400);
  const topicId = body.topicId;
  if (topicId !== undefined && !validTopicId(topicId))
    throw new BestNineError("INVALID_TOPIC", 400);
  const version = body.topicVersion;
  if (
    topicId &&
    (typeof version !== "number" || !Number.isInteger(version) || version < 1)
  )
    throw new BestNineError("INVALID_TOPIC", 400);
  if (!userId && !guestToken)
    throw new BestNineError("PARTICIPANT_REQUIRED", 428);
  const scope = topicId || "standalone";
  const respondentKey = participantKey(
    scope,
    userId ? "user" : "guest",
    userId || guestToken!,
  );
  const guestKey = guestToken
    ? participantKey(scope, "guest", guestToken)
    : null;
  // お題に紐づく回答のお題文は、クライアントから送られた値を信用しない。
  const prisma = getPrisma();
  const revision = topicId
    ? await prisma.bestNineTopicRevision.findUnique({
        where: { topicId_version: { topicId, version: version as number } },
        include: { topic: true },
      })
    : null;
  if (topicId && !revision) throw new BestNineError("NOT_FOUND", 404);
  if (revision) {
    const canonical = normalizeSelection({
      ...body,
      title: revision.title,
      themes: revision.themes,
      slotCategories: revision.slotCategories ?? undefined,
      songCount: revision.songCount ?? 9,
      allowedLiveIds: revision.allowedLiveIds ?? undefined,
      hashtags: revision.hashtags ?? undefined,
    });
    if (!canonical) throw new BestNineError("INVALID_RESPONSE", 400);
    selection = canonical;
  }
  const themes = revision ? (revision.themes as string[]) : selection.themes;
  const entries = selection.songs.map((entry, index) =>
    entry.kind === "live"
      ? { ...entry, slot: entry.slot ?? index }
      : {
          ...entry,
          slot: entry.slot ?? index,
          s: normalizeStart(entry.s) ?? entry.s,
        },
  );
  if (
    entries.some(
      (entry) =>
        entry.kind !== "live" &&
        (entry.v.length > 100 ||
          entry.s.length > 32 ||
          !Number.isFinite(Number(entry.s)) ||
          Number(entry.s) < 0),
    )
  )
    throw new BestNineError("INVALID_RESPONSE", 400);
  if (
    !hasFixedSlots(selection) &&
    new Set(entries.map(bestNineEntryKey)).size !== entries.length
  )
    throw new BestNineError("INVALID_RESPONSE", 400);
  const videoEntries = entries.filter((entry) => entry.kind !== "live");
  const needsLives =
    entries.some((entry) => entry.kind === "live") ||
    !!selection.allowedLiveIds?.length ||
    !!selection.slotCategories?.some((slot) => slot.includes("live-setlist"));
  const [songs, liveChoices] = await Promise.all([
    videoEntries.length
      ? fetchSongsFromApiWithRecentFallback({ locale: "ja" }, (catalog) =>
          videoEntries.every((entry) =>
            catalog.some(
              (song) =>
                song.video_id === entry.v &&
                normalizeStart(song.start) === entry.s,
            ),
          ),
        )
      : Promise.resolve([]),
    needsLives
      ? fetchLiveTitleGroupsFromApi().then(buildBestNineLiveChoices)
      : Promise.resolve([]),
  ]);
  const answerChoices = entries.map((entry) => {
    if (entry.kind === "live") {
      const live = liveChoices.find(
        (choice) =>
          choice.liveId === entry.liveId &&
          choice.entryKey === entry.liveEntryKey,
      );
      if (!live) throw new BestNineError("SONG_NOT_FOUND", 400);
      return { live, song: undefined };
    }
    const song = songs.find(
      (song) =>
        song.video_id === entry.v && normalizeStart(song.start) === entry.s,
    );
    if (!song || song.is_members_only)
      throw new BestNineError("SONG_NOT_FOUND", 400);
    return { song, live: undefined };
  });
  const validateChoices = (
    categories: ReturnType<typeof normalizeSlotCategories>,
    ids: string[],
  ) => {
    if (
      !categories ||
      answerChoices.some(({ song, live }, index) =>
        live
          ? !isBestNineLiveAllowed(live, categories[entries[index].slot], ids)
          : !isBestNineVideoAllowed(
              song!,
              categories[entries[index].slot],
              liveChoices,
              ids,
              songs,
            ),
      )
    )
      throw new BestNineError("SONG_CATEGORY_NOT_ALLOWED", 400);
  };
  validateChoices(
    normalizeSlotCategories(selection.slotCategories),
    selection.allowedLiveIds ?? [],
  );
  const answers = entries.map((entry, index) => {
    const { song, live } = answerChoices[index];
    const title = live?.title ?? song!.hl?.ja?.title ?? song!.title;
    const artist = live?.artist ?? song!.hl?.ja?.artist ?? song!.artist;
    return {
      slot: entry.slot,
      sourceType: live ? "live" : "video",
      videoId: entry.kind === "live" ? null : entry.v,
      start: entry.kind === "live" ? null : entry.s,
      liveId: live?.liveId ?? null,
      liveEntryKey: live?.entryKey ?? null,
      livePath: live?.path ?? null,
      singers: live?.singers ?? null,
      title: title.slice(0, 500),
      artist: artist.slice(0, 500),
      videoTitle: (live
        ? [live.liveTitle, live.performance].filter(Boolean).join(" / ")
        : song!.video_title || song!.title
      ).slice(0, 500),
      broadcastAt: (live?.date ?? song!.broadcast_at ?? "").slice(0, 64),
      songKey: createHash("sha256")
        .update(bestNineWorkKey(title, artist))
        .digest("hex"),
      performanceKey: createHash("sha256")
        .update(bestNineEntryKey(entry))
        .digest("hex"),
    };
  });
  const snapshot: MyBestNineSongs = {
    title: revision?.title ?? selection.title,
    author: selection.author,
    ...bestNineSettingsSnapshot(selection),
    ...(hasFixedSlots(selection) ? { themes: themes ?? emptyThemes() } : {}),
    ...(hasCategoryRestrictions(selection.slotCategories)
      ? { slotCategories: selection.slotCategories }
      : {}),
    songs: entries.map((entry, index) =>
      entry.kind === "live"
        ? {
            kind: "live",
            liveId: entry.liveId,
            liveEntryKey: entry.liveEntryKey,
            snapshot: answerChoices[index].live!,
            ...(hasFixedSlots(selection) ? { slot: entry.slot } : {}),
          }
        : {
            v: entry.v,
            s: entry.s,
            ...(hasFixedSlots(selection) ? { slot: entry.slot } : {}),
          },
    ),
  };
  return transaction(async (tx) => {
    if (revision) {
      // 編集前の画面からも回答を受け付ける。削除済みのお題への保存は拒否する。
      const current = await tx.bestNineTopic.findUnique({
        where: { id: topicId as string },
        include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      });
      if (!current) throw new BestNineError("NOT_FOUND", 404);
      // 古い画面や改ざんしたリクエストでも、現在のお題のカテゴリ制限を適用する。
      const latest = current.revisions[0];
      const latestSettings = normalizeBestNineSettings({
        songCount: latest?.songCount,
        allowedLiveIds: latest?.allowedLiveIds ?? undefined,
        hashtags: latest?.hashtags ?? undefined,
      });
      if (
        !latestSettings ||
        entries.length > latestSettings.songCount ||
        entries.some((entry) => entry.slot >= latestSettings.songCount)
      )
        throw new BestNineError("TOPIC_CHANGED", 409);
      // 新しい改訂でライブ条件が加わった場合も現在のカタログで検証する。
      const latestNeedsLives =
        latestSettings.allowedLiveIds.length ||
        (latest?.slotCategories as string[][] | null)?.some((slot) =>
          slot.includes("live-setlist"),
        );
      if (latestNeedsLives && !needsLives)
        liveChoices.push(
          ...buildBestNineLiveChoices(await fetchLiveTitleGroupsFromApi()),
        );
      validateChoices(
        normalizeSlotCategories(latest?.slotCategories ?? undefined),
        latestSettings.allowedLiveIds,
      );
    }
    let existing = revision
      ? await tx.bestNineResponse.findFirst({
          where: { respondentKey, revision: { topicId: topicId as string } },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        })
      : null;
    if (revision && userId && guestKey) {
      const guests = await tx.bestNineResponse.findMany({
        where: {
          revision: { topicId: topicId as string },
          respondentKey: guestKey,
          userId: null,
        },
        include: { revision: { select: { version: true } } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      if (!existing && guests[0]) existing = guests[0];
      // ログイン前の古い版の回答も統合し、共有URLと回答内容は維持する。
      for (const guest of guests) {
        if (guest.id === existing?.id) continue;
        await tx.bestNineResponse.update({
          where: { id: guest.id },
          data: {
            revisionId: null,
            selection: json({
              ...(normalizeSelection(guest.selection) ?? snapshot),
              topicId,
              topicVersion: guest.revision?.version ?? version,
            }),
          },
        });
      }
    }
    const data = {
      revisionId: revision?.id ?? null,
      respondentKey,
      userId,
      selection: json(snapshot),
    };
    const row = existing
      ? await tx.bestNineResponse.update({
          where: { id: existing.id },
          data: { ...data, entries: { deleteMany: {}, create: answers } },
        })
      : await tx.bestNineResponse.create({
          data: {
            id: randomBytes(9).toString("base64url").slice(0, 11),
            ...data,
            entries: { create: answers },
          },
        });
    return { id: row.id };
  });
};

export const loadBestNineResponse = async (id: string) => {
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(id)) return null;
  const row = await getPrisma().bestNineResponse.findUnique({
    where: { id },
    select: {
      id: true,
      selection: true,
      createdAt: true,
      revision: { select: { topicId: true, version: true } },
    },
  });
  if (!row) return null;
  const selection = normalizeSelection(row.selection);
  if (!selection) return null;
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    selection: {
      ...selection,
      ...(row.revision
        ? { topicId: row.revision.topicId, topicVersion: row.revision.version }
        : {}),
    },
  };
};

export const getBestNineResults = async (
  id: string,
  userId: string,
): Promise<BestNineResults> => {
  const topic = await loadBestNineTopic(id, userId);
  if (!topic.canViewResults) throw new BestNineError("FORBIDDEN", 403);
  const { responseCount, accountCount, groups } = await transaction(
    async (tx) => {
      const responses = await tx.bestNineResponse.findMany({
        where: { revision: { topicId: id } },
        select: { id: true, respondentKey: true, userId: true },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      // 旧データの改訂別回答も、同じ回答者は更新日時が最新の1件だけを数える。
      const seen = new Set<string>();
      const latest = responses.filter((response) => {
        if (seen.has(response.respondentKey)) return false;
        seen.add(response.respondentKey);
        return true;
      });
      const groups = latest.length
        ? await tx.bestNineResponseEntry.groupBy({
            by: [
              "slot",
              "songKey",
              "performanceKey",
              "videoTitle",
              "broadcastAt",
              "title",
              "artist",
              "videoId",
              "start",
              "sourceType",
              "liveId",
              "liveEntryKey",
              "livePath",
              "singers",
            ],
            where: {
              responseId: { in: latest.map((response) => response.id) },
            },
            _count: { _all: true },
          })
        : [];
      return {
        responseCount: latest.length,
        accountCount: latest.filter((response) => response.userId !== null)
          .length,
        groups,
      };
    },
  );
  const slotCount = Math.max(
    topic.songCount ?? 9,
    ...groups.map((group) => group.slot + 1),
  );
  const slots: BestNineResults["slots"] = Array.from(
    { length: slotCount },
    (_, slot) => ({
      slot,
      theme: topic.themes[slot],
      answerCount: 0,
      rankings: [],
    }),
  );
  for (const group of groups) {
    const slot = slots[group.slot];
    slot.answerCount += group._count._all;
    // 旧形式の保存キーも、日本語の保存済み曲名・歌手から照合する。
    // DBのキーを書き換えず、新しい別バージョンの回答と合算する。
    const workKey = bestNineWorkKey(group.title, group.artist);
    let rank = slot.rankings.find(
      (rank) => bestNineWorkKey(rank.title, rank.artist) === workKey,
    );
    if (!rank) {
      rank = {
        songKey: group.songKey,
        title: group.title,
        artist: group.artist,
        count: 0,
        performances: [],
      };
      slot.rankings.push(rank);
    }
    rank.count += group._count._all;
    const performance = rank.performances.find((item) =>
      group.liveId
        ? item.liveId === group.liveId &&
          item.liveEntryKey === group.liveEntryKey
        : item.videoId === group.videoId && item.start === group.start,
    );
    if (performance) performance.count += group._count._all;
    else
      rank.performances.push({
        ...(group.liveId
          ? {
              liveId: group.liveId,
              liveEntryKey: group.liveEntryKey!,
              livePath: group.livePath!,
              singers: group.singers ?? "",
            }
          : { videoId: group.videoId!, start: group.start! }),
        count: group._count._all,
        videoTitle: group.videoTitle,
        broadcastAt: group.broadcastAt,
      });
  }
  return {
    topic,
    responseCount,
    accountCount,
    guestCount: responseCount - accountCount,
    slots: prepareBestNineResultSlots(topic, slots),
  };
};
