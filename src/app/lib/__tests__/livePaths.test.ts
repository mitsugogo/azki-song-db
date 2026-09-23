import { describe, expect, it } from "vitest";
import type { LiveTitleGroup } from "@/app/types/live";
import {
  findLiveTitleGroupBySlug,
  getLiveComparisonPath,
  getLivePerformancePath,
  getLiveTitlePath,
  isValidLiveSlug,
} from "../livePaths";

const group = {
  canonicalId: "kowairo-entropy-yokohama-day",
  pageSlug: "kowairo-entropy",
  performances: [
    { id: "kowairo-entropy-yokohama-day", performanceSlug: "yokohama-day" },
    { id: "kowairo-entropy-yokohama-night", performanceSlug: "yokohama-night" },
    { id: "kowairo-entropy-toyosu-day1", performanceSlug: "toyosu-day1" },
    { id: "kowairo-entropy-toyosu-day2", performanceSlug: "toyosu-day2" },
  ],
} as LiveTitleGroup;

describe("live paths", () => {
  it("シート由来のタイトルslugと公演slugで階層URLを作る", () => {
    expect(getLiveTitlePath(group)).toBe("/lives/kowairo-entropy");
    expect(getLiveComparisonPath(group)).toBe("/lives/kowairo-entropy/all");
    expect(findLiveTitleGroupBySlug([group], "kowairo-entropy")).toBe(group);
    expect(
      group.performances.map((performance) =>
        getLivePerformancePath(group, performance.id),
      ),
    ).toEqual([
      "/lives/kowairo-entropy/yokohama-day",
      "/lives/kowairo-entropy/yokohama-night",
      "/lives/kowairo-entropy/toyosu-day1",
      "/lives/kowairo-entropy/toyosu-day2",
    ]);
  });

  it("別タイトルも同じ設定だけで階層化できる", () => {
    const sixth = {
      ...group,
      canonicalId: "hololive-6th-fes-color-rise-harmony-stage2",
      pageSlug: "hololive-6th-fes-color-rise-harmony",
      performances: [
        {
          id: "hololive-6th-fes-color-rise-harmony-stage2",
          performanceSlug: "stage2",
        },
        {
          id: "hololive-6th-fes-color-rise-harmony-creators",
          performanceSlug: "creators-stage",
        },
      ],
    };
    expect(getLiveTitlePath(sixth)).toBe(
      "/lives/hololive-6th-fes-color-rise-harmony",
    );
    expect(getLivePerformancePath(sixth, sixth.performances[1].id)).toBe(
      "/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );
  });

  it("空欄のライブは従来URLを維持し、不正なslugを拒む", () => {
    const legacy = {
      ...group,
      canonicalId: "azki-departure-2025",
      pageSlug: "",
      performances: [{ id: "azki-departure-2025" }],
    } as LiveTitleGroup;
    expect(getLiveTitlePath(legacy)).toBe("/lives/azki-departure-2025");
    expect(getLivePerformancePath(legacy, "azki-departure-2025")).toBe(
      "/lives/azki-departure-2025",
    );
    expect(getLiveComparisonPath(legacy)).toBeNull();
    expect(getLivePerformancePath(legacy, "missing")).toBeNull();
    expect(isValidLiveSlug("test-live-2025")).toBe(true);
    expect(isValidLiveSlug("../bad")).toBe(false);
  });
});
