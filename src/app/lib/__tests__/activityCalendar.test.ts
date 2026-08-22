import { describe, expect, it } from "vitest";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";
import {
  buildActivityCalendarDays,
  getActivityCalendarCellPreview,
  getActivityJstDateKey,
  getInitialActivityCalendarDateKey,
  groupActivityItemsByJstDate,
} from "../activityCalendar";

function makeEvent(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "event",
    occurredAt,
    href: undefined,
    importance: "normal",
    event: {
      start_at: occurredAt,
      end_at: occurredAt,
      content: id,
      place: "",
      place_url: "",
      note: "",
      url: "",
      importance: "normal",
    },
  };
}

function makeArchive(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "archive",
    occurredAt,
    href: `/stream-archives#archive-${id}`,
    youtubeHref: `https://www.youtube.com/watch?v=${id}`,
    videoId: id,
    importance: "normal",
    archive: {
      sequence: 1,
      topic: "雑談",
      title: id,
      video_id: id,
      channel_id: "UC-test",
      video_url: `https://www.youtube.com/watch?v=${id}`,
      video_duration: "01:00:00",
      description: "",
      published_at: occurredAt,
      stream_started_at: occurredAt,
      timestamp_comment: "",
    },
  };
}

describe("activityCalendar", () => {
  it("uses JST when grouping timestamps around midnight", () => {
    expect(getActivityJstDateKey("2026-01-31T14:59:59.000Z")).toBe(
      "2026-01-31",
    );
    expect(getActivityJstDateKey("2026-01-31T15:00:00.000Z")).toBe(
      "2026-02-01",
    );
  });

  it("builds a Sunday-first month grid with leading and trailing cells", () => {
    const days = buildActivityCalendarDays({ year: 2026, month: 1 });

    expect(days).toHaveLength(35);
    expect(days.slice(0, 4)).toEqual([null, null, null, null]);
    expect(days[4]).toEqual({ dateKey: "2026-01-01", day: 1 });
    expect(days[34]).toEqual({ dateKey: "2026-01-31", day: 31 });
  });

  it("keeps the existing order for multiple items on the same day", () => {
    const items = [
      makeEvent("important", "2026-01-03T00:00:00.000Z"),
      makeEvent("normal", "2026-01-03T01:00:00.000Z"),
    ];

    expect(
      groupActivityItemsByJstDate(items)
        .get("2026-01-03")
        ?.map((item) => item.id),
    ).toEqual(["important", "normal"]);
  });

  it("fills all preview slots with text when there are no archives", () => {
    const items = [
      makeEvent("event-1", "2026-01-03T00:00:00.000Z"),
      makeEvent("event-2", "2026-01-03T01:00:00.000Z"),
      makeEvent("event-3", "2026-01-03T02:00:00.000Z"),
      makeEvent("event-4", "2026-01-03T03:00:00.000Z"),
    ];

    const preview = getActivityCalendarCellPreview(items);

    expect(preview.thumbnailItems).toEqual([]);
    expect(preview.textItems.map((item) => item.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ]);
    expect(preview.remainingCount).toBe(1);
  });

  it("reserves up to two slots for archives and preserves the remaining order", () => {
    const items = [
      makeEvent("event-1", "2026-01-03T00:00:00.000Z"),
      makeArchive("archive-1", "2026-01-03T01:00:00.000Z"),
      makeEvent("event-2", "2026-01-03T02:00:00.000Z"),
      makeArchive("archive-2", "2026-01-03T03:00:00.000Z"),
      makeArchive("archive-3", "2026-01-03T04:00:00.000Z"),
    ];

    const preview = getActivityCalendarCellPreview(items);

    expect(preview.thumbnailItems.map((item) => item.id)).toEqual([
      "archive-1",
      "archive-2",
    ]);
    expect(preview.textItems.map((item) => item.id)).toEqual(["event-1"]);
    expect(preview.remainingCount).toBe(2);
  });

  it("uses one thumbnail slot and fills the other slots with text", () => {
    const items = [
      makeEvent("event-1", "2026-01-03T00:00:00.000Z"),
      makeArchive("archive-1", "2026-01-03T01:00:00.000Z"),
      makeEvent("event-2", "2026-01-03T02:00:00.000Z"),
    ];

    const preview = getActivityCalendarCellPreview(items);

    expect(preview.thumbnailItems.map((item) => item.id)).toEqual([
      "archive-1",
    ]);
    expect(preview.textItems.map((item) => item.id)).toEqual([
      "event-1",
      "event-2",
    ]);
    expect(preview.remainingCount).toBe(0);
  });

  it("selects today when it has activity, otherwise the first activity day", () => {
    const activityMonth = { year: 2026, month: 1 };
    const groupedItems = groupActivityItemsByJstDate([
      makeEvent("first", "2026-01-03T00:00:00.000Z"),
      makeEvent("today", "2026-01-15T00:00:00.000Z"),
    ]);

    expect(
      getInitialActivityCalendarDateKey(
        activityMonth,
        groupedItems,
        new Date("2026-01-15T03:00:00.000Z"),
      ),
    ).toBe("2026-01-15");
    expect(
      getInitialActivityCalendarDateKey(
        activityMonth,
        groupedItems,
        new Date("2026-02-01T03:00:00.000Z"),
      ),
    ).toBe("2026-01-03");
  });
});
