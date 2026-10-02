import { describe, expect, it } from "vitest";
import type { ArchiveItem } from "../../types/archiveItem";
import { createArchiveEntries } from "../archiveListEntries";
import { createArchiveSeriesGroups } from "../archiveSeries";

const item: ArchiveItem = {
  sequence: 1,
  topic: "3D LIVE、アコースティックライブ",
  title: "アコースティックライブ配信",
  video_id: "video-1",
  channel_id: "channel-1",
  video_url: "https://www.youtube.com/watch?v=video-1",
  video_duration: "PT1H",
  description: "",
  published_at: "2026-01-01T00:00:00.000Z",
  stream_started_at: "2026-01-01T00:00:00.000Z",
  timestamp_comment: "",
};

describe("createArchiveEntries", () => {
  it("shows a keyword-matched video under every series heading", () => {
    const entries = createArchiveEntries(createArchiveSeriesGroups([item]));

    expect(
      entries.map((entry) =>
        entry.type === "group" ? entry.group.title : entry.item.video_id,
      ),
    ).toEqual(["3D LIVE", "video-1", "アコースティックライブ", "video-1"]);
    expect(new Set(entries.map(({ key }) => key)).size).toBe(entries.length);
    const rows = entries.filter((entry) => entry.type === "item");
    expect(new Set(rows.map(({ anchorId }) => anchorId)).size).toBe(2);
    expect(
      rows.filter(({ anchorId }) => anchorId === "archive-video-1"),
    ).toHaveLength(1);
    expect(rows[0].anchorId).toBe("archive-video-1");
  });

  it("keeps the shared video anchor when a secondary category is selected", () => {
    const entries = createArchiveEntries(
      createArchiveSeriesGroups([item], "その他", {
        seriesKey: "アコースティックライブ",
      }),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      type: "group",
      group: { title: "アコースティックライブ" },
    });
    expect(entries[1]).toMatchObject({
      type: "item",
      item,
      anchorId: "archive-video-1",
    });
  });

  it("does not repeat a normalized duplicate category or merge distinct videos", () => {
    const groups = createArchiveSeriesGroups([
      { ...item, topic: "3D LIVE、３Ｄ ＬＩＶＥ、アコースティックライブ" },
      { ...item, video_id: "video-2" },
    ]);
    const entries = createArchiveEntries(groups);
    const rows = entries.filter((entry) => entry.type === "item");
    expect(rows.map(({ item }) => item.video_id)).toEqual([
      "video-1",
      "video-2",
      "video-1",
      "video-2",
    ]);
    expect(new Set(entries.map(({ key }) => key)).size).toBe(entries.length);
    expect(new Set(rows.map(({ anchorId }) => anchorId)).size).toBe(
      rows.length,
    );
    expect(
      rows.filter(({ anchorId }) => anchorId === "archive-video-2"),
    ).toHaveLength(1);
  });
});
