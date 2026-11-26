import {
  normalizeSeichiMapText,
  splitSeichiMapLocationName,
} from "./seichiMap";
import type {
  SeichiMapAchievementMetricName,
  SeichiMapAchievementRarityName,
  SeichiMapAchievementRule,
  SeichiMapAchievementThresholdTypeName,
  SeichiMapLocationRegionName,
} from "../types/seichiMapAchievements";

export type SeichiMapAchievementLocation = {
  locationId: string;
  folder: string;
  name: string;
  region: SeichiMapLocationRegionName;
  prefectureCode: string | null;
};

export type SeichiMapAchievementTierInput = {
  level: number;
  thresholdType: SeichiMapAchievementThresholdTypeName;
  thresholdValue: number;
  rarity: SeichiMapAchievementRarityName;
};

export type SeichiMapAchievementMaster = {
  id: string;
  metric: SeichiMapAchievementMetricName;
  criteria: SeichiMapAchievementRule[];
  denominatorOverride: number | null;
  tiers: SeichiMapAchievementTierInput[];
  /** locationId → true(含める) / false(除外) */
  overrides?: ReadonlyMap<string, boolean>;
};

export type SeichiMapEligibleTier = {
  achievementId: string;
  level: number;
  progressCount: number;
  denominatorAtAward: number | null;
};

type CompiledRule = {
  layers: Set<string> | null;
  name: RegExp | null;
  baseName: RegExp | null;
  label: RegExp | null;
  exclude: RegExp | null;
  region: SeichiMapAchievementRule["region"] | null;
};

export type SeichiMapAchievementTarget = {
  master: SeichiMapAchievementMaster;
  locationIds: Set<string>;
  denominator: number;
};

export class SeichiMapAchievementCriteriaError extends Error {}

const RULE_KEYS = new Set([
  "layers",
  "name",
  "baseName",
  "label",
  "exclude",
  "region",
]);
const PATTERN_KEYS = ["name", "baseName", "label", "exclude"] as const;
const MAX_PATTERN_LENGTH = 300;

/** DB の criteria(JSON) を検証する。不正なら例外を投げる。 */
export function parseSeichiMapAchievementCriteria(
  value: unknown,
): SeichiMapAchievementRule[] {
  const fail = (reason: string): never => {
    throw new SeichiMapAchievementCriteriaError(reason);
  };
  if (!Array.isArray(value)) return fail("criteria must be an array");
  return value.map((rule, index) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      return fail(`rule ${index} must be an object`);
    }
    const record = rule as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) return fail(`rule ${index} is empty`);
    for (const key of keys) {
      if (!RULE_KEYS.has(key)) return fail(`rule ${index} has unknown ${key}`);
    }
    const parsed: SeichiMapAchievementRule = {};
    if (record.layers !== undefined) {
      if (
        !Array.isArray(record.layers) ||
        record.layers.length === 0 ||
        !record.layers.every(
          (layer) => typeof layer === "string" && layer.trim().length > 0,
        )
      ) {
        return fail(`rule ${index} has invalid layers`);
      }
      parsed.layers = record.layers as string[];
    }
    for (const key of PATTERN_KEYS) {
      const pattern = record[key];
      if (pattern === undefined) continue;
      if (
        typeof pattern !== "string" ||
        pattern.length === 0 ||
        pattern.length > MAX_PATTERN_LENGTH
      ) {
        return fail(`rule ${index} has invalid ${key}`);
      }
      try {
        new RegExp(pattern, "u");
      } catch {
        return fail(`rule ${index} has invalid ${key} pattern`);
      }
      parsed[key] = pattern;
    }
    if (record.region !== undefined) {
      if (record.region !== "DOMESTIC" && record.region !== "OVERSEAS") {
        return fail(`rule ${index} has invalid region`);
      }
      parsed.region = record.region;
    }
    if (parsed.exclude && Object.keys(parsed).length === 1) {
      return fail(`rule ${index} has only exclude`);
    }
    return parsed;
  });
}

const compilePattern = (pattern?: string) =>
  pattern ? new RegExp(normalizeSeichiMapText(pattern), "u") : null;

const compileRules = (rules: readonly SeichiMapAchievementRule[]) =>
  rules.map<CompiledRule>((rule) => ({
    layers: rule.layers
      ? new Set(rule.layers.map((layer) => normalizeSeichiMapText(layer)))
      : null,
    name: compilePattern(rule.name),
    baseName: compilePattern(rule.baseName),
    label: compilePattern(rule.label),
    exclude: compilePattern(rule.exclude),
    region: rule.region ?? null,
  }));

type PreparedLocation = SeichiMapAchievementLocation & {
  normalizedFolder: string;
  parts: ReturnType<typeof splitSeichiMapLocationName>;
};

const prepareLocation = (
  location: SeichiMapAchievementLocation,
): PreparedLocation => ({
  ...location,
  normalizedFolder: normalizeSeichiMapText(location.folder),
  parts: splitSeichiMapLocationName(location.name),
});

const matchesRule = (location: PreparedLocation, rule: CompiledRule) =>
  (!rule.layers || rule.layers.has(location.normalizedFolder)) &&
  (!rule.name || rule.name.test(location.parts.name)) &&
  (!rule.baseName || rule.baseName.test(location.parts.baseName)) &&
  (!rule.label || rule.label.test(location.parts.label)) &&
  (!rule.exclude || !rule.exclude.test(location.parts.name)) &&
  (!rule.region || rule.region === location.region);

const matchesRules = (location: PreparedLocation, rules: CompiledRule[]) =>
  rules.length === 0 || rules.some((rule) => matchesRule(location, rule));

