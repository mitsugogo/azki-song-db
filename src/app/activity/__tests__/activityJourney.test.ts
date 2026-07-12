import { describe, expect, it } from "vitest";
import {
  formatJourneyDate,
  getActivityJourneyStats,
  getJourneyPosition,
  getJstDateKey,
} from "../activityJourneyUtils";

describe("activityJourney", () => {
  it("JSTのデビュー日を1日目として数える", () => {
    expect(getActivityJourneyStats(new Date("2018-11-14T15:00:00Z"))).toEqual({
      today: "2018-11-15",
      activityDays: 1,
      duration: { years: 0, months: 0, days: 0 },
    });
  });

  it("現在の経過日数と暦上の期間をJST基準で返す", () => {
    expect(getActivityJourneyStats(new Date("2026-07-12T03:00:00Z"))).toEqual({
      today: "2026-07-12",
      activityDays: 2797,
      duration: { years: 7, months: 7, days: 27 },
    });
  });

  it("UTCでは前日でもJSTの日付を返す", () => {
    expect(getJstDateKey(new Date("2026-07-11T15:30:00Z"))).toBe("2026-07-12");
  });

  it("デビューを0%、今日を100%として日付を配置する", () => {
    expect(getJourneyPosition("2018-11-15", "2026-07-12")).toBe(0);
    expect(getJourneyPosition("2026-07-12", "2026-07-12")).toBe(100);
    expect(getJourneyPosition("2023-07-01", "2026-07-12")).toBeGreaterThan(50);
  });

  it("表示用の日付をドット区切りにする", () => {
    expect(formatJourneyDate("2025-07-01")).toBe("2025.07.01");
  });
});
