import type {
  SeichiMapAchievementRarityName,
  SeichiMapAchievementThresholdTypeName,
} from "../types/seichiMapAchievements";

/** レア度の低い順。 */
export const SEICHI_MAP_RARITY_ORDER: readonly SeichiMapAchievementRarityName[] =
  ["N", "R", "SR", "SSR", "UR"];

/** グレードを獲得したときに加算するポイント。 */
export const SEICHI_MAP_RARITY_POINTS: Record<
  SeichiMapAchievementRarityName,
  number
> = {
  N: 10,
  R: 30,
  SR: 80,
  SSR: 200,
  UR: 500,
};

export const getSeichiMapRarityRank = (
  rarity: SeichiMapAchievementRarityName,
) => SEICHI_MAP_RARITY_ORDER.indexOf(rarity);

/** レベル L に到達するのに必要な累計ポイント（L=1 は0）。 */
export const getSeichiMapLevelThreshold = (level: number) => {
  const steps = Math.max(0, level - 1);
  return 10 * steps * steps + 20 * steps;
};

export type SeichiMapLevelProgress = {
  level: number;
  /** 現在のレベルに入ってから獲得したポイント */
  currentLevelPoints: number;
  /** 次のレベルまでに必要なポイント（現在のレベルの幅） */
  levelSpan: number;
};

export function getSeichiMapLevelProgress(
  points: number,
): SeichiMapLevelProgress {
  const safePoints = Math.max(0, Math.floor(points));
  // 累計 = 10s^2 + 20s から s を逆算し、浮動小数の誤差は前後で補正する。
  let level = Math.floor(Math.sqrt(1 + safePoints / 10) - 1) + 1;
  while (getSeichiMapLevelThreshold(level + 1) <= safePoints) level += 1;
  while (level > 1 && getSeichiMapLevelThreshold(level) > safePoints) {
    level -= 1;
  }
  const start = getSeichiMapLevelThreshold(level);
  return {
    level,
    currentLevelPoints: safePoints - start,
    levelSpan: getSeichiMapLevelThreshold(level + 1) - start,
  };
}

type RankableTier = {
  rarity: SeichiMapAchievementRarityName;
  thresholdType: SeichiMapAchievementThresholdTypeName;
  thresholdValue: number;
  achievedAt: string | Date;
};

/**
 * 自動で表示する称号の優先順。レア度が高く、達成が難しく、新しいものを先にする。
 */
export function compareSeichiMapTitleCandidates(
  a: RankableTier,
  b: RankableTier,
) {
  return (
    getSeichiMapRarityRank(b.rarity) - getSeichiMapRarityRank(a.rarity) ||
    Number(b.thresholdType === "PERCENT") -
      Number(a.thresholdType === "PERCENT") ||
    b.thresholdValue - a.thresholdValue ||
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );
}