/** 各バッジの対象地点と分母を求める。 */
export function buildSeichiMapAchievementTargets(
  masters: readonly SeichiMapAchievementMaster[],
  locations: readonly SeichiMapAchievementLocation[],
): SeichiMapAchievementTarget[] {
  const prepared = locations.map(prepareLocation);
  return masters.map((master) => {
    const rules = compileRules(master.criteria);
    const locationIds = new Set<string>();
    for (const location of prepared) {
      const override = master.overrides?.get(location.locationId);
      const included = override ?? matchesRules(location, rules);
      if (!included) continue;
      if (master.metric === "PREFECTURE_COUNT" && !location.prefectureCode) {
        continue;
      }
      locationIds.add(location.locationId);
    }
    const naturalDenominator =
      master.metric === "PREFECTURE_COUNT"
        ? new Set(
            prepared
              .filter((location) => locationIds.has(location.locationId))
              .map((location) => location.prefectureCode),
          ).size
        : locationIds.size;
    return {
      master,
      locationIds,
      denominator: master.denominatorOverride ?? naturalDenominator,
    };
  });
}

/** 分母に対してグレードの達成に必要な件数。達成できない場合は Infinity。 */
export function getSeichiMapAchievementRequiredCount(
  tier: Pick<SeichiMapAchievementTierInput, "thresholdType" | "thresholdValue">,
  denominator: number,
) {
  if (tier.thresholdType === "COUNT") return tier.thresholdValue;
  if (denominator <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.ceil((denominator * tier.thresholdValue) / 100));
}

/**
 * 現在の分母で有効なグレードを返す。必要件数が同じグレードは1つにまとめ、
 * 「全制覇」を含むときは全制覇を、それ以外は最も低いグレードを残す。
 * 分母が増えて件数が分かれれば、まとめたグレードは自動で復活する。
 */
export function getSeichiMapActiveTiers<
  T extends Pick<
    SeichiMapAchievementTierInput,
    "level" | "thresholdType" | "thresholdValue"
  >,
>(tiers: readonly T[], denominator: number): T[] {
  const kept = new Map<number, T>();
  const unreachable: T[] = [];
  for (const tier of [...tiers].sort((a, b) => a.level - b.level)) {
    const required = getSeichiMapAchievementRequiredCount(tier, denominator);
    if (!Number.isFinite(required)) {
      unreachable.push(tier);
      continue;
    }
    const current = kept.get(required);
    const isComplete =
      tier.thresholdType === "PERCENT" && tier.thresholdValue >= 100;
    if (!current || isComplete) kept.set(required, tier);
  }
  return [...kept.values(), ...unreachable].sort((a, b) => a.level - b.level);
}

export function computeSeichiMapAchievementProgress(
  target: SeichiMapAchievementTarget,
  visitedLocationIds: ReadonlySet<string>,
  prefectureByLocationId: ReadonlyMap<string, string | null>,
) {
  if (target.master.metric === "PREFECTURE_COUNT") {
    const prefectures = new Set<string>();
    for (const locationId of visitedLocationIds) {
      if (!target.locationIds.has(locationId)) continue;
      const prefecture = prefectureByLocationId.get(locationId);
      if (prefecture) prefectures.add(prefecture);
    }
    return prefectures.size;
  }
  let count = 0;
  for (const locationId of visitedLocationIds) {
    if (target.locationIds.has(locationId)) count += 1;
  }
  return count;
}

export type SeichiMapAchievementEvaluationContext = {
  targets: SeichiMapAchievementTarget[];
  prefectureByLocationId: Map<string, string | null>;
};

export function createSeichiMapAchievementEvaluationContext(
  masters: readonly SeichiMapAchievementMaster[],
  locations: readonly SeichiMapAchievementLocation[],
): SeichiMapAchievementEvaluationContext {
  return {
    targets: buildSeichiMapAchievementTargets(masters, locations),
    prefectureByLocationId: new Map(
      locations.map((location) => [
        location.locationId,
        location.prefectureCode,
      ]),
    ),
  };
}

/** 1ユーザーの訪問地点から、達成しているグレードをすべて返す。 */
export function computeSeichiMapEligibleTiers(
  context: SeichiMapAchievementEvaluationContext,
  visitedLocationIds: ReadonlySet<string>,
): SeichiMapEligibleTier[] {
  const eligible: SeichiMapEligibleTier[] = [];
  for (const target of context.targets) {
    const progressCount = computeSeichiMapAchievementProgress(
      target,
      visitedLocationIds,
      context.prefectureByLocationId,
    );
    if (progressCount === 0) continue;
    for (const tier of getSeichiMapActiveTiers(
      target.master.tiers,
      target.denominator,
    )) {
      if (
        progressCount >=
        getSeichiMapAchievementRequiredCount(tier, target.denominator)
      ) {
        eligible.push({
          achievementId: target.master.id,
          level: tier.level,
          progressCount,
          denominatorAtAward:
            tier.thresholdType === "PERCENT" ? target.denominator : null,
        });
      }
    }
  }
  return eligible;
}

/** 同じ件数になり、1つにまとめられるグレードの組を返す（管理画面の表示用）。 */
export function findSeichiMapOverlappingTierLevels(
  tiers: readonly SeichiMapAchievementTierInput[],
  denominator: number,
): number[][] {
  const levelsByCount = new Map<number, number[]>();
  for (const tier of [...tiers].sort((a, b) => a.level - b.level)) {
    const required = getSeichiMapAchievementRequiredCount(tier, denominator);
    if (!Number.isFinite(required)) continue;
    levelsByCount.set(required, [
      ...(levelsByCount.get(required) ?? []),
      tier.level,
    ]);
  }
  return [...levelsByCount.values()].filter((levels) => levels.length > 1);
}
