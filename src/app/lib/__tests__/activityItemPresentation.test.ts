import { describe, expect, it } from "vitest";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";
import type { Song } from "../../types/song";
import {
  buildActivityChannelIndexes,
  buildActivityItemPresentation,
} from "../activityItemPresentation";

const t = ((key: string, values?: Record<string, unknown>) => {
  if (key === "activityViewMilestoneTitle") {
    return `${values?.title}:${values?.count}`;
  }

  return key;
}) as any;

const song = {
  title: "テスト楽曲",
  video_title: "テスト動画",
  video_id: "song-video",
  sing: "AZKi",
  sings: ["AZKi"],
  tags: [],
  milestones: [],
} as unknown as Song;

const indexes = buildActivityChannelIndexes([
  {
    branch: "hololive",
    generation: "",
    talentName: "AZKi",
    artistName: "AZKi",
    youtubeId: "UC-azki",
    channelName: "AZKi Channel",
    handle: "@AZKi",
    subscriberCount: 0,
    iconUrl: "https://example.com/azki.png",
  },
  {
    branch: "hololive",
    generation: "",
    talentName: "Test",
    artistName: "Test",
    youtubeId: "UC-archive",
    channelName: "Archive Channel",
    handle: "@archive",
    subscriberCount: 0,
    iconUrl: "https://example.com/archive.png",
  },
]);

describe("activityItemPresentation", () => {
  it("resolves archive title, description, channel, and links", () => {
    const item = {
      id: "archive",
      kind: "archive",
      occurredAt: "2026-06-01T00:00:00.000Z",
      href: "/stream-archives#archive-video",
      youtubeHref: "https://www.youtube.com/watch?v=archive-video",
      videoId: "archive-video",
      importance: "normal",
      archive: {
        title: "配信タイトル",
        description: "配信の説明",
        channel_id: "UC-archive",
      },
    } as ActivityTimelineItem;

    const result = buildActivityItemPresentation(item, t, "ja", indexes);

    expect(result.detailTitle).toBe("配信タイトル");
    expect(result.detailDescription).toBe("配信の説明");
    expect(result.titleHref).toBe("/stream-archives#archive-video");
    expect(result.youtubeHref).toContain("archive-video");
    expect(result.archiveChannel).toMatchObject({
      name: "Archive Channel",
      iconUrl: "https://example.com/archive.png",
    });
  });

  it("resolves song updates and their singers", () => {
    const item = {
      id: "song-update",
      kind: "song_update",
      occurredAt: "2026-06-01T00:00:00.000Z",
      href: "/watch?v=song-video",
      youtubeHref: "https://www.youtube.com/watch?v=song-video",
      videoId: "song-video",
      importance: "normal",
      count: 1,
      songs: [song],
      videoTitle: "追加動画タイトル",
    } as ActivityTimelineItem;

    const result = buildActivityItemPresentation(item, t, "ja", indexes);

    expect(result.detailTitle).toBe("追加動画タイトル");
    expect(result.timelineTitle).toBe("activitySongUpdateDescription");
    expect(result.singers).toEqual([
      expect.objectContaining({
        name: "AZKi Channel",
        iconUrl: "https://example.com/azki.png",
      }),
    ]);
  });

  it.each([
    {
      kind: "event" as const,
      item: {
        id: "event",
        kind: "event",
        occurredAt: "2026-06-01T00:00:00.000Z",
        href: "https://example.com/event",
        importance: "normal",
        event: {
          content: "イベント名",
          note: "イベント説明",
          place: "イベント会場",
          place_url: "https://example.com/place",
        },
      } as ActivityTimelineItem,
      title: "イベント名",
      description: "イベント説明",
      place: "イベント会場",
    },
    {
      kind: "milestone" as const,
      item: {
        id: "milestone",
        kind: "milestone",
        occurredAt: "2026-06-01T00:00:00.000Z",
        href: undefined,
        importance: "normal",
        milestone: {
          content: "活動記録",
          note: "記録の説明",
          place: "記録会場",
          place_url: "",
        },
      } as ActivityTimelineItem,
      title: "活動記録",
      description: "記録の説明",
      place: "記録会場",
    },
  ])("resolves $kind details", ({ item, title, description, place }) => {
    const result = buildActivityItemPresentation(item, t, "ja", indexes);

    expect(result.detailTitle).toBe(title);
    expect(result.detailDescription).toBe(description);
    expect(result.placeLabel).toBe(place);
  });

  it("resolves view milestone title and video presentation", () => {
    const item = {
      id: "view",
      kind: "view_milestone",
      occurredAt: "2026-06-01T00:00:00.000Z",
      href: "/watch?v=song-video",
      youtubeHref: "https://www.youtube.com/watch?v=song-video",
      videoId: "song-video",
      importance: "normal",
      song,
      targetCount: 1_000_000,
      currentViewCount: 1_000_000,
    } as ActivityTimelineItem;

    const result = buildActivityItemPresentation(item, t, "ja", indexes);

    expect(result.detailTitle).toBe("テスト楽曲:100万");
    expect(result.youtubeHref).toContain("song-video");
    expect(result.singers).toHaveLength(1);
  });
});
