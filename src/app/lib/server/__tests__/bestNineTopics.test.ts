import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyThemes } from "@/app/lib/myBestNineSongs";
import type { Song } from "@/app/types/song";
import { emptySlotCategories } from "@/app/lib/bestNineCategories";
const { db, fetchSongs } = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  });
  return {
    db: {
      bestNineTopic: model(),
      bestNineTopicRevision: model(),
      bestNineResponse: model(),
      bestNineResponseEntry: model(),
      $transaction: vi.fn(),
    },
    fetchSongs: vi.fn(),
  };
});
vi.mock("@/app/lib/prisma", () => ({ getPrisma: () => db }));
vi.mock("../fetchSongs", () => ({
  fetchSongsFromApiWithRecentFallback: fetchSongs,
}));
import {
  createBestNineTopic,
  deleteBestNineTopic,
  editBestNineTopic,
  getBestNineResults,
  loadBestNineResponse,
  loadBestNineTopic,
  listBestNineTopics,
  saveBestNineResponse,
} from "../bestNineTopics";
import { participantKey } from "../bestNineParticipant";

const id = "12345678-1234-4234-8234-123456789abc";
const themes = ["出会い", ...emptyThemes().slice(1)];
const topic = {
  id,
  ownerId: "owner",
  currentVersion: 1,
  createdAt: new Date("2026-10-27T15:30:00.000Z"),
};
const revision = {
  id: "revision-1",
  topicId: id,
  version: 1,
  title: "正式なお題",
  themes,
  topic,
};
const song = {
  video_id: "video",
  start: 10,
  title: "曲",
  artist: "歌手",
  video_title: "歌枠配信",
  broadcast_at: "2026-10-27T00:00:00Z",
  hl: { ja: { title: "曲", artist: "歌手" } },
} as Song;
const body = {
  title: "偽タイトル",
  topicId: id,
  topicVersion: 1,
  songs: [{ v: "video", s: "10", slot: 8 }],
};

