import type {
  SeichiMapAchievementTierView,
  SeichiMapAchievementView,
} from "../types/seichiMapAchievements";

export type SeichiMapNextTarget = {
  achievement: SeichiMapAchievementView;
  /** まだ獲得していない最初のグレード */
  tier: SeichiMapAchievementTierView;
  /** 達成までの残り件数（1以上） */
  remaining: number;
  /** 進捗の割合（0 より大きく 1 未満） */
  ratio: number;
};

/**
 * 「次に狙えるバッジ」を、あと少しで獲得できる順に選ぶ。
 * 進捗が 0 のバッジと、分母が 0 で準備中のバッジは含めない。
 */
export function pickNextSeichiMapTargets(
  items: readonly SeichiMapAchievementView[],
  limit = 3,
): SeichiMapNextTarget[] {
  const targets: SeichiMapNextTarget[] = [];

  for (const achievement of items) {
    if (achievement.denominator <= 0 || achievement.progressCount <= 0) {
      continue;
    }
    const tier = achievement.tiers.find(
      (candidate) => !candidate.achievedAt && candidate.requiredCount !== null,
    );
    if (!tier || tier.requiredCount === null) continue;
    const remaining = tier.requiredCount - achievement.progressCount;
    if (remaining <= 0) continue;

    targets.push({
      achievement,
      tier,
      remaining,
      ratio: achievement.progressCount / tier.requiredCount,
    });
  }

  return targets
    .sort(
      (left, right) =>
        right.ratio - left.ratio ||
        left.remaining - right.remaining ||
        left.achievement.id.localeCompare(right.achievement.id),
    )
    .slice(0, Math.max(0, limit));
}

export type SeichiMapAchievementFilter = "all" | "earned" | "unearned";

export function filterSeichiMapAchievements(
  items: readonly SeichiMapAchievementView[],
  filter: SeichiMapAchievementFilter,
): SeichiMapAchievementView[] {
  if (filter === "all") return [...items];
  const hasEarned = (item: SeichiMapAchievementView) =>
    item.tiers.some((tier) => tier.achievedAt);
  return items.filter((item) =>
    filter === "earned" ? hasEarned(item) : !hasEarned(item),
  );
}
