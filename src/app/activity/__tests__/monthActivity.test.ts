import { describe, expect, it } from "vitest";
import {
  getAdjacentActivityMonth,
  getCurrentActivityMonth,
  getLatestActivityMonth,
  isActivityMonthInRange,
} from "../monthActivity";

describe("activity calendar month range", () => {
  it("allows future months and year transitions while rejecting invalid and pre-debut months", () => {
    expect(isActivityMonthInRange({ year: 2030, month: 1 })).toBe(true);
    expect(getAdjacentActivityMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
    expect(getAdjacentActivityMonth({ year: 2018, month: 11 }, -1)).toBeNull();
    expect(isActivityMonthInRange({ year: 2026, month: 13 })).toBe(false);
    expect(isActivityMonthInRange({ year: 2026, month: 0 })).toBe(false);
  });

  it("extends the range to scheduled JST dates and keeps today when no future dates exist", () => {
    const now = new Date("2026-09-30T15:00:00.000Z");
    expect(getCurrentActivityMonth(now)).toEqual({ year: 2026, month: 10 });
    expect(getLatestActivityMonth(["invalid", "2026-01-01", ""], now)).toEqual({
      year: 2026,
      month: 10,
    });
    expect(getLatestActivityMonth(["2026-12-31T15:00:00.000Z"], now)).toEqual({
      year: 2027,
      month: 1,
    });
  });
});
