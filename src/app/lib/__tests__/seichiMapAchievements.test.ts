import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const db = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  });
  const client = {
    seichiMapAchievement: model(),
    seichiMapAchievementLocationOverride: model(),
    seichiMapLocationSnapshot: model(),
    seichiMapAchievementSyncState: model(),
    seichiMapUserAchievement: model(),
    seichiMapVisited: model(),
    seichiMapIdentityRegistry: model(),
    seichiMapUserTitle: model(),
    seichiMapShare: model(),
    seichiMapAchievementTier: model(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  return client;
});
vi.mock("../prisma", () => ({ prisma: db }));
const { userCountMock } = vi.hoisted(() => ({ userCountMock: vi.fn() }));
vi.mock("../seichiMapVisitedSheet", () => ({
  loadSeichiMapUserCount: userCountMock,
}));

import {
  backfillSeichiMapUserAchievements,
  computeSeichiMapAchievementSyncHash,
  evaluateSeichiMapUserAchievements,
  loadSeichiMapAchievementTargetLocationIds,
  loadSeichiMapUserAchievementSummary,
  loadSeichiMapRankingBadges,
  loadSharedSeichiMapAchievementSummary,
  setSeichiMapUserTitle,
  syncSeichiMapAchievementLocations,
  syncSeichiMapAchievementsIfChanged,
} from "../server/seichiMapAchievements";
import { parseSeichiMapKml } from "../seichiMap";

const LOCATION_A = "aaaaaaaaaaaaaaaa";
const LOCATION_B = "bbbbbbbbbbbbbbbb";

const achievementRecord = (
  id: string,
  criteria: unknown[],
  tiers: {
    level: number;
    thresholdType: string;
    thresholdValue: number;
    rarity?: string;
  }[],
) => ({
  id,
  sortOrder: 10,
  nameJa: `バッジ${id}`,
  nameEn: null,
  descriptionJa: null,
  descriptionEn: null,
  metric: "LOCATION_COUNT",
  criteria,
  denominatorOverride: null,
  isActive: true,
  tiers: tiers.map((tier) => ({ rarity: "N", ...tier, achievementId: id })),
});

let stateVersion = 1;

const setupEvaluationState = () => {
  db.seichiMapAchievementSyncState.findUnique.mockImplementation(async () => ({
    key: "azki",
    version: stateVersion,
    kmlHash: "h".repeat(64),
    locationCount: 2,
    syncedAt: new Date("2026-11-26T00:00:00Z"),
    syncedBy: "admin",
    lockedUntil: null,
  }));
  db.seichiMapAchievement.findMany.mockResolvedValue([
    achievementRecord(
      "all",
      [],
      [
        { level: 1, thresholdType: "COUNT", thresholdValue: 1 },
        { level: 2, thresholdType: "COUNT", thresholdValue: 2, rarity: "R" },
      ],
    ),
    achievementRecord(
      "layer",
      [{ layers: ["ホロメンマップ"] }],
      [
        {
          level: 1,
          thresholdType: "PERCENT",
          thresholdValue: 100,
          rarity: "UR",
        },
      ],
    ),
  ]);
  db.seichiMapAchievementLocationOverride.findMany.mockResolvedValue([]);
  db.seichiMapLocationSnapshot.findMany.mockResolvedValue([
    {
      locationId: LOCATION_A,
      folder: "ホロメンマップ",
      name: "湊駅",
      region: "DOMESTIC",
      prefectureCode: "13",
    },
    {
      locationId: LOCATION_B,
      folder: "その他",
      name: "地点B",
      region: "DOMESTIC",
      prefectureCode: "27",
    },
  ]);
};

