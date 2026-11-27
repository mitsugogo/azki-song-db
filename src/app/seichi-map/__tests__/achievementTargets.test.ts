import { describe, expect, it } from "vitest";
import type {
  SeichiMapAchievementTierView,
  SeichiMapAchievementView,
} from "../../types/seichiMapAchievements";
import {
  filterSeichiMapAchievements,
  pickNextSeichiMapTargets,
} from "../achievementTargets";

const tier = (
  level: number,
  requiredCount: number | null,
  achievedAt: string | null = null,
): SeichiMapAchievementTierView => ({
  level,
  thresholdType: "COUNT",
  thresholdValue: requiredCount ?? 1,
  rarity: "N",
  requiredCount,
  achievedAt,
  holderRate: null,
});

const achievement = (
  id: string,
  progressCount: number,
  denominator: number,
  tiers: SeichiMapAchievementTierView[],
): SeichiMapAchievementView => ({
  id,
  name: { ja: id, en: null },
  description: null,
  metric: "LOCATION_COUNT",
  progressCount,
  denominator,
  tiers,
});

describe("pickNextSeichiMapTargets", () => {
  it("進捗の割合が高い順に、次のグレードまでの残りを返す", () => {
    const items = [
      achievement("far", 2, 100, [tier(1, 10)]),
      achievement("near", 9, 100, [tier(1, 10)]),
      achievement("mid", 5, 100, [tier(1, 10)]),
    ];

    const targets = pickNextSeichiMapTargets(items);

    expect(targets.map(({ achievement: { id } }) => id)).toEqual([
      "near",
      "mid",
      "far",
    ]);
    expect(targets[0]).toMatchObject({ remaining: 1, ratio: 0.9 });
  });

  it("獲得済みのグレードを飛ばして、最初の未獲得グレードを狙う", () => {
    const [target] = pickNextSeichiMapTargets([
      achievement("a", 12, 100, [
        tier(1, 10, "2026-11-01T00:00:00Z"),
        tier(2, 30),
      ]),
    ]);

    expect(target.tier.level).toBe(2);
    expect(target.remaining).toBe(18);
  });

  it("進捗 0・準備中（分母 0）・全グレード獲得済み・上限なしの行は含めない", () => {
    const items = [
      achievement("zero", 0, 100, [tier(1, 10)]),
      achievement("preparing", 3, 0, [tier(1, null)]),
      achievement("done", 10, 100, [tier(1, 10, "2026-11-01T00:00:00Z")]),
      achievement("unreachable", 3, 100, [tier(1, null)]),
    ];

    expect(pickNextSeichiMapTargets(items)).toEqual([]);
  });

  it("件数の上限で切り、割合が同じなら残りが少ない順にする", () => {
    const items = [
      achievement("b", 5, 100, [tier(1, 10)]),
      achievement("a", 50, 1000, [tier(1, 100)]),
      achievement("c", 1, 2, [tier(1, 2)]),
    ];

    expect(
      pickNextSeichiMapTargets(items, 2).map(({ achievement: { id } }) => id),
    ).toEqual(["c", "b"]);
    expect(pickNextSeichiMapTargets(items, 0)).toEqual([]);
  });
});

describe("filterSeichiMapAchievements", () => {
  const earned = achievement("earned", 10, 100, [
    tier(1, 10, "2026-11-01T00:00:00Z"),
  ]);
  const notEarned = achievement("not-earned", 1, 100, [tier(1, 10)]);

  it("獲得済み・未獲得・すべてで絞り込む", () => {
    const items = [earned, notEarned];
    expect(filterSeichiMapAchievements(items, "all")).toEqual(items);
    expect(filterSeichiMapAchievements(items, "earned")).toEqual([earned]);
    expect(filterSeichiMapAchievements(items, "unearned")).toEqual([notEarned]);
  });
});
