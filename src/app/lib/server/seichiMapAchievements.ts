import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "../prisma";
import {
  lookupGsiMunicipalityCode,
  type SeichiMapLocation,
} from "../seichiMap";
import {
  geocodeSeichiMapPoints,
  type SeichiMapGeocodeResult,
} from "../seichiMapGeocoding";
import {
  buildSeichiMapAchievementTargets,
  computeSeichiMapAchievementProgress,
  computeSeichiMapEligibleTiers,
  createSeichiMapAchievementEvaluationContext,
  findSeichiMapOverlappingTierLevels,
  getSeichiMapAchievementRequiredCount,
  getSeichiMapActiveTiers,
  parseSeichiMapAchievementCriteria,
  type SeichiMapAchievementEvaluationContext,
  type SeichiMapAchievementLocation,
  type SeichiMapAchievementMaster,
  type SeichiMapEligibleTier,
} from "../seichiMapAchievementRules";
import {
  fetchSeichiMapKmlText,
  loadSeichiMapIdentityRegistry,
  parseValidatedSeichiMapKml,
  SeichiMapIdentityError,
} from "./seichiMapIdentityRegistry";
import {
  compareSeichiMapTitleCandidates,
  getSeichiMapLevelProgress,
  SEICHI_MAP_RARITY_ORDER,
  SEICHI_MAP_RARITY_POINTS,
} from "../seichiMapAchievementLevel";
import { loadSeichiMapUserCount } from "../seichiMapVisitedSheet";
import type {
  SeichiMapAchievementErrorCode,
  SeichiMapAchievementProfile,
  SeichiMapAchievementRarityName,
  SeichiMapAchievementsResponse,
  SeichiMapAchievementTitle,
  SeichiMapRankingBadge,
  SeichiMapTitleSelection,
  SeichiMapAchievementSyncPreview,
  SeichiMapLocalizedText,
  SeichiMapUnlockedAchievement,
} from "../../types/seichiMapAchievements";

const SYNC_KEY = "azki";
const SYNC_LEASE_MS = 5 * 60_000;
/** ルートの maxDuration（60秒）に収まるよう、KML取得や書き込みの時間を残す。 */
const GEOCODE_BUDGET_MS = 20_000;
const GEOCODE_REQUEST_TIMEOUT_MS = 10_000;
const WRITE_CHUNK_SIZE = 1_000;

type AchievementSource = "LIVE" | "BACKFILL";

export class SeichiMapAchievementError extends Error {
  constructor(
    public code: SeichiMapAchievementErrorCode,
    public status: number,
  ) {
    super(code);
  }
}

export type LoadedSeichiMapAchievement = SeichiMapAchievementMaster & {
  name: SeichiMapLocalizedText;
  description: SeichiMapLocalizedText | null;
};

type EvaluationState = {
  version: number;
  achievements: LoadedSeichiMapAchievement[];
  context: SeichiMapAchievementEvaluationContext;
};

type SyncStateRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.seichiMapAchievementSyncState.findUnique>>
>;

/**
 * バッジ判定に使う地点の項目と地点ID登録の版から、同期の状態を表すハッシュを作る。
 * KML の本文は取得のたびに変わるため、本文ではなく解析結果から作る。
 * 説明文だけの編集では再同期しない。
 * ジオコーディングが途中のときは別の値を保存し、次のマップ表示で続きを処理させる。
 */
export const computeSeichiMapAchievementSyncHash = (
  locations: readonly Pick<
    SeichiMapLocation,
    "id" | "folder" | "name" | "latitude" | "longitude"
  >[],
  registryVersion: number,
  complete = true,
) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        registryVersion,
        complete,
        locations: locations
          .map(({ id, folder, name, latitude, longitude }) => [
            id,
            folder,
            name,
            latitude,
            longitude,
          ])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      }),
    )
    .digest("hex");

