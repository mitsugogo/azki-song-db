import { describe, expect, it } from "vitest";
import type { ArchiveStatsItem } from "../archiveStats";
import {
  createArchiveLongestStreamRanking,
  createArchiveStatsSummary,
} from "../archiveStats";

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

describe("createArchiveLongestStreamRanking", () => {
  it("ranks valid non-Shorts durations and filters by JST year", () => {
    const items = [
      createItem({
        video_id: "five-hours",
        title: "5時間配信",
        video_duration: "PT5H",
        stream_started_at: "2025-12-31T14:59:00.000Z",
      }),
      createItem({
        video_id: "three-hours",
        title: "3時間配信",
        video_duration: "PT3H",
        stream_started_at: "2025-12-31T15:00:00.000Z",
      }),
      createItem({
        video_id: "shorts",
        title: "10時間 #shorts",
        video_duration: "PT10H",
      }),
      createItem({
        video_id: "unknown",
        title: "時間不明",
        video_duration: "unknown",
      }),
    ];

    expect(
      createArchiveLongestStreamRanking(items, null, "ja").map(
        ({ videoId, durationSeconds }) => ({ videoId, durationSeconds }),
      ),
    ).toEqual([
      { videoId: "five-hours", durationSeconds: 18_000 },
      { videoId: "three-hours", durationSeconds: 10_800 },
    ]);
    expect(
      createArchiveLongestStreamRanking(items, "2026", "ja").map(
        ({ videoId }) => videoId,
      ),
    ).toEqual(["three-hours"]);
  });

  it("uses newer streams as the stable tie-breaker and respects the limit", () => {
    const ranking = createArchiveLongestStreamRanking(
      [
        createItem({
          video_id: "older",
          title: "古い配信",
          video_duration: "PT2H",
          stream_started_at: "2026-01-01T00:00:00.000Z",
        }),
        createItem({
          video_id: "newer",
          title: "新しい配信",
          video_duration: "PT2H",
          stream_started_at: "2026-02-01T00:00:00.000Z",
        }),
      ],
      null,
      "ja",
      1,
    );

    expect(ranking.map(({ videoId }) => videoId)).toEqual(["newer"]);
  });
});
