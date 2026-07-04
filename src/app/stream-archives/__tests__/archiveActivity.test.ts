import { describe, expect, it } from "vitest";
import {
  buildArchiveActivityYear,
  createArchiveActivitySummary,
  formatActivityDuration,
  getArchiveActivityLevel,
  getJstDateKey,
  getStreamStartedAtMs,
  isInStreamStartedDateRange,
} from "../archiveActivity";

describe("archiveActivity", () => {
  it("rounds stream start times to JST date keys", () => {
    expect(getJstDateKey("2026-01-01T14:59:59.000Z")).toBe("2026-01-01");
    expect(getJstDateKey("2026-01-01T15:00:00.000Z")).toBe("2026-01-02");
    expect(getJstDateKey("invalid")).toBe("");
  });

  it("aggregates stream duration by JST start date and excludes invalid data", () => {
    const summary = createArchiveActivitySummary([
      {
        stream_started_at: "2026-01-01T15:00:00.000Z",
        video_duration: "1:00:00",
      },
      {
        stream_started_at: "2026-01-02T01:00:00.000Z",
        video_duration: "30:00",
      },
      {
        stream_started_at: "2025-12-31T14:59:59.000Z",
        video_duration: "2:00:00",
      },
      { stream_started_at: "", video_duration: "1:00:00" },
      { stream_started_at: "2026-01-03T01:00:00.000Z", video_duration: "" },
    ]);

    expect(summary.dayActiveSeconds.get("2026-01-02")).toBe(5400);
    expect(summary.dayStreamCounts.get("2026-01-02")).toBe(2);
    expect(summary.dayActiveSeconds.get("2025-12-31")).toBe(7200);
    expect(summary.totalActiveSeconds).toBe(12600);
    expect(summary.maxActiveSeconds).toBe(7200);
    expect(summary.years).toEqual([2026, 2025]);
    expect(summary.latestYear).toBe(2026);
  });

  it("counts the full duration on the stream start date even when it crosses midnight", () => {
    const summary = createArchiveActivitySummary([
      {
        stream_started_at: "2026-01-01T14:30:00.000Z",
        video_duration: "2:00:00",
      },
    ]);

    expect(summary.dayActiveSeconds.get("2026-01-01")).toBe(7200);
    expect(summary.dayActiveSeconds.get("2026-01-02")).toBeUndefined();
  });

  it("filters by stream_started_at instead of published_at", () => {
    const streamStartedAtMs = getStreamStartedAtMs("2026-01-01T15:00:00.000Z");

    expect(
      isInStreamStartedDateRange(streamStartedAtMs, [
        "2026-01-02",
        "2026-01-02",
      ]),
    ).toBe(true);
    expect(
      isInStreamStartedDateRange(streamStartedAtMs, [
        "2026-01-01",
        "2026-01-01",
      ]),
    ).toBe(false);
    expect(isInStreamStartedDateRange(0, ["2026-01-02", "2026-01-02"])).toBe(
      false,
    );
    expect(isInStreamStartedDateRange(0, [null, null])).toBe(true);
  });

  it("builds a selectable year grid with month labels and yearly totals", () => {
    const summary = createArchiveActivitySummary([
      {
        stream_started_at: "2026-01-01T15:00:00.000Z",
        video_duration: "1:00:00",
      },
      {
        stream_started_at: "2026-01-02T01:00:00.000Z",
        video_duration: "30:00",
      },
    ]);
    const year = buildArchiveActivityYear(summary, 2026);

    expect(year.weeks.length).toBeGreaterThanOrEqual(52);
    expect(year.monthLabels[0]).toEqual({ month: 1, weekIndex: 0 });
    expect(year.totalActiveSeconds).toBe(5400);
  });

  it("uses a global max duration for activity levels", () => {
    expect(getArchiveActivityLevel(0, 240)).toBe(0);
    expect(getArchiveActivityLevel(60, 240)).toBe(1);
    expect(getArchiveActivityLevel(120, 240)).toBe(2);
    expect(getArchiveActivityLevel(240, 240)).toBe(4);
  });

  it("formats activity duration", () => {
    expect(formatActivityDuration(0)).toBe("0m");
    expect(formatActivityDuration(30 * 60)).toBe("30m");
    expect(formatActivityDuration(60 * 60)).toBe("1h");
    expect(formatActivityDuration(90 * 60)).toBe("1h 30m");
  });
});