const chunk = <T>(items: readonly T[], size = WRITE_CHUNK_SIZE) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const isValidTier = (tier: {
  level: number;
  thresholdType: string;
  thresholdValue: number;
  rarity: string;
}) =>
  SEICHI_MAP_RARITY_ORDER.includes(
    tier.rarity as SeichiMapAchievementRarityName,
  ) &&
  Number.isSafeInteger(tier.level) &&
  tier.level >= 1 &&
  Number.isSafeInteger(tier.thresholdValue) &&
  tier.thresholdValue >= 1 &&
  (tier.thresholdType === "COUNT" ||
    (tier.thresholdType === "PERCENT" && tier.thresholdValue <= 100));

export async function loadSeichiMapAchievements(): Promise<
  LoadedSeichiMapAchievement[]
> {
  const [records, overrides] = await Promise.all([
    prisma.seichiMapAchievement.findMany({
      where: { isActive: true },
      include: { tiers: { orderBy: { level: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.seichiMapAchievementLocationOverride.findMany(),
  ]);
  const overridesByAchievement = new Map<string, Map<string, boolean>>();
  for (const override of overrides) {
    const map =
      overridesByAchievement.get(override.achievementId) ??
      new Map<string, boolean>();
    map.set(override.locationId, override.include);
    overridesByAchievement.set(override.achievementId, map);
  }

  return records.flatMap((record) => {
    try {
      const criteria = parseSeichiMapAchievementCriteria(record.criteria);
      if (record.tiers.length === 0 || !record.tiers.every(isValidTier)) {
        throw new Error("invalid tiers");
      }
      if (
        record.denominatorOverride !== null &&
        (!Number.isSafeInteger(record.denominatorOverride) ||
          record.denominatorOverride < 1)
      ) {
        throw new Error("invalid denominatorOverride");
      }
      return [
        {
          id: record.id,
          metric: record.metric,
          criteria,
          denominatorOverride: record.denominatorOverride,
          tiers: record.tiers.map((tier) => ({
            level: tier.level,
            thresholdType: tier.thresholdType,
            thresholdValue: tier.thresholdValue,
            rarity: tier.rarity,
          })),
          overrides: overridesByAchievement.get(record.id),
          name: { ja: record.nameJa, en: record.nameEn },
          description: record.descriptionJa
            ? { ja: record.descriptionJa, en: record.descriptionEn }
            : null,
        },
      ];
    } catch (error) {
      // 1件のマスタ不備で訪問登録や他のバッジの判定を止めない。
      console.error(
        `Skipping invalid seichi map achievement master: ${record.id}`,
        error,
      );
      return [];
    }
  });
}

let snapshotCache:
  | { version: number; locations: Promise<SeichiMapAchievementLocation[]> }
  | undefined;

const loadSnapshotLocations = (version: number) => {
  if (snapshotCache?.version !== version) {
    const locations = prisma.seichiMapLocationSnapshot
      .findMany({
        select: {
          locationId: true,
          folder: true,
          name: true,
          region: true,
          prefectureCode: true,
        },
      })
      .catch((error) => {
        if (snapshotCache?.locations === locations) snapshotCache = undefined;
        throw error;
      });
    snapshotCache = { version, locations };
  }
  return snapshotCache.locations;
};

async function loadEvaluationState(): Promise<EvaluationState | null> {
  const state = await prisma.seichiMapAchievementSyncState.findUnique({
    where: { key: SYNC_KEY },
  });
  if (!state || state.version < 1) return null;
  const [achievements, locations] = await Promise.all([
    loadSeichiMapAchievements(),
    loadSnapshotLocations(state.version),
  ]);
  return {
    version: state.version,
    achievements,
    context: createSeichiMapAchievementEvaluationContext(
      achievements,
      locations,
    ),
  };
}

const tierKey = (achievementId: string, level: number) =>
  `${achievementId}\n${level}`;

const toUnlocked = (
  achievements: readonly LoadedSeichiMapAchievement[],
  rows: readonly {
    achievementId: string;
    level: number;
    source: AchievementSource;
  }[],
): SeichiMapUnlockedAchievement[] => {
  const byId = new Map(
    achievements.map((achievement) => [achievement.id, achievement]),
  );
  return rows.flatMap((row) => {
    const achievement = byId.get(row.achievementId);
    const tier = achievement?.tiers.find(({ level }) => level === row.level);
    if (!achievement || !tier) return [];
    return [
      {
        achievementId: row.achievementId,
        name: achievement.name,
        metric: achievement.metric,
        level: row.level,
        thresholdType: tier.thresholdType,
        thresholdValue: tier.thresholdValue,
        rarity: tier.rarity,
        source: row.source,
      },
    ];
  });
};

const insertAwards = async (
  rows: readonly (SeichiMapEligibleTier & { userId: string })[],
  source: AchievementSource,
) => {
  let inserted = 0;
  for (const part of chunk(rows)) {
    const result = await prisma.seichiMapUserAchievement.createMany({
      data: part.map((row) => ({
        userId: row.userId,
        achievementId: row.achievementId,
        level: row.level,
        source,
        progressCount: row.progressCount,
        denominatorAtAward: row.denominatorAtAward,
      })),
      skipDuplicates: true,
    });
    inserted += result.count;
  }
  return inserted;
};

const loadVisitedLocationIds = async (userId: string) => {
  const rows = await prisma.seichiMapVisited.findMany({
    where: { userId, locationId: { not: null } },
    select: { locationId: true },
    distinct: ["locationId"],
  });
  return new Set(
    rows.flatMap(({ locationId }) => (locationId ? [locationId] : [])),
  );
};

async function evaluateWithState(
  evaluation: EvaluationState,
  userId: string,
  source: AchievementSource,
) {
  const [visitedLocationIds, existing] = await Promise.all([
    loadVisitedLocationIds(userId),
    prisma.seichiMapUserAchievement.findMany({
      where: { userId },
      select: { achievementId: true, level: true },
    }),
  ]);
  const existingKeys = new Set(
    existing.map((row) => tierKey(row.achievementId, row.level)),
  );
  const newTiers = computeSeichiMapEligibleTiers(
    evaluation.context,
    visitedLocationIds,
  ).filter(
    (tier) => !existingKeys.has(tierKey(tier.achievementId, tier.level)),
  );
  if (newTiers.length > 0) {
    await insertAwards(
      newTiers.map((tier) => ({ ...tier, userId })),
      source,
    );
  }
  return { visitedLocationIds, newTiers };
}

/**
 * 1ユーザーの達成状況を判定し、新しく獲得したグレードを保存して返す。
 * 獲得済みのグレードは条件を満たさなくなっても削除しない。
 */
export async function evaluateSeichiMapUserAchievements(
  userId: string,
  source: AchievementSource,
): Promise<SeichiMapUnlockedAchievement[]> {
  const evaluation = await loadEvaluationState();
  if (!evaluation) return [];
  const { newTiers } = await evaluateWithState(evaluation, userId, source);
  return toUnlocked(
    evaluation.achievements,
    newTiers.map((tier) => ({ ...tier, source })),
  );
}

/** 全ユーザーを1回のクエリでまとめて判定する。 */
export async function backfillSeichiMapUserAchievements(
  evaluation?: EvaluationState,
): Promise<number> {
  const state = evaluation ?? (await loadEvaluationState());
  if (!state) return 0;
  const [pairs, existing] = await Promise.all([
    prisma.$queryRaw<{ userId: string; locationId: string }[]>`
      SELECT DISTINCT userId, locationId
      FROM SeichiMapVisited
      WHERE locationId IS NOT NULL AND locationId <> ''
    `,
    prisma.seichiMapUserAchievement.findMany({
      select: { userId: true, achievementId: true, level: true },
    }),
  ]);
  const visitedByUser = new Map<string, Set<string>>();
  for (const { userId, locationId } of pairs) {
    const ids = visitedByUser.get(userId) ?? new Set<string>();
    ids.add(locationId);
    visitedByUser.set(userId, ids);
  }
  const existingKeys = new Set(
    existing.map(
      (row) => `${row.userId}\n${tierKey(row.achievementId, row.level)}`,
    ),
  );
  const rows: (SeichiMapEligibleTier & { userId: string })[] = [];
  for (const [userId, visitedLocationIds] of visitedByUser) {
    for (const tier of computeSeichiMapEligibleTiers(
      state.context,
      visitedLocationIds,
    )) {
      if (
        !existingKeys.has(
          `${userId}\n${tierKey(tier.achievementId, tier.level)}`,
        )
      ) {
        rows.push({ ...tier, userId });
      }
    }
  }
  return rows.length > 0 ? insertAwards(rows, "BACKFILL") : 0;
}

const NOT_READY: SeichiMapAchievementsResponse = {
  ready: false,
  profile: null,
  items: [],
  unseen: [],
};

/** 各グレードを持つユーザーの割合。分母はバッジ判定の対象（訪問ログのあるユーザー）。 */
async function loadHolderRates(): Promise<Map<string, number>> {
  const [groups, userCount] = await Promise.all([
    prisma.seichiMapUserAchievement.groupBy({
      by: ["achievementId", "level"],
      _count: { _all: true },
    }),
    loadSeichiMapUserCount(),
  ]);
  if (userCount < 1) return new Map();
  return new Map(
    groups.map((group) => [
      tierKey(group.achievementId, group.level),
      Math.min(1, group._count._all / userCount),
    ]),
  );
}

type AwardRow = Awaited<
  ReturnType<typeof prisma.seichiMapUserAchievement.findMany>
>[number];

const emptyRarityCounts = () =>
  Object.fromEntries(
    SEICHI_MAP_RARITY_ORDER.map((rarity) => [rarity, 0]),
  ) as Record<SeichiMapAchievementRarityName, number>;

export function buildSeichiMapAchievementProfile(
  achievements: readonly LoadedSeichiMapAchievement[],
  awards: readonly Pick<AwardRow, "achievementId" | "level" | "achievedAt">[],
  holderRates: ReadonlyMap<string, number>,
  selection: SeichiMapTitleSelection,
  totalCount: number,
): SeichiMapAchievementProfile {
  const byId = new Map(
    achievements.map((achievement) => [achievement.id, achievement]),
  );
  const rarityCounts = emptyRarityCounts();
  let points = 0;
  const earned: (SeichiMapAchievementTitle & { achievedAt: Date })[] = [];
  for (const award of awards) {
    const achievement = byId.get(award.achievementId);
    const tier = achievement?.tiers.find(({ level }) => level === award.level);
    if (!achievement || !tier) continue;
    points += SEICHI_MAP_RARITY_POINTS[tier.rarity];
    rarityCounts[tier.rarity] += 1;
    earned.push({
      achievementId: achievement.id,
      name: achievement.name,
      metric: achievement.metric,
      level: tier.level,
      thresholdType: tier.thresholdType,
      thresholdValue: tier.thresholdValue,
      rarity: tier.rarity,
      holderRate: holderRates.get(tierKey(achievement.id, tier.level)) ?? null,
      achievedAt: award.achievedAt,
    });
  }
  const selected = selection
    ? earned.find(
        (title) =>
          title.achievementId === selection.achievementId &&
          title.level === selection.level,
      )
    : undefined;
  const chosen =
    selected ?? [...earned].sort(compareSeichiMapTitleCandidates)[0];

  return {
    points,
    ...getSeichiMapLevelProgress(points),
    earnedCount: earned.length,
    totalCount: Math.max(totalCount, earned.length),
    rarityCounts,
    title: chosen
      ? {
          achievementId: chosen.achievementId,
          name: chosen.name,
          metric: chosen.metric,
          level: chosen.level,
          thresholdType: chosen.thresholdType,
          thresholdValue: chosen.thresholdValue,
          rarity: chosen.rarity,
          holderRate: chosen.holderRate,
        }
      : null,
    titleSelected: Boolean(selected),
  };
}

/**
 * ランキングに並ぶユーザーのレベルと称号をまとめて求める。
 * バッジを1つも持たないユーザーは結果に含めない。
 */
export async function loadSeichiMapRankingBadges(
  userIds: readonly string[],
): Promise<Map<string, SeichiMapRankingBadge>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const [achievements, awards, titles, holderRates] = await Promise.all([
    loadSeichiMapAchievements(),
    prisma.seichiMapUserAchievement.findMany({
      where: { userId: { in: ids } },
      select: {
        userId: true,
        achievementId: true,
        level: true,
        achievedAt: true,
      },
    }),
    prisma.seichiMapUserTitle.findMany({ where: { userId: { in: ids } } }),
    loadHolderRates(),
  ]);
  const awardsByUser = new Map<string, typeof awards>();
  for (const award of awards) {
    const list = awardsByUser.get(award.userId) ?? [];
    list.push(award);
    awardsByUser.set(award.userId, list);
  }
  const titleByUser = new Map(titles.map((title) => [title.userId, title]));
  const badges = new Map<string, SeichiMapRankingBadge>();
  for (const [userId, userAwards] of awardsByUser) {
    const selection = titleByUser.get(userId);
    const profile = buildSeichiMapAchievementProfile(
      achievements,
      userAwards,
      holderRates,
      selection
        ? { achievementId: selection.achievementId, level: selection.level }
        : null,
      0,
    );
    if (profile.earnedCount === 0) continue;
    badges.set(userId, {
      level: profile.level,
      points: profile.points,
      title: profile.title,
    });
  }
  return badges;
}

export async function loadSeichiMapUserAchievementSummary(
  userId: string,
): Promise<SeichiMapAchievementsResponse> {
  const evaluation = await loadEvaluationState();
  if (!evaluation) return NOT_READY;
  // 導入前の訪問や、同期で増えた条件の取りこぼしをここでも補う。
  const { visitedLocationIds } = await evaluateWithState(
    evaluation,
    userId,
    "BACKFILL",
  );
  return buildAchievementSummary(evaluation, userId, visitedLocationIds, {
    includeUnseen: true,
  });
}

/**
 * 共有された聖地マップの持ち主のバッジ状況を返す。閲覧だけなので判定や書き込みはしない。
 * 共有設定が無ければ null を返す。
 */
export async function loadSharedSeichiMapAchievementSummary(
  shareId: string,
): Promise<SeichiMapAchievementsResponse | null> {
  const share = await prisma.seichiMapShare.findUnique({
    where: { shareId },
    select: { userId: true },
  });
  if (!share) return null;
  const evaluation = await loadEvaluationState();
  if (!evaluation) return NOT_READY;
  return buildAchievementSummary(
    evaluation,
    share.userId,
    await loadVisitedLocationIds(share.userId),
    { includeUnseen: false },
  );
}

/**
 * 表示する称号を設定する。獲得済みのグレードだけを選べる。null で自動選択に戻す。
 * 選べないグレードなら false を返す。
 */
export async function setSeichiMapUserTitle(
  userId: string,
  selection: SeichiMapTitleSelection,
): Promise<boolean> {
  if (!selection) {
    await prisma.seichiMapUserTitle.deleteMany({ where: { userId } });
    return true;
  }
  const [award, tier] = await Promise.all([
    prisma.seichiMapUserAchievement.findUnique({
      where: {
        userId_achievementId_level: {
          userId,
          achievementId: selection.achievementId,
          level: selection.level,
        },
      },
      select: { level: true },
    }),
    prisma.seichiMapAchievementTier.findFirst({
      where: {
        achievementId: selection.achievementId,
        level: selection.level,
        achievement: { isActive: true },
      },
      select: { level: true },
    }),
  ]);
  if (!award || !tier) return false;
  await prisma.seichiMapUserTitle.upsert({
    where: { userId },
    create: {
      userId,
      achievementId: selection.achievementId,
      level: selection.level,
    },
    update: {
      achievementId: selection.achievementId,
      level: selection.level,
    },
  });
  return true;
}

async function buildAchievementSummary(
  evaluation: EvaluationState,
  userId: string,
  visitedLocationIds: ReadonlySet<string>,
  options: { includeUnseen: boolean },
): Promise<SeichiMapAchievementsResponse> {
  const [awards, holderRates, titleRecord] = await Promise.all([
    prisma.seichiMapUserAchievement.findMany({
      where: { userId },
      orderBy: [
        { achievedAt: "asc" },
        { achievementId: "asc" },
        { level: "asc" },
      ],
    }),
    loadHolderRates(),
    prisma.seichiMapUserTitle.findUnique({ where: { userId } }),
  ]);
  const awardsByKey = new Map(
    awards.map((award) => [tierKey(award.achievementId, award.level), award]),
  );
  const targetsById = new Map(
    evaluation.context.targets.map((target) => [target.master.id, target]),
  );

  const items = evaluation.achievements.map((achievement) => {
    const target = targetsById.get(achievement.id)!;
    const activeLevels = new Set(
      getSeichiMapActiveTiers(achievement.tiers, target.denominator).map(
        ({ level }) => level,
      ),
    );
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      metric: achievement.metric,
      progressCount: computeSeichiMapAchievementProgress(
        target,
        visitedLocationIds,
        evaluation.context.prefectureByLocationId,
      ),
      denominator: target.denominator,
      // まとめたグレードは隠す。ただし獲得済みのものは取り消さずに表示する。
      tiers: achievement.tiers
        .filter(
          (tier) =>
            activeLevels.has(tier.level) ||
            awardsByKey.has(tierKey(achievement.id, tier.level)),
        )
        .map((tier) => {
          const required = getSeichiMapAchievementRequiredCount(
            tier,
            target.denominator,
          );
          return {
            ...tier,
            requiredCount: Number.isFinite(required) ? required : null,
            achievedAt:
              awardsByKey
                .get(tierKey(achievement.id, tier.level))
                ?.achievedAt.toISOString() ?? null,
            holderRate:
              holderRates.get(tierKey(achievement.id, tier.level)) ?? null,
          };
        }),
    };
  });

  return {
    ready: true,
    profile: buildSeichiMapAchievementProfile(
      evaluation.achievements,
      awards,
      holderRates,
      titleRecord
        ? { achievementId: titleRecord.achievementId, level: titleRecord.level }
        : null,
      items.reduce((total, item) => total + item.tiers.length, 0),
    ),
    items,
    unseen: options.includeUnseen
      ? toUnlocked(
          evaluation.achievements,
          awards.filter((award) => award.seenAt === null),
        )
      : [],
  };
}

export async function markSeichiMapAchievementsSeen(userId: string) {
  const result = await prisma.seichiMapUserAchievement.updateMany({
    where: { userId, seenAt: null },
    data: { seenAt: new Date() },
  });
  return result.count;
}

const toAchievementError = (error: unknown): never => {
  if (error instanceof SeichiMapAchievementError) throw error;
  if (error instanceof SeichiMapIdentityError) {
    if (error.code === "kml_unavailable" || error.code === "invalid_kml") {
      throw new SeichiMapAchievementError(error.code, error.status);
    }
  }
  throw error;
};

const loadKmlLocations = async (input: {
  kml?: string;
  registry?: Awaited<ReturnType<typeof loadSeichiMapIdentityRegistry>>;
}) => {
  try {
    const registry = input.registry ?? (await loadSeichiMapIdentityRegistry());
    const kml = input.kml ?? (await fetchSeichiMapKmlText());
    const locations = parseValidatedSeichiMapKml(kml, registry.identities);
    return {
      locations,
      hash: computeSeichiMapAchievementSyncHash(locations, registry.version),
      partialHash: computeSeichiMapAchievementSyncHash(
        locations,
        registry.version,
        false,
      ),
    };
  } catch (error) {
    return toAchievementError(error);
  }
};

type PreviousGeocode = Map<
  string,
  SeichiMapGeocodeResult & {
    latitude: number;
    longitude: number;
    geocodedAt: Date;
  }
>;

const loadPreviousGeocodes = async (): Promise<PreviousGeocode> => {
  const rows = await prisma.seichiMapLocationSnapshot.findMany({
    where: { geocodedAt: { not: null } },
    select: {
      locationId: true,
      latitude: true,
      longitude: true,
      region: true,
      prefectureCode: true,
      geocodedAt: true,
    },
  });
  return new Map(
    rows.flatMap((row) =>
      row.geocodedAt && row.region !== "UNKNOWN"
        ? [
            [
              row.locationId,
              {
                latitude: row.latitude,
                longitude: row.longitude,
                region: row.region,
                prefectureCode: row.prefectureCode,
                geocodedAt: row.geocodedAt,
              },
            ] as const,
          ]
        : [],
    ),
  );
};

const reusableGeocode = (
  location: SeichiMapLocation,
  previous: PreviousGeocode,
) => {
  const geocode = previous.get(location.id);
  return geocode &&
    geocode.latitude === location.latitude &&
    geocode.longitude === location.longitude
    ? geocode
    : null;
};

async function acquireSyncLease(): Promise<SyncStateRecord | null> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + SYNC_LEASE_MS);
  try {
    return await prisma.seichiMapAchievementSyncState.create({
      data: {
        key: SYNC_KEY,
        version: 0,
        kmlHash: "0".repeat(64),
        locationCount: 0,
        syncedAt: new Date(0),
        syncedBy: "",
        lockedUntil,
      },
    });
  } catch (error) {
    if ((error as { code?: string })?.code !== "P2002") throw error;
  }
  const result = await prisma.seichiMapAchievementSyncState.updateMany({
    where: {
      key: SYNC_KEY,
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    data: { lockedUntil },
  });
  if (result.count !== 1) return null;
  return prisma.seichiMapAchievementSyncState.findUnique({
    where: { key: SYNC_KEY },
  });
}

const releaseSyncLease = () =>
  prisma.seichiMapAchievementSyncState
    .updateMany({ where: { key: SYNC_KEY }, data: { lockedUntil: null } })
    .catch((error) => {
      console.error(
        "Failed to release seichi map achievement sync lease",
        error,
      );
    });

export type SeichiMapAchievementSyncResult = {
  version: number;
  locationCount: number;
  geocodePendingCount: number;
  awardedCount: number;
};

/**
 * 最新の KML から判定用スナップショットを作り直し、全ユーザーを再判定する。
 * onlyIfChanged のときは変化が無い場合と別の同期が実行中の場合に null を返す。
 */
export async function syncSeichiMapAchievementLocations(input: {
  syncedBy: string;
  kml?: string;
  registry?: Awaited<ReturnType<typeof loadSeichiMapIdentityRegistry>>;
  onlyIfChanged?: boolean;
}): Promise<SeichiMapAchievementSyncResult | null> {
  const { locations, hash, partialHash } = await loadKmlLocations(input);
  const state = await acquireSyncLease();
  if (!state) {
    if (input.onlyIfChanged) return null;
    throw new SeichiMapAchievementError("conflict", 409);
  }
  try {
    if (input.onlyIfChanged && state.version > 0 && state.kmlHash === hash) {
      return null;
    }
    const previous = await loadPreviousGeocodes();
    const pending = locations.filter(
      (location) => !reusableGeocode(location, previous),
    );
    const geocoded = await geocodeSeichiMapPoints(
      pending.map((location) => ({
        locationId: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
      })),
      {
        lookup: (point) =>
          lookupGsiMunicipalityCode(point, {
            signal: AbortSignal.timeout(GEOCODE_REQUEST_TIMEOUT_MS),
          }),
        deadline: Date.now() + GEOCODE_BUDGET_MS,
      },
    );
    const syncedAt = new Date();
    let geocodePendingCount = 0;
    const rows = locations.map((location) => {
      const reused = reusableGeocode(location, previous);
      const fresh = geocoded.get(location.id);
      if (!reused && !fresh) geocodePendingCount += 1;
      return {
        locationId: location.id,
        folder: location.folder.slice(0, 255),
        name: location.name.slice(0, 500),
        latitude: location.latitude,
        longitude: location.longitude,
        region: reused?.region ?? fresh?.region ?? "UNKNOWN",
        prefectureCode: reused?.prefectureCode ?? fresh?.prefectureCode ?? null,
        geocodedAt: reused?.geocodedAt ?? (fresh ? syncedAt : null),
        syncedAt,
      } as const;
    });

    const version = state.version + 1;
    await prisma.$transaction(
      async (tx) => {
        await tx.seichiMapLocationSnapshot.deleteMany({});
        for (const part of chunk(rows)) {
          await tx.seichiMapLocationSnapshot.createMany({ data: part });
        }
        const updated = await tx.seichiMapAchievementSyncState.updateMany({
          where: { key: SYNC_KEY, version: state.version },
          data: {
            version,
            kmlHash: geocodePendingCount > 0 ? partialHash : hash,
            locationCount: rows.length,
            syncedAt,
            syncedBy: input.syncedBy.slice(0, 255),
          },
        });
        if (updated.count !== 1) {
          throw new SeichiMapAchievementError("conflict", 409);
        }
      },
      { maxWait: 10_000, timeout: 60_000 },
    );

    const evaluation = await loadEvaluationState();
    const awardedCount = evaluation
      ? await backfillSeichiMapUserAchievements(evaluation)
      : 0;
    return {
      version,
      locationCount: rows.length,
      geocodePendingCount,
      awardedCount,
    };
  } finally {
    await releaseSyncLease();
  }
}

/**
 * マップ表示時に呼び、地点か地点ID登録が変わっていれば同期する。
 * 初回の同期は管理画面で対象数を確認してから行うため、自動では始めない。
 */
export async function syncSeichiMapAchievementsIfChanged(input: {
  kml: string;
  registry: Awaited<ReturnType<typeof loadSeichiMapIdentityRegistry>>;
  locations: readonly SeichiMapLocation[];
}) {
  const state = await prisma.seichiMapAchievementSyncState.findUnique({
    where: { key: SYNC_KEY },
  });
  if (
    !state ||
    state.version < 1 ||
    state.kmlHash ===
      computeSeichiMapAchievementSyncHash(
        input.locations,
        input.registry.version,
      ) ||
    (state.lockedUntil && state.lockedUntil > new Date())
  ) {
    return null;
  }
  return syncSeichiMapAchievementLocations({
    syncedBy: "auto",
    kml: input.kml,
    registry: input.registry,
    onlyIfChanged: true,
  });
}

export async function previewSeichiMapAchievementSync(): Promise<SeichiMapAchievementSyncPreview> {
  const [{ locations, hash }, previous, state, achievements] =
    await Promise.all([
      loadKmlLocations({}),
      loadPreviousGeocodes(),
      prisma.seichiMapAchievementSyncState.findUnique({
        where: { key: SYNC_KEY },
      }),
      loadSeichiMapAchievements(),
    ]);
  let geocodePendingCount = 0;
  const provisional = locations.map<SeichiMapAchievementLocation>(
    (location) => {
      const reused = reusableGeocode(location, previous);
      if (!reused) geocodePendingCount += 1;
      return {
        locationId: location.id,
        folder: location.folder,
        name: location.name,
        region: reused?.region ?? "UNKNOWN",
        prefectureCode: reused?.prefectureCode ?? null,
      };
    },
  );
  const targets = buildSeichiMapAchievementTargets(achievements, provisional);
  return {
    locationCount: locations.length,
    geocodePendingCount,
    syncedAt: state && state.version > 0 ? state.syncedAt.toISOString() : null,
    kmlChanged: !state || state.version < 1 || state.kmlHash !== hash,
    achievements: targets.map((target, index) => ({
      id: target.master.id,
      name: achievements[index].name.ja,
      denominator: target.denominator,
      overlappingLevels: findSeichiMapOverlappingTierLevels(
        target.master.tiers,
        target.denominator,
      ),
    })),
  };
}
