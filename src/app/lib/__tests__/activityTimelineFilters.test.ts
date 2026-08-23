import { describe, expect, it } from "vitest";
import {
  filterActivityTimelineItemsForDisplay,
  isShortsActivityItem,
} from "../activityTimelineFilters";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";

const makeItem = (
  kind: ActivityTimelineItem["kind"],
  extra: Record<string, unknown> = {},
) =>
  ({
    id: kind,
    kind,
    occurredAt: "2026-07-01T00:00:00.000Z",
    href: undefined,
    importance: "normal",
    ...extra,
  }) as ActivityTimelineItem;

describe("activity timeline display filters", () => {
  it("recognizes song and archive shorts", () => {
    const songShort = makeItem("song_update", {
      songs: [
        {
          tags: ["楽曲紹介shorts"],
        },
      ],
    });
    const archiveShort = makeItem("archive", {
      archive: {
        title: "#shorts",
        topic: "",
        description: "",
        timestamp_comment: "",
      },
    });

    expect(isShortsActivityItem(songShort)).toBe(true);
    expect(isShortsActivityItem(archiveShort)).toBe(true);
  });

  it("uses the requested defaults and keeps records, events, and view milestones", () => {
    const items = [
      makeItem("song_update", {
        songs: [{ tags: ["楽曲紹介shorts"] }],
      }),
      makeItem("song_update", {
        songs: [{ tags: [] }],
      }),
      makeItem("archive", {
        archive: {
          title: "通常配信",
          topic: "",
          description: "",
          timestamp_comment: "",
        },
      }),
      makeItem("milestone", { milestone: { content: "記録" } }),
      makeItem("event", { event: { content: "イベント" } }),
      makeItem("view_milestone", { targetCount: 500000 }),
      makeItem("anniversary", {
        displayName: "記念日",
        anniversary: { name: "記念日" },
      }),
    ];

    expect(
      filterActivityTimelineItemsForDisplay(items, {
        includeShorts: false,
        includeArchives: true,
        includeSongUpdates: true,
        includeViewMilestones: true,
        includeAnniversaries: true,
      }).map((item) => item.kind),
    ).toEqual([
      "song_update",
      "archive",
      "milestone",
      "event",
      "view_milestone",
      "anniversary",
    ]);
  });

  it("can hide streams and song additions independently", () => {
    const items = [
      makeItem("song_update", { songs: [{ tags: [] }] }),
      makeItem("archive", {
        archive: {
          title: "配信",
          topic: "",
          description: "",
          timestamp_comment: "",
        },
      }),
      makeItem("view_milestone", { targetCount: 500000 }),
      makeItem("event", { event: { content: "イベント" } }),
      makeItem("anniversary", {
        displayName: "記念日",
        anniversary: { name: "記念日" },
      }),
    ];

    expect(
      filterActivityTimelineItemsForDisplay(items, {
        includeShorts: true,
        includeArchives: false,
        includeSongUpdates: false,
        includeViewMilestones: false,
        includeAnniversaries: false,
      }).map((item) => item.kind),
    ).toEqual(["event"]);
  });
});
