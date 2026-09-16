import { describe, expect, it } from "vitest";
import {
  buildViewMilestoneAchievements,
  getCrossedViewMilestoneTargets,
  getNextViewMilestoneTarget,
} from "../viewMilestones";

describe("viewMilestones", () => {
  it("returns every milestone crossed between two observations", () => {
    expect(getCrossedViewMilestoneTargets(499_999, 2_000_000)).toEqual([
      500_000, 1_000_000, 2_000_000,
    ]);
  });

  it.each([
    [0, 500_000],
    [499_999, 500_000],
    [500_000, 1_000_000],
    [1_000_000, 2_000_000],
    [1_500_000, 2_000_000],
  ])("chooses the next target after %i views", (views, expected) => {
    expect(getNextViewMilestoneTarget(views)).toBe(expected);
  });

  it("records crossed targets once using the preceding observation date", () => {
    expect(
      buildViewMilestoneAchievements(
        [
          { datetime: "2026-01-01T00:00:00.000Z", viewCount: 400_000 },
          { datetime: "2026-01-03T00:00:00.000Z", viewCount: 1_200_000 },
          { datetime: "2026-01-05T00:00:00.000Z", viewCount: 2_200_000 },
        ],
        2_200_000,
      ),
    ).toEqual([
      { targetCount: 500_000, achievedAt: "2026-01-02T00:00:00.000Z" },
      { targetCount: 1_000_000, achievedAt: "2026-01-02T00:00:00.000Z" },
      { targetCount: 2_000_000, achievedAt: "2026-01-04T00:00:00.000Z" },
    ]);
  });

  it("does not invent achievement dates without history", () => {
    expect(buildViewMilestoneAchievements([], 2_000_000)).toEqual([]);
  });
});
