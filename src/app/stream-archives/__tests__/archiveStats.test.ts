import { describe, expect, it } from "vitest";
import type { ArchiveStatsItem } from "../archiveStats";
import { createArchiveStatsSummary } from "../archiveStats";

const createItem = (
  overrides: Partial<ArchiveStatsItem> = {},
): ArchiveStatsItem => ({
  sequence: 1,
  topic: "雑談",
  title: "配信",
  video_id: "video-1",
  channel_id: "channel-1",
  video_url: "https://www.youtube.com/watch?v=video-1",
  video_duration: "PT1H",
  description: "",
  published_at: "2026-01-01T15:00:00.000Z",
  stream_started_at: "2026-01-01T15:00:00.000Z",
  timestamp_comment: "",
  participantEntries: [],
  ...overrides,
});

describe("createArchiveStatsSummary", () => {
  it("excludes shorts and calculates all-time overview values", () => {
    const summary = createArchiveStatsSummary(
      [
        createItem(),
        createItem({
          sequence: 2,
          video_id: "video-2",
          video_duration: "PT30M",
        }),
        createItem({
          sequence: 3,
          video_id: "short-1",
          title: "朝の #shorts",
          video_duration: "PT10M",
        }),
        createItem({
          sequence: 4,
          video_id: "invalid-duration",
          video_duration: "unknown",
        }),
      ],
      "ja",
    );

    expect(summary.streamCount).toBe(3);
    expect(summary.totalDurationSeconds).toBe(5_400);
    expect(summary.averageDurationSeconds).toBe(2_700);
  });

  it("uses JST boundaries for calendar days and two-hour start blocks", () => {
    const summary = createArchiveStatsSummary(
      [
        createItem({
          video_id: "before-midnight",
          stream_started_at: "2026-01-01T14:59:00.000Z",
        }),
        createItem({
          video_id: "after-midnight",
          stream_started_at: "2026-01-01T15:00:00.000Z",
        }),
        createItem({
          video_id: "invalid-date",
          stream_started_at: "invalid",
        }),
      ],
      "ja",
    );

    expect(summary.calendarDays.get("2026-01-01")?.streamCount).toBe(1);
    expect(summary.calendarDays.get("2026-01-02")?.streamCount).toBe(1);
    expect(summary.latestMonth).toBe("2026-01");
    expect(
      summary.timeHeatmap.find(
        (cell) => cell.weekday === 4 && cell.startHour === 22,
      )?.streamCount,
    ).toBe(1);
    expect(
      summary.timeHeatmap.find(
        (cell) => cell.weekday === 5 && cell.startHour === 0,
      )?.streamCount,
    ).toBe(1);
  });

  it("ranks categories by stream count and uses a stable name tie-breaker", () => {
    const summary = createArchiveStatsSummary(
      [
        createItem({ video_id: "b-1", topic: "B", video_duration: "PT2H" }),
        createItem({ video_id: "a-1", topic: "A", video_duration: "PT1H" }),
        createItem({ video_id: "c-1", topic: "C", video_duration: "PT30M" }),
        createItem({ video_id: "c-2", topic: "C", video_duration: "PT45M" }),
        createItem({ video_id: "other", topic: "" }),
      ],
      "ja",
      { uncategorizedLabel: "その他" },
    );

    expect(summary.categories.map((category) => category.name)).toEqual([
      "C",
      "A",
      "B",
      "その他",
    ]);
    expect(summary.categories[0]).toMatchObject({
      streamCount: 2,
      totalDurationSeconds: 4_500,
    });
  });

  it("filters category and start-time statistics by the JST stream year", () => {
    const summary = createArchiveStatsSummary(
      [
        createItem({
          video_id: "2025-stream",
          topic: "2025年カテゴリ",
          stream_started_at: "2025-12-31T14:59:00.000Z",
        }),
        createItem({
          video_id: "2026-stream",
          topic: "2026年カテゴリ",
          stream_started_at: "2025-12-31T15:00:00.000Z",
        }),
      ],
      "ja",
      { year: 2026 },
    );

    expect(summary.streamCount).toBe(1);
    expect(summary.categories.map((category) => category.name)).toEqual([
      "2026年カテゴリ",
    ]);
    expect(
      summary.timeHeatmap.find(
        (cell) => cell.weekday === 4 && cell.startHour === 0,
      )?.streamCount,
    ).toBe(1);
  });
});
