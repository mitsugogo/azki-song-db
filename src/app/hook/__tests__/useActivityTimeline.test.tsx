import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useActivityTimeline from "../useActivityTimeline";
import {
  buildViewMilestoneItems,
  filterActivityTimelineItems,
  sortActivityTimelineItems,
  type ActivityTimelineItem,
} from "../useActivityTimeline";
import type { ViewStat } from "../../types/api/stat/views";
import type { Song } from "../../types/song";

vi.mock("../useArchives", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../useReleaseViewCounts", () => ({
  default: () => ({ data: {}, loading: false }),
}));

const createStat = (date: string, viewCount: number): ViewStat => ({
  datetime: new Date(date),
  viewCount,
  likeCount: 0,
  commentCount: 0,
});

const createSong = (viewCount: number): Song => ({
  title: "Test Song",
  artist: "AZKi",
  artists: ["AZKi"],
  hl: {
    ja: {
      title: "Test Song",
      artist: "AZKi",
      artists: ["AZKi"],
    },
  },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "Test Video",
  video_uri: "https://www.youtube.com/watch?v=video-1",
  video_id: "video-1",
  start: 0,
  end: 0,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
  view_count: viewCount,
});

describe("buildViewMilestoneItems", () => {
  it("50万、100万、以降100万ごとの突破をactivityにする", () => {
    const items = buildViewMilestoneItems([createSong(2505000)], {
      "video-1": [
        createStat("2026-01-01T00:00:00.000Z", 490000),
        createStat("2026-01-02T00:00:00.000Z", 505000),
        createStat("2026-01-03T00:00:00.000Z", 999000),
        createStat("2026-01-04T00:00:00.000Z", 1001000),
        createStat("2026-01-05T00:00:00.000Z", 1999000),
        createStat("2026-01-06T00:00:00.000Z", 2001000),
      ],
    });

    expect(items.map((item) => item.targetCount)).toEqual([
      500000, 1000000, 2000000,
    ]);
    expect(items.map((item) => item.occurredAt)).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
      "2026-01-05T00:00:00.000Z",
    ]);
    expect(items.map((item) => item.youtubeHref)).toEqual([
      "https://www.youtube.com/watch?v=video-1",
      "https://www.youtube.com/watch?v=video-1",
      "https://www.youtube.com/watch?v=video-1",
    ]);
  });

  it("1日の増分で複数の節目を跨いだ場合もすべてactivityにする", () => {
    const items = buildViewMilestoneItems([createSong(1200000)], {
      "video-1": [
        createStat("2026-01-01T00:00:00.000Z", 490000),
        createStat("2026-01-02T00:00:00.000Z", 1200000),
      ],
    });

    expect(items.map((item) => item.targetCount)).toEqual([500000, 1000000]);
    expect(items.map((item) => item.occurredAt)).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ]);
  });

  it("履歴開始時点ですでに突破済みの節目はactivityにしない", () => {
    const items = buildViewMilestoneItems([createSong(750000)], {
      "video-1": [
        createStat("2026-01-01T00:00:00.000Z", 600000),
        createStat("2026-01-02T00:00:00.000Z", 750000),
      ],
    });

    expect(items).toEqual([]);
  });
});

