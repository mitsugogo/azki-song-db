import { describe, expect, it } from "vitest";
import { siteConfig } from "@/app/config/siteConfig";
import { SITE_ANNIVERSARY_MILESTONES } from "../siteAnniversaryData";

describe("SITE_ANNIVERSARY_MILESTONES", () => {
  it("公開日から1周年までの大型機能を時系列で並べる", () => {
    const dates = SITE_ANNIVERSARY_MILESTONES.map((item) => item.date);

    expect(siteConfig.launchedAt).toBe("2025-08-07");
    expect(siteConfig.firstAnniversaryAt).toBe("2026-08-07");
    expect(dates).toEqual([...dates].sort());
    expect(dates[0]).toBe(siteConfig.launchedAt);
    expect(dates.every((date) => date <= siteConfig.firstAnniversaryAt)).toBe(
      true,
    );
  });

  it("各成長段階から実際の機能へ移動できる", () => {
    const hrefs = new Set(
      SITE_ANNIVERSARY_MILESTONES.flatMap((item) =>
        item.features.map((feature) => feature.href),
      ),
    );

    const expectedHrefs = [
      "/watch",
      "/search",
      "/discography",
      "/playlist",
      "/activity",
      "/stream-archives",
      "/seichi-map",
    ];

    expect(expectedHrefs.every((href) => hrefs.has(href))).toBe(true);
  });
});
