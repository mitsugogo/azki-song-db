import { describe, expect, it } from "vitest";
import type { ArchiveItem } from "../../types/archiveItem";
import { createArchiveSeriesGroups } from "../archiveSeries";

const createItem = (overrides: Partial<ArchiveItem> = {}): ArchiveItem => ({
  sequence: 1,
  topic: "シリーズA",
  title: "配信",
  video_id: "video-1",
  channel_id: "channel-1",
  video_url: "https://www.youtube.com/watch?v=video-1",
  video_duration: "PT1H",
  description: "",
  published_at: "2025-01-01T00:00:00.000Z",
  stream_started_at: "2025-01-01T00:00:00.000Z",
  timestamp_comment: "",
  ...overrides,
});

describe("createArchiveSeriesGroups", () => {
  it("groups and filters a quoted game title as one category", () => {
    const items = [createItem({ topic: '雑談、"Papers, Please"' })];
    expect(createArchiveSeriesGroups(items).map(({ title }) => title)).toEqual([
      "雑談",
      "Papers, Please",
    ]);
    const groups = createArchiveSeriesGroups(items, "その他", {
      seriesKey: "papersplease",
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      title: "Papers, Please",
      items,
      totalDurationSeconds: 3600,
    });
  });

  it("includes a stream in every category without duplicate category counts", () => {
    const groups = createArchiveSeriesGroups([
      createItem({ topic: "雑談、Minecraft, 雑談" }),
      createItem({
        video_id: "video-2",
        topic: "Minecraft",
        video_duration: "PT2H",
      }),
    ]);
    expect(
      groups.map(({ title, items, totalDurationSeconds }) => ({
        title,
        count: items.length,
        totalDurationSeconds,
      })),
    ).toEqual([
      { title: "雑談", count: 1, totalDurationSeconds: 3600 },
      { title: "Minecraft", count: 2, totalDurationSeconds: 10800 },
    ]);
  });

  it("includes each category in the list and shows only the selected category when filtered", () => {
    const items = [createItem({ topic: "雑談、Minecraft" })];
    const allGroups = createArchiveSeriesGroups(items, "その他");
    expect(allGroups.map(({ title }) => title)).toEqual(["雑談", "Minecraft"]);
    const selectedGroups = createArchiveSeriesGroups(items, "その他", {
      seriesKey: "minecraft",
    });
    expect(selectedGroups.map(({ title }) => title)).toEqual(["Minecraft"]);
    expect(selectedGroups[0].items).toEqual(items);
    expect(
      createArchiveSeriesGroups(items, "その他", { seriesKey: "歌枠" }),
    ).toEqual([]);
  });

  it("aggregates duration and keeps the latest stream for each series", () => {
    const groups = createArchiveSeriesGroups([
      createItem(),
      createItem({
        video_id: "video-2",
        title: "最新配信",
        video_duration: "PT2H",
        stream_started_at: "2026-02-01T00:00:00.000Z",
      }),
      createItem({
        video_id: "video-b",
        topic: "シリーズB",
        video_duration: "PT30M",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      key: "シリーズa",
      title: "シリーズA",
      totalDurationSeconds: 10_800,
      latestStreamStartedAt: "2026-02-01T00:00:00.000Z",
      latestItem: { video_id: "video-2", title: "最新配信" },
    });
    expect(groups[0].items).toHaveLength(2);
  });

  it("uses the supplied label for uncategorized streams", () => {
    const groups = createArchiveSeriesGroups(
      [createItem({ topic: "" })],
      "Other",
    );

    expect(groups[0]).toMatchObject({ key: "other", title: "Other" });
  });
});