describe("seichi map achievements server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // スナップショットのキャッシュを他のテストと共有しないよう版を進める。
    stateVersion += 1;
    setupEvaluationState();
    db.seichiMapUserAchievement.createMany.mockImplementation(
      async ({ data }: { data: unknown[] }) => ({ count: data.length }),
    );
    db.seichiMapUserAchievement.groupBy.mockResolvedValue([]);
    db.seichiMapUserTitle.findUnique.mockResolvedValue(null);
    userCountMock.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("新しく達成したグレードだけを追加して返す", async () => {
    db.seichiMapVisited.findMany.mockResolvedValue([
      { locationId: LOCATION_A },
      { locationId: LOCATION_B },
    ]);
    db.seichiMapUserAchievement.findMany.mockResolvedValue([
      { achievementId: "all", level: 1 },
    ]);

    const unlocked = await evaluateSeichiMapUserAchievements("user-1", "LIVE");

    expect(db.seichiMapUserAchievement.createMany).toHaveBeenCalledTimes(1);
    expect(db.seichiMapUserAchievement.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          achievementId: "all",
          level: 2,
          source: "LIVE",
          progressCount: 2,
          denominatorAtAward: null,
        },
        {
          userId: "user-1",
          achievementId: "layer",
          level: 1,
          source: "LIVE",
          progressCount: 1,
          denominatorAtAward: 1,
        },
      ],
      skipDuplicates: true,
    });
    expect(unlocked).toEqual([
      expect.objectContaining({
        achievementId: "all",
        level: 2,
        name: { ja: "バッジall", en: null },
        source: "LIVE",
      }),
      expect.objectContaining({ achievementId: "layer", level: 1 }),
    ]);
    expect(db.seichiMapUserAchievement.deleteMany).not.toHaveBeenCalled();
  });

  it("条件を満たさなくなっても獲得済みのグレードを削除しない", async () => {
    db.seichiMapVisited.findMany.mockResolvedValue([]);
    db.seichiMapUserAchievement.findMany.mockResolvedValue([
      { achievementId: "all", level: 1 },
      { achievementId: "all", level: 2 },
    ]);

    await expect(
      evaluateSeichiMapUserAchievements("user-1", "LIVE"),
    ).resolves.toEqual([]);
    expect(db.seichiMapUserAchievement.createMany).not.toHaveBeenCalled();
    expect(db.seichiMapUserAchievement.deleteMany).not.toHaveBeenCalled();
    expect(db.seichiMapUserAchievement.updateMany).not.toHaveBeenCalled();
  });

  it("同期前は判定しない", async () => {
    db.seichiMapAchievementSyncState.findUnique.mockResolvedValue(null);

    await expect(
      evaluateSeichiMapUserAchievements("user-1", "LIVE"),
    ).resolves.toEqual([]);
    await expect(
      loadSeichiMapUserAchievementSummary("user-1"),
    ).resolves.toEqual({
      ready: false,
      profile: null,
      items: [],
      unseen: [],
    });
    expect(db.seichiMapVisited.findMany).not.toHaveBeenCalled();
  });

  describe("バッジの対象地点", () => {
    it("達成条件の対象になっている地点の ID だけを返す", async () => {
      expect(await loadSeichiMapAchievementTargetLocationIds("layer")).toEqual([
        LOCATION_A,
      ]);
      expect(
        (await loadSeichiMapAchievementTargetLocationIds("all"))?.sort(),
      ).toEqual([LOCATION_A, LOCATION_B]);
    });

    it("存在しないバッジは null", async () => {
      expect(
        await loadSeichiMapAchievementTargetLocationIds("missing"),
      ).toBeNull();
    });

    it("同期前は null", async () => {
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue(null);
      expect(await loadSeichiMapAchievementTargetLocationIds("all")).toBeNull();
    });
  });

  it("一覧では進捗と未通知の獲得分を返す", async () => {
    db.seichiMapVisited.findMany.mockResolvedValue([
      { locationId: LOCATION_B },
    ]);
    db.seichiMapUserAchievement.findMany
      .mockResolvedValueOnce([{ achievementId: "all", level: 1 }])
      .mockResolvedValueOnce([
        {
          userId: "user-1",
          achievementId: "all",
          level: 1,
          achievedAt: new Date("2026-11-26T01:00:00Z"),
          source: "BACKFILL",
          progressCount: 1,
          denominatorAtAward: null,
          seenAt: null,
        },
      ]);

    const summary = await loadSeichiMapUserAchievementSummary("user-1");

    expect(summary.ready).toBe(true);
    expect(summary.items[0]).toMatchObject({
      id: "all",
      progressCount: 1,
      denominator: 2,
      targetsAll: true,
      tiers: [
        { level: 1, requiredCount: 1, achievedAt: "2026-11-26T01:00:00.000Z" },
        { level: 2, requiredCount: 2, achievedAt: null },
      ],
    });
    expect(summary.items[1]).toMatchObject({
      id: "layer",
      progressCount: 0,
      denominator: 1,
      targetsAll: false,
    });
    expect(summary.unseen).toEqual([
      expect.objectContaining({
        achievementId: "all",
        level: 1,
        source: "BACKFILL",
      }),
    ]);
  });

  describe("プレイヤーカード", () => {
    const awards = [
      {
        userId: "user-1",
        achievementId: "all",
        level: 1,
        achievedAt: new Date("2026-11-01T00:00:00Z"),
        seenAt: new Date(),
      },
      {
        userId: "user-1",
        achievementId: "all",
        level: 2,
        achievedAt: new Date("2026-11-02T00:00:00Z"),
        seenAt: new Date(),
      },
      {
        userId: "user-1",
        achievementId: "layer",
        level: 1,
        achievedAt: new Date("2026-11-03T00:00:00Z"),
        seenAt: new Date(),
      },
    ];

    beforeEach(() => {
      db.seichiMapVisited.findMany.mockResolvedValue([
        { locationId: LOCATION_A },
        { locationId: LOCATION_B },
      ]);
      db.seichiMapUserAchievement.findMany.mockResolvedValue(awards);
      db.seichiMapUserAchievement.groupBy.mockResolvedValue([
        { achievementId: "all", level: 1, _count: { _all: 4 } },
        { achievementId: "layer", level: 1, _count: { _all: 1 } },
      ]);
      userCountMock.mockResolvedValue(4);
    });

    it("レア度からポイントとレベルを計算し、最もレアなグレードを称号にする", async () => {
      const { profile, items } =
        await loadSeichiMapUserAchievementSummary("user-1");

      // N(10) + R(30) + UR(500) = 540 → Lv.7（480〜629）
      expect(profile).toEqual({
        points: 540,
        level: 7,
        currentLevelPoints: 60,
        levelSpan: 150,
        earnedCount: 3,
        totalCount: 3,
        rarityCounts: { N: 1, R: 1, SR: 0, SSR: 0, UR: 1 },
        title: {
          achievementId: "layer",
          name: { ja: "バッジlayer", en: null },
          metric: "LOCATION_COUNT",
          level: 1,
          thresholdType: "PERCENT",
          thresholdValue: 100,
          rarity: "UR",
          holderRate: 0.25,
        },
        titleSelected: false,
      });
      expect(items[0].tiers.map((tier) => tier.holderRate)).toEqual([1, null]);
      expect(items[1].tiers[0]).toMatchObject({
        rarity: "UR",
        holderRate: 0.25,
      });
    });

    it("本人が選んだ称号を優先し、獲得していなければ自動に戻す", async () => {
      db.seichiMapUserTitle.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        achievementId: "all",
        level: 1,
      });
      const selected = await loadSeichiMapUserAchievementSummary("user-1");
      expect(selected.profile).toMatchObject({
        title: { achievementId: "all", level: 1, rarity: "N" },
        titleSelected: true,
      });

      db.seichiMapUserTitle.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        achievementId: "missing",
        level: 1,
      });
      const fallback = await loadSeichiMapUserAchievementSummary("user-1");
      expect(fallback.profile).toMatchObject({
        title: { achievementId: "layer" },
        titleSelected: false,
      });
    });

    it("共有マップでは持ち主の状況を返し、判定や書き込みはしない", async () => {
      db.seichiMapShare.findUnique.mockResolvedValueOnce(null);
      await expect(
        loadSharedSeichiMapAchievementSummary("missing"),
      ).resolves.toBeNull();

      db.seichiMapShare.findUnique.mockResolvedValueOnce({
        userId: "owner-1",
      });
      const summary = await loadSharedSeichiMapAchievementSummary("share-1");

      expect(summary).toMatchObject({
        ready: true,
        profile: { points: 540, level: 7 },
        unseen: [],
      });
      expect(db.seichiMapUserAchievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "owner-1" } }),
      );
      expect(db.seichiMapUserAchievement.createMany).not.toHaveBeenCalled();
    });
  });

  it("ランキングのユーザーごとにレベルと称号をまとめて求める", async () => {
    db.seichiMapUserAchievement.findMany.mockResolvedValue([
      {
        userId: "user-1",
        achievementId: "all",
        level: 1,
        achievedAt: new Date("2026-11-01T00:00:00Z"),
      },
      {
        userId: "user-1",
        achievementId: "layer",
        level: 1,
        achievedAt: new Date("2026-11-02T00:00:00Z"),
      },
      {
        userId: "user-2",
        achievementId: "all",
        level: 1,
        achievedAt: new Date("2026-11-03T00:00:00Z"),
      },
    ]);
    db.seichiMapUserTitle.findMany.mockResolvedValue([
      { userId: "user-1", achievementId: "all", level: 1 },
    ]);

    const badges = await loadSeichiMapRankingBadges([
      "user-1",
      "user-2",
      "user-3",
      "user-1",
    ]);

    expect(db.seichiMapUserAchievement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: { in: ["user-1", "user-2", "user-3"] } },
      }),
    );
    expect(badges.get("user-1")).toMatchObject({
      points: 510,
      level: 7,
      title: { achievementId: "all", level: 1 },
    });
    expect(badges.get("user-2")).toMatchObject({
      points: 10,
      level: 1,
      title: { achievementId: "all" },
    });
    expect(badges.has("user-3")).toBe(false);
    await expect(loadSeichiMapRankingBadges([])).resolves.toEqual(new Map());
  });

  describe("称号の設定", () => {
    it("null なら自動選択に戻す", async () => {
      await expect(setSeichiMapUserTitle("user-1", null)).resolves.toBe(true);
      expect(db.seichiMapUserTitle.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });

    it("獲得していないグレードは設定できない", async () => {
      db.seichiMapUserAchievement.findUnique.mockResolvedValue(null);
      db.seichiMapAchievementTier.findFirst.mockResolvedValue({ level: 1 });

      await expect(
        setSeichiMapUserTitle("user-1", { achievementId: "all", level: 2 }),
      ).resolves.toBe(false);
      expect(db.seichiMapUserTitle.upsert).not.toHaveBeenCalled();
    });

    it("無効になったバッジのグレードは設定できない", async () => {
      db.seichiMapUserAchievement.findUnique.mockResolvedValue({ level: 1 });
      db.seichiMapAchievementTier.findFirst.mockResolvedValue(null);

      await expect(
        setSeichiMapUserTitle("user-1", { achievementId: "old", level: 1 }),
      ).resolves.toBe(false);
      expect(db.seichiMapUserTitle.upsert).not.toHaveBeenCalled();
    });

    it("獲得済みのグレードを称号に設定する", async () => {
      db.seichiMapUserAchievement.findUnique.mockResolvedValue({ level: 1 });
      db.seichiMapAchievementTier.findFirst.mockResolvedValue({ level: 1 });

      await expect(
        setSeichiMapUserTitle("user-1", { achievementId: "all", level: 1 }),
      ).resolves.toBe(true);
      expect(db.seichiMapUserTitle.upsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: { userId: "user-1", achievementId: "all", level: 1 },
        update: { achievementId: "all", level: 1 },
      });
    });
  });

  it("一括判定は1回のクエリで全ユーザーを処理し、分割して書き込む", async () => {
    const users = Array.from({ length: 1_100 }, (_, index) => `user-${index}`);
    db.$queryRaw.mockResolvedValue(
      users.map((userId) => ({ userId, locationId: LOCATION_B })),
    );
    db.seichiMapUserAchievement.findMany.mockResolvedValue([
      { userId: "user-0", achievementId: "all", level: 1 },
    ]);

    await expect(backfillSeichiMapUserAchievements()).resolves.toBe(1_099);

    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.seichiMapVisited.findMany).not.toHaveBeenCalled();
    const calls = db.seichiMapUserAchievement.createMany.mock.calls;
    expect(calls.map(([args]) => args.data.length)).toEqual([1_000, 99]);
    expect(calls[0][0]).toMatchObject({ skipDuplicates: true });
    expect(calls[0][0].data[0]).toMatchObject({
      userId: "user-1",
      source: "BACKFILL",
    });
  });

  describe("同期", () => {
    const kml = `<kml><Document><Folder><name>ホロメンマップ</name><Placemark><name>湊駅</name><Point><coordinates>139.7,35.6,0</coordinates></Point></Placemark></Folder></Document></kml>`;
    const registry = { identities: [], version: 3, updatedAt: null };
    const locations = parseSeichiMapKml(kml, []);

    it("ハッシュは KML の本文ではなく地点の項目と並び順に依存しない値で作る", () => {
      const other = {
        ...locations[0],
        id: "ffffffffffffffff",
        name: "別地点",
      };
      expect(
        computeSeichiMapAchievementSyncHash([locations[0], other], 3),
      ).toBe(computeSeichiMapAchievementSyncHash([other, locations[0]], 3));
      expect(
        computeSeichiMapAchievementSyncHash(
          [{ ...locations[0], description: "説明だけ変更" }],
          3,
        ),
      ).toBe(computeSeichiMapAchievementSyncHash(locations, 3));
      expect(computeSeichiMapAchievementSyncHash(locations, 4)).not.toBe(
        computeSeichiMapAchievementSyncHash(locations, 3),
      );
      expect(
        computeSeichiMapAchievementSyncHash(
          [{ ...locations[0], name: "改名" }],
          3,
        ),
      ).not.toBe(computeSeichiMapAchievementSyncHash(locations, 3));
      expect(computeSeichiMapAchievementSyncHash(locations, 3, false)).not.toBe(
        computeSeichiMapAchievementSyncHash(locations, 3),
      );
    });

    it("ハッシュが同じなら同期しない", async () => {
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue({
        key: "azki",
        version: 2,
        kmlHash: computeSeichiMapAchievementSyncHash(locations, 3),
        lockedUntil: null,
      });

      await expect(
        syncSeichiMapAchievementsIfChanged({ kml, registry, locations }),
      ).resolves.toBeNull();
      expect(db.seichiMapAchievementSyncState.create).not.toHaveBeenCalled();
      expect(
        db.seichiMapAchievementSyncState.updateMany,
      ).not.toHaveBeenCalled();
    });

    it.each([
      ["同期状態が無い", null],
      [
        "初回の同期が完了していない",
        { key: "azki", version: 0, kmlHash: "0".repeat(64), lockedUntil: null },
      ],
    ])("%s場合は自動では同期を始めない", async (_label, state) => {
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue(state);

      await expect(
        syncSeichiMapAchievementsIfChanged({ kml, registry, locations }),
      ).resolves.toBeNull();
      expect(db.seichiMapAchievementSyncState.create).not.toHaveBeenCalled();
      expect(
        db.seichiMapAchievementSyncState.updateMany,
      ).not.toHaveBeenCalled();
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("別の同期が実行中なら何もしない", async () => {
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue({
        key: "azki",
        version: 2,
        kmlHash: "x".repeat(64),
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(
        syncSeichiMapAchievementsIfChanged({ kml, registry, locations }),
      ).resolves.toBeNull();
      expect(db.seichiMapAchievementSyncState.create).not.toHaveBeenCalled();
    });

    it("同期済みで地点が変わっていれば自動で同期する", async () => {
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue({
        key: "azki",
        version: 2,
        kmlHash: "x".repeat(64),
        lockedUntil: null,
      });
      db.seichiMapAchievementSyncState.create.mockRejectedValue({
        code: "P2002",
      });
      // 別の処理がリースを持っている状態にして、同期の開始だけを確認する。
      db.seichiMapAchievementSyncState.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        syncSeichiMapAchievementsIfChanged({ kml, registry, locations }),
      ).resolves.toBeNull();
      expect(db.seichiMapAchievementSyncState.create).toHaveBeenCalledTimes(1);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("リースを取得してスナップショットを置き換え、全ユーザーを再判定する", async () => {
      const gsiFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: { muniCd: "13101" } })),
        );
      vi.stubGlobal("fetch", gsiFetch);
      db.seichiMapAchievementSyncState.create.mockResolvedValue({
        key: "azki",
        version: 0,
        kmlHash: "0".repeat(64),
        lockedUntil: new Date(),
      });
      db.seichiMapLocationSnapshot.findMany.mockResolvedValueOnce([]);
      db.$transaction.mockImplementation(
        async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
      );
      db.seichiMapAchievementSyncState.updateMany.mockResolvedValue({
        count: 1,
      });
      db.$queryRaw.mockResolvedValue([]);
      db.seichiMapUserAchievement.findMany.mockResolvedValue([]);

      const result = await syncSeichiMapAchievementLocations({
        syncedBy: "admin",
        kml,
        registry,
      });

      expect(result).toEqual({
        version: 1,
        locationCount: 1,
        geocodePendingCount: 0,
        awardedCount: 0,
      });
      expect(gsiFetch).toHaveBeenCalledTimes(1);
      expect(db.seichiMapLocationSnapshot.deleteMany).toHaveBeenCalledWith({});
      expect(
        db.seichiMapLocationSnapshot.createMany.mock.calls[0][0].data[0],
      ).toMatchObject({
        folder: "ホロメンマップ",
        name: "湊駅",
        region: "DOMESTIC",
        prefectureCode: "13",
      });
      expect(db.seichiMapAchievementSyncState.updateMany).toHaveBeenCalledWith({
        where: { key: "azki", version: 0 },
        data: expect.objectContaining({
          version: 1,
          kmlHash: computeSeichiMapAchievementSyncHash(locations, 3),
          syncedBy: "admin",
        }),
      });
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      // 最後にリースを解放する
      expect(
        db.seichiMapAchievementSyncState.updateMany,
      ).toHaveBeenLastCalledWith({
        where: { key: "azki" },
        data: { lockedUntil: null },
      });
    });

    it("座標が同じ地点は前回の判定結果を使い、逆ジオコーダを呼ばない", async () => {
      const gsiFetch = vi.fn();
      vi.stubGlobal("fetch", gsiFetch);
      db.seichiMapAchievementSyncState.create.mockRejectedValue({
        code: "P2002",
      });
      db.seichiMapAchievementSyncState.updateMany.mockResolvedValue({
        count: 1,
      });
      db.seichiMapAchievementSyncState.findUnique.mockResolvedValue({
        key: "azki",
        version: 4,
        kmlHash: "x".repeat(64),
        lockedUntil: new Date(),
      });
      db.seichiMapLocationSnapshot.findMany.mockResolvedValue([]);
      const previousRows = (await import("../seichiMap")).parseSeichiMapKml(
        kml,
        [],
      );
      db.seichiMapLocationSnapshot.findMany.mockResolvedValueOnce([
        {
          locationId: previousRows[0].id,
          latitude: 35.6,
          longitude: 139.7,
          region: "DOMESTIC",
          prefectureCode: "13",
          geocodedAt: new Date("2026-11-01T00:00:00Z"),
        },
      ]);
      db.$transaction.mockImplementation(
        async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
      );
      db.$queryRaw.mockResolvedValue([]);
      db.seichiMapUserAchievement.findMany.mockResolvedValue([]);

      const result = await syncSeichiMapAchievementLocations({
        syncedBy: "auto",
        kml,
        registry,
      });

      expect(gsiFetch).not.toHaveBeenCalled();
      expect(result).toMatchObject({ version: 5, geocodePendingCount: 0 });
      expect(
        db.seichiMapLocationSnapshot.createMany.mock.calls[0][0].data[0],
      ).toMatchObject({
        prefectureCode: "13",
        geocodedAt: new Date("2026-11-01T00:00:00Z"),
      });
    });
  });
});
