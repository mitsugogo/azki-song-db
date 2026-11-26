import { describe, expect, it } from "vitest";
import {
  compareSeichiMapTitleCandidates,
  getSeichiMapLevelProgress,
  getSeichiMapLevelThreshold,
  SEICHI_MAP_RARITY_POINTS,
} from "../seichiMapAchievementLevel";
import { SEICHI_MAP_ACHIEVEMENT_DEFAULTS } from "../seichiMapAchievementDefaults";

describe("seichi map achievement level", () => {
  it("累計ポイントからレベルと次のレベルまでの進捗を求める", () => {
    expect(getSeichiMapLevelProgress(0)).toEqual({
      level: 1,
      currentLevelPoints: 0,
      levelSpan: 30,
    });
    expect(getSeichiMapLevelProgress(29).level).toBe(1);
    expect(getSeichiMapLevelProgress(30)).toEqual({
      level: 2,
      currentLevelPoints: 0,
      levelSpan: 50,
    });
    expect(getSeichiMapLevelProgress(540)).toEqual({
      level: 7,
      currentLevelPoints: 60,
      levelSpan: 150,
    });
    expect(getSeichiMapLevelProgress(-5).level).toBe(1);
  });

  it("境界の値でも前後のレベルと食い違わない", () => {
    for (let level = 1; level <= 60; level += 1) {
      const threshold = getSeichiMapLevelThreshold(level);
      expect(getSeichiMapLevelProgress(threshold).level).toBe(level);
      if (threshold > 0) {
        expect(getSeichiMapLevelProgress(threshold - 1).level).toBe(level - 1);
      }
    }
  });

  it("全グレードを獲得すると40台のレベルになる", () => {
    const max = SEICHI_MAP_ACHIEVEMENT_DEFAULTS.flatMap(({ tiers }) => tiers)
      .map(({ rarity }) => SEICHI_MAP_RARITY_POINTS[rarity])
      .reduce((total, points) => total + points, 0);
    const { level } = getSeichiMapLevelProgress(max);
    expect(level).toBeGreaterThanOrEqual(40);
    expect(level).toBeLessThanOrEqual(50);
  });

  it("称号はレア度、難しさ、新しさの順に選ぶ", () => {
    const base = {
      thresholdType: "COUNT" as const,
      thresholdValue: 1,
      achievedAt: "2026-11-01T00:00:00Z",
    };
    const candidates = [
      { ...base, id: "n", rarity: "N" as const },
      {
        ...base,
        id: "ssr-count",
        rarity: "SSR" as const,
        thresholdValue: 200,
      },
      {
        ...base,
        id: "ssr-percent",
        rarity: "SSR" as const,
        thresholdType: "PERCENT" as const,
        thresholdValue: 75,
      },
      {
        ...base,
        id: "ssr-percent-new",
        rarity: "SSR" as const,
        thresholdType: "PERCENT" as const,
        thresholdValue: 75,
        achievedAt: "2026-11-20T00:00:00Z",
      },
    ];
    expect(
      [...candidates].sort(compareSeichiMapTitleCandidates).map(({ id }) => id),
    ).toEqual(["ssr-percent-new", "ssr-percent", "ssr-count", "n"]);
  });
});
