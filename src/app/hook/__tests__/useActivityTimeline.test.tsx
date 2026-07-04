import { describe, expect, it } from "vitest";
import { buildViewMilestoneItems } from "../useActivityTimeline";
import type { ViewStat } from "../../types/api/stat/views";
import type { Song } from "../../types/song";

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
