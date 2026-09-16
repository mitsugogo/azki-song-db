import type { ViewCountStat } from "../types/api/stat/views";

export const FIRST_VIEW_MILESTONE_TARGET = 500_000;
export const MILLION_VIEW_MILESTONE_STEP = 1_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getCrossedViewMilestoneTargets(
  previousViewCount: number,
  currentViewCount: number,
) {
  if (currentViewCount < FIRST_VIEW_MILESTONE_TARGET) return [];
  const targets: number[] = [];
  const previous = Math.max(0, previousViewCount);
  if (previous < FIRST_VIEW_MILESTONE_TARGET) {
    targets.push(FIRST_VIEW_MILESTONE_TARGET);
  }
  const firstMillion = Math.max(
    MILLION_VIEW_MILESTONE_STEP,
    Math.floor(previous / MILLION_VIEW_MILESTONE_STEP) *
      MILLION_VIEW_MILESTONE_STEP +
      MILLION_VIEW_MILESTONE_STEP,
  );
  for (
    let target = firstMillion;
    target <= currentViewCount;
    target += MILLION_VIEW_MILESTONE_STEP
  ) {
    targets.push(target);
  }
  return targets;
}

export function getNextViewMilestoneTarget(viewCount: number) {
  if (viewCount < FIRST_VIEW_MILESTONE_TARGET) {
    return FIRST_VIEW_MILESTONE_TARGET;
  }
  return (
    Math.floor(viewCount / MILLION_VIEW_MILESTONE_STEP) *
      MILLION_VIEW_MILESTONE_STEP +
    MILLION_VIEW_MILESTONE_STEP
  );
}

export function buildViewMilestoneAchievements(
  history: ViewCountStat[],
  currentViewCount: number,
) {
  const sorted = [...history]
    .filter((item) => item.datetime)
    .sort(
      (a, b) =>
        new Date(a.datetime as string | Date).getTime() -
        new Date(b.datetime as string | Date).getTime(),
    );
  const seen = new Set<number>();
  const achievements: Array<{ targetCount: number; achievedAt: string }> = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const achievedAt = new Date(
      new Date(current.datetime as string | Date).getTime() - DAY_MS,
    ).toISOString();
    getCrossedViewMilestoneTargets(
      previous.viewCount ?? 0,
      current.viewCount ?? 0,
    ).forEach((targetCount) => {
      if (seen.has(targetCount)) return;
      seen.add(targetCount);
      achievements.push({ targetCount, achievedAt });
    });
  }
  if (sorted.length === 0 && currentViewCount >= FIRST_VIEW_MILESTONE_TARGET) {
    getCrossedViewMilestoneTargets(0, currentViewCount).forEach((targetCount) =>
      seen.add(targetCount),
    );
  }
  return achievements;
}