describe("お題・ゲスト回答・集計のサーバー処理", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-only-secret");
    vi.stubEnv("ADMIN_GOOGLE_ACCOUNT_ID", "admin");
    db.$transaction.mockImplementation((action) =>
      Array.isArray(action) ? Promise.all(action) : action(db),
    );
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      revisions: [revision],
    });
    db.bestNineTopic.count.mockResolvedValue(1);
    db.bestNineTopic.updateMany.mockResolvedValue({ count: 1 });
    db.bestNineTopicRevision.findUnique.mockResolvedValue(revision);
    db.bestNineTopicRevision.create.mockImplementation(async ({ data }) => ({
      id: "revision-2",
      ...data,
    }));
    db.bestNineResponse.findUnique.mockResolvedValue(null);
    db.bestNineResponse.findFirst.mockResolvedValue(null);
    db.bestNineResponse.findMany.mockResolvedValue([]);
    db.bestNineResponse.create.mockImplementation(async ({ data }) => data);
    db.bestNineResponse.update.mockImplementation(async ({ where, data }) => ({
      id: where.id,
      ...data,
    }));
    fetchSongs.mockResolvedValue([song]);
  });

  it("お題作成者はセッションのIDを保存し、本文のownerIdを採用しない", async () => {
    db.bestNineTopic.create.mockImplementation(async ({ data }) => ({
      id,
      ownerId: data.ownerId,
      createdAt: topic.createdAt,
      revisions: [revision],
    }));
    const result = await createBestNineTopic("owner", {
      title: "題",
      themes,
      ownerId: "attacker",
    });
    expect(db.bestNineTopic.create.mock.calls[0][0].data.ownerId).toBe("owner");
    expect(result).toMatchObject({ canEdit: true, canViewResults: true });
    expect(result).not.toHaveProperty("ownerId");
    expect(result.createdAt).toBe("2026-10-27T15:30:00.000Z");
  });

  it("一覧と詳細は改訂版の日時ではなくお題の作成日時を返す", async () => {
    const saved = {
      ...topic,
      revisions: [
        {
          ...revision,
          version: 2,
          createdAt: new Date("2026-10-28T12:00:00Z"),
        },
      ],
    };
    db.bestNineTopic.findMany.mockResolvedValue([saved]);
    db.bestNineTopic.findUnique.mockResolvedValue(saved);
    expect((await listBestNineTopics("owner")).topics[0].createdAt).toBe(
      "2026-10-27T15:30:00.000Z",
    );
    expect((await loadBestNineTopic(id)).createdAt).toBe(
      "2026-10-27T15:30:00.000Z",
    );
  });

  it("100件を超えるお題も20件ずつ取得し、同日時でも順序を安定させる", async () => {
    db.bestNineTopic.count.mockResolvedValue(125);
    db.bestNineTopic.findMany.mockResolvedValue([
      { ...topic, revisions: [revision] },
    ]);
    const result = await listBestNineTopics("owner", false, 6);
    expect(result).toMatchObject({
      total: 125,
      page: 6,
      pageSize: 20,
      totalPages: 7,
    });
    expect(db.bestNineTopic.count).toHaveBeenCalledWith({
      where: { ownerId: "owner" },
    });
    expect(db.bestNineTopic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "owner" },
        skip: 100,
        take: 20,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("管理者の全件表示も同じ条件で総件数とページを取得する", async () => {
    db.bestNineTopic.count.mockResolvedValue(42);
    db.bestNineTopic.findMany.mockResolvedValue([]);
    expect(await listBestNineTopics("admin", true, 2)).toMatchObject({
      total: 42,
      page: 2,
      totalPages: 3,
    });
    expect(db.bestNineTopic.count).toHaveBeenCalledWith({ where: {} });
    expect(db.bestNineTopic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 20 }),
    );
    await expect(listBestNineTopics("other", true, 2)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it.each([
    [21, 9, 2, 20],
    [0, 5, 1, 0],
  ])(
    "範囲外ページは最終ページへ補正する（件数=%s）",
    async (total, requested, page, skip) => {
      db.bestNineTopic.count.mockResolvedValue(total);
      db.bestNineTopic.findMany.mockResolvedValue([]);
      expect(await listBestNineTopics("owner", false, requested)).toMatchObject(
        { total, page, totalPages: page },
      );
      expect(db.bestNineTopic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip }),
      );
    },
  );

  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
    "不正なページ番号を拒否する（%s）",
    async (page) => {
      await expect(
        listBestNineTopics("owner", false, page),
      ).rejects.toMatchObject({ code: "INVALID_PAGE", status: 400 });
      expect(db.bestNineTopic.count).not.toHaveBeenCalled();
    },
  );

  it.each(["owner", "admin"])(
    "作成者と管理者は回答の共有ページを残してお題を削除できる: %s",
    async (user) => {
      await deleteBestNineTopic(id, user);
      expect(db.bestNineResponse.updateMany).toHaveBeenCalledWith({
        where: { revision: { topicId: id } },
        data: { revisionId: null },
      });
      expect(db.bestNineTopicRevision.deleteMany).toHaveBeenCalledWith({
        where: { topicId: id },
      });
      expect(db.bestNineTopic.delete).toHaveBeenCalledWith({ where: { id } });
      expect(db.bestNineResponse.delete).not.toHaveBeenCalled();
      expect(db.bestNineResponseEntry.deleteMany).not.toHaveBeenCalled();
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      expect(
        db.bestNineResponse.updateMany.mock.invocationCallOrder[0],
      ).toBeLessThan(
        db.bestNineTopicRevision.deleteMany.mock.invocationCallOrder[0],
      );
      expect(
        db.bestNineTopicRevision.deleteMany.mock.invocationCallOrder[0],
      ).toBeLessThan(db.bestNineTopic.delete.mock.invocationCallOrder[0]);
    },
  );

  it("お題削除で関連付けを外した回答も元の共有IDで取得できる", async () => {
    db.bestNineResponse.findUnique.mockResolvedValue({
      id: "response-id",
      selection: { title: revision.title, themes, songs: body.songs },
      createdAt: new Date("2026-10-28T00:00:00Z"),
      revision: null,
    });
    const saved = await loadBestNineResponse("response-id");
    expect(saved?.selection).toEqual({
      title: revision.title,
      themes,
      songs: body.songs,
    });
    expect(saved?.selection).not.toHaveProperty("topicId");
  });

  it("回答の関連付け解除が失敗したらお題・改訂版の削除に進まない", async () => {
    db.bestNineResponse.updateMany.mockRejectedValue(
      new Error("storage failure"),
    );
    await expect(deleteBestNineTopic(id, "owner")).rejects.toThrow(
      "storage failure",
    );
    expect(db.bestNineTopicRevision.deleteMany).not.toHaveBeenCalled();
    expect(db.bestNineTopic.delete).not.toHaveBeenCalled();
  });

  it("他のユーザーによる削除を拒否する", async () => {
    await expect(deleteBestNineTopic(id, "other")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(db.bestNineResponse.updateMany).not.toHaveBeenCalled();
    expect(db.bestNineTopicRevision.deleteMany).not.toHaveBeenCalled();
    expect(db.bestNineTopic.delete).not.toHaveBeenCalled();
  });

  it("削除済み・不正IDのお題は削除・取得できない", async () => {
    await expect(deleteBestNineTopic("invalid", "owner")).rejects.toMatchObject(
      { code: "NOT_FOUND", status: 404 },
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    db.bestNineTopic.findUnique.mockResolvedValue(null);
    await expect(deleteBestNineTopic(id, "owner")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    await expect(loadBestNineTopic(id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    await expect(getBestNineResults(id, "owner")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    expect(db.bestNineTopic.delete).not.toHaveBeenCalled();
  });

  it("保存処理中にお題が削除された場合は回答を保存しない", async () => {
    db.bestNineTopic.findUnique.mockResolvedValue(null);
    await expect(
      saveBestNineResponse(body, null, "guest"),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect(db.bestNineResponse.create).not.toHaveBeenCalled();
    expect(db.bestNineResponse.update).not.toHaveBeenCalled();
  });

  it.each([null, "other", "owner", "admin"])(
    "削除権限は作成者か管理者に限定する: %s",
    async (user) => {
      expect((await loadBestNineTopic(id, user)).canDelete).toBe(
        user === "owner" || user === "admin",
      );
    },
  );

  it.each(["other", "admin"])(
    "作成者以外は管理者でも編集できない: %s",
    async (user) => {
      await expect(
        editBestNineTopic(id, user, { title: "変更", themes, version: 1 }),
      ).rejects.toMatchObject({ status: 403 });
      expect(db.bestNineTopic.updateMany).not.toHaveBeenCalled();
      expect(db.bestNineTopicRevision.create).not.toHaveBeenCalled();
    },
  );

  it("編集してもお題IDを維持し、タイトルと枠の内容を更新する", async () => {
    const updatedThemes = ["変更した枠", ...themes.slice(1)];
    const result = await editBestNineTopic(id, "owner", {
      title: "変更",
      themes: updatedThemes,
      version: 1,
    });
    expect(result).toMatchObject({ id, title: "変更", themes: updatedThemes });
    expect(db.bestNineTopic.create).not.toHaveBeenCalled();
    expect(db.bestNineTopic.delete).not.toHaveBeenCalled();
    expect(result.version).toBe(2);
    expect(result.createdAt).toBe(topic.createdAt.toISOString());
    expect(db.bestNineTopic.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id, ownerId: "owner", currentVersion: 1 },
      }),
    );
    expect(db.bestNineTopicRevision.create.mock.calls[0][0].data).toMatchObject(
      { topicId: id, version: 2, title: "変更", themes: updatedThemes },
    );
  });

  it("同時編集の古い版は409で拒否する", async () => {
    db.bestNineTopic.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      editBestNineTopic(id, "owner", { title: "変更", themes, version: 1 }),
    ).rejects.toMatchObject({ status: 409 });
    expect(db.bestNineTopicRevision.create).not.toHaveBeenCalled();
  });

  it("ゲスト回答をユーザーなしで保存し、お題と曲名をサーバーで確定する", async () => {
    await saveBestNineResponse(body, null, "guest-token");
    const saved = db.bestNineResponse.create.mock.calls[0][0].data;
    expect(saved.userId).toBeNull();
    expect(saved.respondentKey).toBe(
      participantKey(id, "guest", "guest-token"),
    );
    expect(saved.selection).toMatchObject({
      title: "正式なお題",
      themes,
      songs: [{ v: "video", s: "10", slot: 8 }],
    });
    expect(saved.entries.create[0]).toMatchObject({
      slot: 8,
      title: "曲",
      artist: "歌手",
    });
    expect(saved.entries.create[0].songKey).toHaveLength(64);
    expect(saved.entries.create[0]).toMatchObject({
      videoTitle: "歌枠配信",
      broadcastAt: "2026-10-27T00:00:00Z",
    });
  });

  it("Cookieもログインもないゲスト回答を拒否する", async () => {
    await expect(saveBestNineResponse(body, null, null)).rejects.toMatchObject({
      status: 428,
    });
    expect(db.bestNineResponse.create).not.toHaveBeenCalled();
  });

  it.each([null, "account"])(
    "再回答は既存の回答IDを更新する: %s",
    async (userId) => {
      db.bestNineResponse.findFirst.mockResolvedValueOnce({
        id: "old-response",
      });
      const result = await saveBestNineResponse(body, userId, "guest-token");
      expect(result.id).toBe("old-response");
      expect(db.bestNineResponse.create).not.toHaveBeenCalled();
      expect(
        db.bestNineResponse.update.mock.calls[0][0].data.entries,
      ).toMatchObject({
        deleteMany: {},
        create: [expect.objectContaining({ slot: 8 })],
      });
    },
  );

  it("同じブラウザのゲスト回答をログイン後に引き継ぐ", async () => {
    db.bestNineResponse.findMany.mockResolvedValue([
      { id: "guest-response", userId: null, revision: { version: 1 } },
    ]);
    const result = await saveBestNineResponse(body, "account", "guest-token");
    expect(result.id).toBe("guest-response");
    expect(db.bestNineResponse.update.mock.calls[0][0].data.userId).toBe(
      "account",
    );
    expect(db.bestNineResponse.update.mock.calls[0][0].data.respondentKey).toBe(
      participantKey(id, "user", "account"),
    );
  });

  it("ログイン済み回答とゲスト回答が両方ある場合は統合する", async () => {
    db.bestNineResponse.findFirst.mockResolvedValue({ id: "account-response" });
    db.bestNineResponse.findMany.mockResolvedValue([
      { id: "guest-response", revision: { version: 1 } },
    ]);
    expect(
      (await saveBestNineResponse(body, "account", "guest-token")).id,
    ).toBe("account-response");
    expect(db.bestNineResponse.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "guest-response" },
        data: expect.objectContaining({ revisionId: null }),
      }),
    );
    expect(db.bestNineResponse.delete).not.toHaveBeenCalled();
  });

  it("編集前の画面からも回答を受け付け、当時のお題をスナップショットに残す", async () => {
    db.bestNineTopicRevision.findUnique.mockResolvedValue({
      ...revision,
      topic: { ...topic, currentVersion: 2 },
    });
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      currentVersion: 2,
      revisions: [{ ...revision, version: 2 }],
    });
    await saveBestNineResponse(body, null, "guest");
    expect(db.bestNineResponse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisionId: revision.id,
          selection: expect.objectContaining({ title: revision.title, themes }),
        }),
      }),
    );
  });

  it("既存のお題は全カテゴリとして読み込む", async () => {
    expect((await loadBestNineTopic(id)).slotCategories).toEqual(
      emptySlotCategories(),
    );
  });

  it("作成・編集で9枠分のカテゴリを保存し、お題IDを維持する", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    slotCategories[8] = ["original", "cover"];
    db.bestNineTopic.create.mockImplementation(async ({ data }) => ({
      ...topic,
      revisions: [data.revisions.create],
    }));
    expect(
      (
        await createBestNineTopic("owner", {
          title: "題",
          themes,
          slotCategories,
        })
      ).slotCategories,
    ).toEqual(slotCategories);
    const edited = await editBestNineTopic(id, "owner", {
      title: "改題",
      themes,
      slotCategories,
      version: 1,
    });
    expect(edited).toMatchObject({ id, slotCategories });
    expect(
      db.bestNineTopicRevision.create.mock.calls[0][0].data.slotCategories,
    ).toEqual(slotCategories);
    expect(db.bestNineResponse.update).not.toHaveBeenCalled();
    expect(db.bestNineResponse.deleteMany).not.toHaveBeenCalled();
  });

  it.each([null, "account"])(
    "古い画面・改ざんした制限でも現在の枠の制限を検証する（%s）",
    async (userId) => {
      const slotCategories = emptySlotCategories();
      slotCategories[8] = ["original"];
      db.bestNineTopic.findUnique.mockResolvedValue({
        ...topic,
        currentVersion: 2,
        revisions: [{ ...revision, version: 2, slotCategories }],
      });
      fetchSongs.mockResolvedValue([
        { ...song, tags: ["カバー曲"], sing: "AZKi" },
      ]);
      await expect(
        saveBestNineResponse(
          { ...body, slotCategories: emptySlotCategories() },
          userId,
          "guest",
        ),
      ).rejects.toMatchObject({
        code: "SONG_CATEGORY_NOT_ALLOWED",
        status: 400,
      });
      expect(db.bestNineResponse.create).not.toHaveBeenCalled();
    },
  );

  it("同じ歌唱でも枠ごとのカテゴリ判定が異なり、許可された枠にだけ保存できる", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    slotCategories[8] = ["original", "cover"];
    const savedRevision = { ...revision, slotCategories };
    db.bestNineTopicRevision.findUnique.mockResolvedValue(savedRevision);
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      revisions: [savedRevision],
    });
    fetchSongs.mockResolvedValue([
      { ...song, tags: ["カバー曲"], sing: "AZKi" },
    ]);
    await saveBestNineResponse(body, null, "guest");
    expect(
      db.bestNineResponse.create.mock.calls[0][0].data.selection,
    ).toMatchObject({
      slotCategories,
      songs: [{ v: "video", s: "10", slot: 8 }],
    });
    await expect(
      saveBestNineResponse(
        { ...body, songs: [{ v: "video", s: "10", slot: 0 }] },
        null,
        "guest",
      ),
    ).rejects.toMatchObject({ code: "SONG_CATEGORY_NOT_ALLOWED" });
  });

  it.each([null, "account"])(
    "編集後の再回答は古い版の回答を同じIDで更新する: %s",
    async (userId) => {
      db.bestNineResponse.findFirst.mockResolvedValueOnce({
        id: "original-response",
        revisionId: "older-revision",
      });
      expect((await saveBestNineResponse(body, userId, "guest")).id).toBe(
        "original-response",
      );
      expect(db.bestNineResponse.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            respondentKey: participantKey(
              id,
              userId ? "user" : "guest",
              userId || "guest",
            ),
            revision: { topicId: id },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        }),
      );
      expect(db.bestNineResponse.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "original-response" },
          data: expect.objectContaining({ revisionId: revision.id }),
        }),
      );
    },
  );

  it("ログイン時は複数の版のゲスト回答をまとめ、以前の共有URLも維持する", async () => {
    db.bestNineResponse.findFirst.mockResolvedValue({ id: "account-response" });
    db.bestNineResponse.findMany.mockResolvedValue([
      {
        id: "guest-new",
        revision: { version: 2 },
        selection: { title: "変更後", songs: body.songs, themes },
      },
      {
        id: "guest-old",
        revision: { version: 1 },
        selection: { title: "変更前", songs: body.songs, themes },
      },
    ]);
    expect((await saveBestNineResponse(body, "account", "guest")).id).toBe(
      "account-response",
    );
    for (const [guestId, version] of [
      ["guest-new", 2],
      ["guest-old", 1],
    ] as const) {
      expect(db.bestNineResponse.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: guestId },
          data: {
            revisionId: null,
            selection: expect.objectContaining({
              topicId: id,
              topicVersion: version,
            }),
          },
        }),
      );
    }
    expect(db.bestNineResponse.delete).not.toHaveBeenCalled();
  });

  it("存在しない歌唱を集計へ書き込まない", async () => {
    fetchSongs.mockResolvedValue([]);
    await expect(
      saveBestNineResponse(body, null, "guest"),
    ).rejects.toMatchObject({ code: "SONG_NOT_FOUND" });
    expect(db.bestNineResponse.create).not.toHaveBeenCalled();
  });

  it("同時回答の一意制約競合を再試行する", async () => {
    db.$transaction.mockRejectedValueOnce({ code: "P2002" });
    await saveBestNineResponse(body, null, "guest");
    expect(db.$transaction).toHaveBeenCalledTimes(2);
  });

  it("集計は非所有者を拒否し、管理者には編集を許可しない", async () => {
    await expect(getBestNineResults(id, "other")).rejects.toMatchObject({
      status: 403,
    });
    expect(db.bestNineResponseEntry.groupBy).not.toHaveBeenCalled();
    expect(await loadBestNineTopic(id, "admin")).toMatchObject({
      canEdit: false,
      canViewResults: true,
    });
  });

  it("全改訂の回答を合計し、同じ回答者は最新の1件だけを枠別に集計する", async () => {
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      currentVersion: 2,
      revisions: [
        {
          ...revision,
          version: 2,
          themes: ["編集後の枠", ...emptyThemes().slice(1)],
        },
      ],
    });
    db.bestNineResponse.findMany.mockResolvedValue([
      { id: "account-latest", respondentKey: "account", userId: "account" },
      { id: "guest-a", respondentKey: "a", userId: null },
      { id: "guest-b", respondentKey: "b", userId: null },
      { id: "account-old", respondentKey: "account", userId: "account" },
      { id: "guest-c", respondentKey: "c", userId: null },
    ]);
    db.bestNineResponseEntry.groupBy.mockResolvedValue([
      {
        slot: 8,
        songKey: "same-song",
        title: "曲",
        artist: "歌手",
        videoId: "video",
        start: "10",
        _count: { _all: 2 },
      },
      {
        slot: 8,
        songKey: "same-song",
        title: "曲",
        artist: "歌手",
        videoId: "other",
        start: "30",
        _count: { _all: 1 },
      },
    ]);
    const result = await getBestNineResults(id, "admin");
    expect(result).toMatchObject({
      responseCount: 4,
      guestCount: 3,
      accountCount: 1,
    });
    expect(result.slots[0].theme).toBe("編集後の枠");
    expect(result.slots[0].answerCount).toBe(0);
    expect(result.slots[8].rankings[0]).toMatchObject({
      count: 3,
      performances: [
        { videoId: "video", start: "10", count: 2 },
        { videoId: "other", start: "30", count: 1 },
      ],
    });
    expect(db.bestNineResponseEntry.groupBy.mock.calls[0][0].where).toEqual({
      responseId: { in: ["account-latest", "guest-a", "guest-b", "guest-c"] },
    });
    expect(result).not.toHaveProperty("respondentKey");
  });

  it("順不同のお題は全枠を合算し、曲別と同じ歌唱の内訳をまとめる", async () => {
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      revisions: [{ ...revision, themes: emptyThemes() }],
    });
    db.bestNineResponse.findMany.mockResolvedValue([
      { id: "a", respondentKey: "a", userId: null },
      { id: "b", respondentKey: "b", userId: "account" },
    ]);
    const group = {
      songKey: "same-song",
      title: "曲",
      artist: "歌手",
      videoId: "video",
      start: "10",
    };
    db.bestNineResponseEntry.groupBy.mockResolvedValue([
      { ...group, slot: 0, _count: { _all: 1 } },
      { ...group, slot: 4, _count: { _all: 1 } },
      { ...group, slot: 8, videoId: "other", _count: { _all: 1 } },
      {
        ...group,
        slot: 3,
        songKey: "different-artist",
        artist: "別の歌手",
        _count: { _all: 1 },
      },
    ]);
    const result = await getBestNineResults(id, "owner");
    expect(result).toMatchObject({
      responseCount: 2,
      guestCount: 1,
      accountCount: 1,
    });
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0]).toMatchObject({
      answerCount: 4,
      rankings: [
        {
          songKey: "same-song",
          count: 3,
          performances: [
            { videoId: "video", start: "10", count: 2 },
            { videoId: "other", start: "10", count: 1 },
          ],
        },
        { songKey: "different-artist", count: 1 },
      ],
    });
  });

  it("順不同のお題で回答がない場合も集計は1つだけ返す", async () => {
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      revisions: [{ ...revision, themes: emptyThemes() }],
    });
    const result = await getBestNineResults(id, "owner");
    expect(result.slots).toEqual([
      { slot: 0, theme: "", answerCount: 0, rankings: [] },
    ]);
    expect(db.bestNineResponseEntry.groupBy).not.toHaveBeenCalled();
  });

  it("枠名が空でもカテゴリ制限があれば枠別集計を維持する", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    db.bestNineTopic.findUnique.mockResolvedValue({
      ...topic,
      revisions: [{ ...revision, themes: emptyThemes(), slotCategories }],
    });
    expect((await getBestNineResults(id, "owner")).slots).toHaveLength(9);
  });

  it("回答がないお題は全枠0件で、歌唱の集計クエリを実行しない", async () => {
    const result = await getBestNineResults(id, "owner");
    expect(result).toMatchObject({
      responseCount: 0,
      accountCount: 0,
      guestCount: 0,
    });
    expect(result.slots).toHaveLength(9);
    expect(
      result.slots.every(
        (slot) => slot.answerCount === 0 && slot.rankings.length === 0,
      ),
    ).toBe(true);
    expect(db.bestNineResponseEntry.groupBy).not.toHaveBeenCalled();
  });

  it("公開回答に回答者のGoogle IDや匿名識別子を含めない", async () => {
    db.bestNineResponse.findUnique.mockResolvedValue({
      id: "response-id",
      selection: { title: "題", songs: [{ v: "video", s: "10" }] },
      createdAt: new Date("2026-10-27"),
      revision: { topicId: id, version: 1 },
    });
    const result = await loadBestNineResponse("response-id");
    expect(result?.selection).toMatchObject({ topicId: id, topicVersion: 1 });
    expect(
      db.bestNineResponse.findUnique.mock.calls[0][0].select,
    ).not.toHaveProperty("userId");
    expect(
      db.bestNineResponse.findUnique.mock.calls[0][0].select,
    ).not.toHaveProperty("respondentKey");
  });
});