describe("filterActivityTimelineItems", () => {
  const createActivityItem = (
    id: string,
    occurredAt: string,
  ): ActivityTimelineItem => ({
    id,
    kind: "milestone",
    occurredAt,
    href: undefined,
    importance: "normal",
    milestone: {
      date: occurredAt,
      content: id,
    },
  });

  it("月内のactivityだけを境界込みで返す", () => {
    const items = filterActivityTimelineItems(
      [
        createActivityItem("before", "2026-05-31T23:59:59.999Z"),
        createActivityItem("start", "2026-06-01T00:00:00.000Z"),
        createActivityItem("middle", "2026-06-15T00:00:00.000Z"),
        createActivityItem("end", "2026-07-01T00:00:00.000Z"),
      ],
      {
        dateRange: {
          start: new Date("2026-06-01T00:00:00.000Z"),
          endExclusive: new Date("2026-07-01T00:00:00.000Z"),
        },
        now: new Date("2026-07-02T00:00:00.000Z").getTime(),
      },
    );

    expect(items.map((item) => item.id)).toEqual(["middle", "start"]);
  });

  it("未来日と無効な日付を除外する", () => {
    const items = filterActivityTimelineItems(
      [
        createActivityItem("valid", "2026-06-10T00:00:00.000Z"),
        createActivityItem("future", "2026-06-20T00:00:00.000Z"),
        createActivityItem("invalid", "not-a-date"),
      ],
      {
        dateRange: {
          start: new Date("2026-06-01T00:00:00.000Z"),
          endExclusive: new Date("2026-07-01T00:00:00.000Z"),
        },
        now: new Date("2026-06-15T00:00:00.000Z").getTime(),
      },
    );

    expect(items.map((item) => item.id)).toEqual(["valid"]);
  });

  it("allows future scheduled items only when opted in, within the selected JST month", () => {
    const items = [
      createActivityItem("start", "2026-05-31T15:00:00.000Z"),
      createActivityItem("future", "2026-06-20T00:00:00.000Z"),
      createActivityItem("end", "2026-06-30T15:00:00.000Z"),
      createActivityItem("invalid", "not-a-date"),
      {
        ...createActivityItem("anniversary", "2026-06-21T00:00:00.000Z"),
        kind: "anniversary",
        anniversary: {
          date: "06/21",
          name: "記念日",
          first_date_at: "",
          url: "",
          note: "",
        },
        displayName: "記念日",
      } as ActivityTimelineItem,
      {
        ...createActivityItem("song", "2026-06-20T00:00:00.000Z"),
        kind: "song_update",
      } as ActivityTimelineItem,
      {
        ...createActivityItem("archive", "2026-06-20T00:00:00.000Z"),
        kind: "archive",
      } as ActivityTimelineItem,
      {
        ...createActivityItem("views", "2026-06-20T00:00:00.000Z"),
        kind: "view_milestone",
      } as ActivityTimelineItem,
    ];
    const options = {
      now: new Date("2026-06-15T00:00:00.000Z").getTime(),
      dateRange: {
        start: new Date("2026-05-31T15:00:00.000Z"),
        endExclusive: new Date("2026-06-30T15:00:00.000Z"),
      },
    };
    expect(
      filterActivityTimelineItems(items, options).map((item) => item.id),
    ).toEqual(["start"]);
    expect(
      filterActivityTimelineItems(items, {
        ...options,
        includeFutureScheduledItems: true,
      }).map((item) => item.id),
    ).toEqual(["anniversary", "future", "start"]);
  });

  it("eventやmilestoneも日付順に並べて表示対象に残す", () => {
    const eventItem: ActivityTimelineItem = {
      id: "event",
      kind: "event",
      occurredAt: "2026-06-20T00:00:00.000Z",
      href: undefined,
      event: {
        start_at: "2026-06-20T00:00:00.000Z",
        end_at: "",
        content: "Test Event",
        place: "",
        place_url: "",
        note: "",
        url: "",
      },
      importance: "normal",
    };
    const items = filterActivityTimelineItems(
      [
        createActivityItem("older-milestone", "2026-06-01T00:00:00.000Z"),
        createActivityItem("newer-milestone", "2026-06-15T00:00:00.000Z"),
        eventItem,
      ],
      {
        now: new Date("2026-06-30T00:00:00.000Z").getTime(),
      },
    );

    expect(items.map((item) => item.id)).toEqual([
      "event",
      "newer-milestone",
      "older-milestone",
    ]);
  });

  it("keeps dates ordered while prioritizing higher importance within a JST day", () => {
    const items = [
      {
        ...createActivityItem("normal", "2026-06-20T00:30:00.000Z"),
        importance: "normal" as const,
      },
      {
        ...createActivityItem("extra", "2026-06-20T09:00:00.000Z"),
        importance: "extra_high" as const,
      },
      {
        ...createActivityItem("older", "2026-06-19T14:59:59.000Z"),
        importance: "high" as const,
      },
    ];

    expect(filterActivityTimelineItems(items).map((item) => item.id)).toEqual([
      "extra",
      "normal",
      "older",
    ]);
    expect(
      sortActivityTimelineItems(items, "asc").map((item) => item.id),
    ).toEqual(["older", "extra", "normal"]);
  });
});

describe("useActivityTimeline scheduled items", () => {
  it("keeps the default timeline historical and includes future events and milestones for calendars", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    try {
      const options = {
        songs: [createSong(0)],
        events: [
          {
            start_at: "2026-01-20T00:00:00.000Z",
            end_at: "",
            content: "未来のイベント",
            place: "",
            note: "",
            url: "",
          },
        ],
        milestones: [
          { date: "2026-01-21T00:00:00.000Z", content: "未来のマイルストーン" },
        ],
      };
      const { result, rerender } = renderHook(
        ({ includeFutureScheduledItems }) =>
          useActivityTimeline({ ...options, includeFutureScheduledItems }),
        { initialProps: { includeFutureScheduledItems: false } },
      );
      expect(result.current.items.map((item) => item.kind)).toEqual([
        "song_update",
      ]);
      rerender({ includeFutureScheduledItems: true });
      expect(result.current.items.map((item) => item.kind)).toEqual([
        "milestone",
        "event",
        "song_update",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
