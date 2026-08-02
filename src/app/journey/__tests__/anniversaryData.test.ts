import { describe, expect, it } from "vitest";
import type { ArchiveItem } from "@/app/types/archiveItem";
import type { Song } from "@/app/types/song";
import { buildAnniversaryDataStats } from "../anniversaryData";

const song = (overrides: Partial<Song> = {}): Song =>
  ({
    title: "Test Song",
    artist: "AZKi",
    artists: ["AZKi"],
    hl: { ja: { title: "Test Song", artist: "AZKi", artists: ["AZKi"] } },
    album: "Test Album",
    album_id: "test-album",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    sings: ["AZKi"],
    video_title: "Test Video",
    video_uri: "https://www.youtube.com/watch?v=test-video",
    video_id: "test-video",
    start: 0,
    end: 180,
    broadcast_at: "2025-08-07T00:00:00+09:00",
    year: 2025,
    tags: ["オリ曲"],
    song_tags: ["旅", "星"],
    milestones: [],
    ...overrides,
  }) as Song;

const archive = (videoId: string): ArchiveItem => ({
  sequence: 1,
  topic: "配信",
  title: "Test archive",
  video_id: videoId,
  channel_id: "channel",
  video_url: `https://www.youtube.com/watch?v=${videoId}`,
  video_duration: "PT1H",
  description: "",
  published_at: "2026-07-01T00:00:00+09:00",
  stream_started_at: "2026-07-01T00:00:00+09:00",
  timestamp_comment: "",
});

describe("buildAnniversaryDataStats", () => {
  it("公開データを用途ごとのキーで重複排除して集計する", () => {
    const stats = buildAnniversaryDataStats({
      songs: [
        song({}),
        song({
          video_id: "test-video-2",
          start: 30,
          artists: ["AZKi", "星街すいせい"],
          song_tags: ["星", "コラボ"],
        }),
        song({
          title: "Second Song",
          artist: "AZKi、星街すいせい",
          artists: ["AZKi", "星街すいせい"],
          video_id: "test-video-2",
          album_id: "",
          album: "Second Album",
          song_tags: ["コラボ"],
        }),
      ],
      archives: [
        archive("archive-1"),
        archive("archive-1"),
        archive("archive-2"),
      ],
      activityRecords: 42,
    });

    expect(stats).toEqual({
      entries: 3,
      songs: 2,
      videos: 2,
      archives: 2,
      artists: 2,
      albums: 2,
      activityRecords: 42,
      songTags: 3,
    });
  });

  it("空値を数えず、活動記録数を0未満にしない", () => {
    const stats = buildAnniversaryDataStats({
      songs: [
        song({
          album: "",
          album_id: "",
          artists: [],
          song_tags: ["", "  "],
        }),
      ],
      archives: [],
      activityRecords: -1,
    });

    expect(stats.albums).toBe(0);
    expect(stats.artists).toBe(1);
    expect(stats.songTags).toBe(0);
    expect(stats.activityRecords).toBe(0);
  });
});
