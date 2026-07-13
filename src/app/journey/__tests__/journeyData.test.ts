import { describe, expect, it } from "vitest";
import type { ArchiveItem } from "@/app/types/archiveItem";
import type { Song } from "@/app/types/song";
import { siteConfig } from "@/app/config/siteConfig";
import { createEmptySongPlayCountState } from "@/app/hook/useSongPlayCounts";
import {
  buildJourneyChapters,
  getJourneyTotals,
  groupJourneyMomentsByDate,
  isFeaturedJourneyMilestoneTitle,
  isProminentJourneyMilestoneTitle,
} from "../journeyData";

const song = (overrides: Partial<Song>): Song =>
  ({
    title: "Test Song",
    artist: "AZKi",
    hl: { ja: { title: "Test Song", artist: "AZKi", artists: ["AZKi"] } },
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
    video_uri: "https://www.youtube.com/watch?v=test-video",
    video_id: "test-video",
    start: 0,
    end: 180,
    broadcast_at: "2019-01-01T00:00:00+09:00",
    year: 2019,
    tags: ["オリ曲"],
    milestones: [],
    ...overrides,
  }) as Song;

const archive = (overrides: Partial<ArchiveItem>): ArchiveItem => ({
  sequence: 1,
  topic: "3D LIVE",
  title: "Test 3D LIVE",
  video_id: "archive-video",
  channel_id: "channel",
  video_url: "https://www.youtube.com/watch?v=archive-video",
  video_duration: "PT1H",
  description: "",
  published_at: "2019-02-01T00:00:00+09:00",
  stream_started_at: "2019-02-01T00:00:00+09:00",
  timestamp_comment: "",
  ...overrides,
});

describe("buildJourneyChapters", () => {
  it("活動年表を主軸にオリジナル楽曲とLIVE・企画配信だけを集約する", () => {
    const chapters = buildJourneyChapters({
      songs: [
        song({ view_count: 100 }),
        song({
          title: "Popular Song",
          video_id: "popular-video",
          video_title: "Popular Video",
          broadcast_at: "2022-01-01T00:00:00+09:00",
          year: 2022,
          view_count: 1000,
        }),
      ],
      archives: [
        archive({}),
        archive({
          video_id: "regular-stream",
          topic: "歌枠",
          title: "通常の歌枠",
        }),
        archive({
          video_id: "hololive-stream",
          topic: "雑談",
          title: "【ホロライブ / AZKi】通常配信",
        }),
      ],
      milestones: [
        { date: "2019-04-01T00:00:00+09:00", content: "Test milestone" },
      ],
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters).toHaveLength(2);
    expect(chapters[0].fallbackLabel).toBe("ルートα");
    expect(chapters[0].counts).toEqual({
      songs: 1,
      archives: 1,
      videos: 0,
      milestones: 1,
    });
    expect(chapters[0].moments.map((item) => item.kind)).toEqual(["milestone"]);
    expect(chapters[1].representativeSongs[0]?.title).toBe("Popular Song");
  });

  it("Talk&Live 配信をLIVEアーカイブとして集約しない", () => {
    const chapters = buildJourneyChapters({
      songs: [song({})],
      archives: [
        archive({
          topic: "AZKi生放送",
          title: "【LIVE】AZKi生放送 #2　Talk&Live",
        }),
      ],
      milestones: [],
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters[0].counts.archives).toBe(0);
  });

  it("AZKi Channelで期間内に公開・配信した動画を重複排除して数える", () => {
    const chapters = buildJourneyChapters({
      songs: [song({})],
      archives: [
        archive({
          video_id: "azki-upload",
          channel_id: siteConfig.channelId,
          topic: "動画",
          title: "AZKi Channel upload",
          published_at: "2019-02-01T00:00:00+09:00",
          stream_started_at: "",
        }),
        archive({
          video_id: "azki-live",
          channel_id: siteConfig.channelId,
          topic: "配信",
          title: "AZKi Channel live",
          stream_started_at: "2019-03-01T00:00:00+09:00",
        }),
        archive({
          sequence: 2,
          video_id: "azki-live",
          channel_id: siteConfig.channelId,
          topic: "配信",
          title: "Duplicate AZKi Channel live",
          stream_started_at: "2019-03-01T00:00:00+09:00",
        }),
        archive({
          video_id: "guest-upload",
          channel_id: "guest-channel",
          topic: "動画",
          title: "Guest Channel upload",
        }),
        archive({
          video_id: "future-upload",
          channel_id: siteConfig.channelId,
          topic: "動画",
          title: "Future AZKi Channel upload",
          published_at: "2099-01-01T00:00:00+09:00",
          stream_started_at: "",
        }),
      ],
      milestones: [],
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters[0].counts.videos).toBe(2);
    expect(getJourneyTotals(chapters).videos).toBe(2);
  });

  it("未来データを除き、期間内の全楽曲から再生回数とお気に入りを集計する", () => {
    const listenedSong = song({});
    const listenedCover = song({
      title: "Cover Song",
      video_id: "cover-video",
      tags: ["カバー"],
      broadcast_at: "2019-03-01T00:00:00+09:00",
    });
    const futureSong = song({
      title: "Future Song",
      video_id: "future-video",
      broadcast_at: "2099-01-01T00:00:00+09:00",
      year: 2099,
    });
    const playCountState = createEmptySongPlayCountState();
    playCountState.records["Test Song::AZKi"] = {
      title: "Test Song",
      artist: "AZKi",
      playCount: 4,
      lastPlayedAt: "2026-07-12T00:00:00+09:00",
    };
    playCountState.records["Cover Song::AZKi"] = {
      title: "Cover Song",
      artist: "AZKi",
      playCount: 3,
      lastPlayedAt: "2026-07-12T00:00:00+09:00",
    };

    const chapters = buildJourneyChapters({
      songs: [listenedSong, listenedCover, futureSong],
      archives: [],
      milestones: [],
      playCountState,
      favorites: [
        { videoId: "test-video", start: "0" },
        { videoId: "cover-video", start: "0" },
      ],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters).toHaveLength(1);
    expect(chapters[0].counts.songs).toBe(1);
    expect(chapters[0].personal).toEqual({ plays: 7, favorites: 2 });
    expect(getJourneyTotals(chapters).plays).toBe(7);
  });

  it("同じ楽曲の複数動画が同じ期間にあっても再生回数を重複加算しない", () => {
    const playCountState = createEmptySongPlayCountState();
    playCountState.records["Cover Song::AZKi"] = {
      title: "Cover Song",
      artist: "AZKi",
      playCount: 5,
      lastPlayedAt: "2026-07-12T00:00:00+09:00",
    };

    const chapters = buildJourneyChapters({
      songs: [
        song({
          title: "Other Original",
          video_id: "other-original",
        }),
        song({
          title: "Cover Song",
          video_id: "cover-video-1",
          tags: ["カバー"],
        }),
        song({
          title: "Cover Song",
          video_id: "cover-video-2",
          tags: ["カバー"],
          broadcast_at: "2019-02-01T00:00:00+09:00",
        }),
      ],
      archives: [],
      milestones: [],
      playCountState,
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters[0].personal.plays).toBe(5);
  });

  it("同一オリジナル楽曲の別動画や後年の歌唱を1リリースとして数える", () => {
    const chapters = buildJourneyChapters({
      songs: [
        song({ video_id: "original-art-track" }),
        song({
          video_id: "original-mv",
          tags: ["オリ曲MV"],
          broadcast_at: "2019-02-01T00:00:00+09:00",
        }),
        song({
          video_id: "later-performance",
          broadcast_at: "2022-01-01T00:00:00+09:00",
          year: 2022,
        }),
      ],
      archives: [],
      milestones: [],
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters).toHaveLength(1);
    expect(chapters[0].counts.songs).toBe(1);
    expect(chapters[0].representativeSongs[0]?.video_id).toBe("original-mv");
  });

  it("activity年表の出来事を省略せず全件表示する", () => {
    const milestones = Array.from({ length: 12 }, (_, index) => ({
      date: `2019-${String(index + 1).padStart(2, "0")}-01T00:00:00+09:00`,
      content: `Milestone ${index + 1}`,
    }));

    const chapters = buildJourneyChapters({
      songs: [song({})],
      archives: [],
      milestones,
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      now: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(chapters[0].counts.milestones).toBe(12);
    expect(chapters[0].moments).toHaveLength(12);
    expect(chapters[0].moments.map((item) => item.title)).toEqual(
      milestones.map((item) => item.content),
    );
  });

  it("指定マイルストーンを強調し、生誕LIVEの動画情報を付与する", () => {
    const featuredTitles = [
      "2021年生誕",
      "活動1周年",
      "活動10周年",
      "ホロぐら初登場",
      "ホロライブ移籍（ホロライブ0期生）",
      "初めてのGeoGuessr配信",
      "「かなけん」入社",
      "開拓者の姿が明かされる",
      "あずいろ結成",
      "初のロケ動画「AZKi's LOCATION!!」公開",
    ];

    expect(featuredTitles.every(isFeaturedJourneyMilestoneTitle)).toBe(true);
    expect(isFeaturedJourneyMilestoneTitle("通常の出来事")).toBe(false);

    const chapters = buildJourneyChapters({
      songs: [
        song({
          video_id: "birthday-live",
          video_title: "AZKi Birthday Live",
          milestones: ["2021年生誕"],
        }),
        song({
          title: "Anniversary Song",
          video_id: "anniversary-live",
          video_title: "AZKi 1st Anniversary Live",
          milestones: ["活動1周年"],
        }),
      ],
      archives: [
        archive({
          video_id: "birthday-live",
          title: "AZKi Birthday Live",
          topic: "3D LIVE",
        }),
        archive({
          video_id: "horogura-video",
          title: "【アニメ】とうとう来たぜ！",
          topic: "ホロぐら",
          stream_started_at: "2022-02-20T09:00:00Z",
        }),
        archive({
          video_id: "transfer-video",
          title: "ホロライブへ移籍しました！",
          topic: "雑談",
          stream_started_at: "2022-04-02T11:00:00Z",
        }),
        archive({
          video_id: "same-day-video",
          title: "あずいろ結成配信",
          topic: "コラボ",
          stream_started_at: "2022-09-17T11:00:00Z",
        }),
      ],
      milestones: [
        {
          date: "2022-02-19T15:00:00Z",
          content: "ホロぐら初登場",
          url: "https://www.youtube.com/watch?v=horogura-video",
        },
        {
          date: "2022-03-31T15:00:00Z",
          content: "ホロライブ移籍（ホロライブ0期生）",
        },
        {
          date: "2023-04-10T15:00:00Z",
          content: "「かなけん」入社",
          url: "https://www.youtube.com/live/kanaken-video",
        },
        {
          date: "2022-09-16T15:00:00Z",
          content: "あずいろ結成",
          url: "https://example.com/not-a-video",
        },
      ],
      playCountState: createEmptySongPlayCountState(),
      favorites: [],
      videoTitlesById: {
        "kanaken-video": "【#かなけん面接】顔合わせ！面接＆説明会をします！",
      },
      now: new Date("2026-07-13T00:00:00+09:00"),
    });
    const featuredMoments = chapters.flatMap((chapter) => chapter.moments);
    const birthdayMoment = featuredMoments.find(
      (moment) => moment.title === "2021年生誕",
    );

    expect(birthdayMoment).toMatchObject({
      featured: true,
      media: {
        videoId: "birthday-live",
        title: "AZKi Birthday Live",
        href: "https://www.youtube.com/watch?v=birthday-live",
      },
    });
    expect(
      featuredMoments.some((moment) => moment.id === "archive-birthday-live"),
    ).toBe(false);
    expect(chapters[0].counts.archives).toBe(1);
    expect(
      featuredMoments.find((moment) => moment.title === "活動1周年")?.media,
    ).toMatchObject({
      videoId: "anniversary-live",
      title: "AZKi 1st Anniversary Live",
    });
    expect(
      featuredMoments.find((moment) => moment.title === "ホロぐら初登場")
        ?.media,
    ).toMatchObject({
      videoId: "horogura-video",
      title: "【アニメ】とうとう来たぜ！",
    });
    expect(
      featuredMoments.find((moment) =>
        moment.title.startsWith("ホロライブ移籍"),
      )?.media,
    ).toMatchObject({
      videoId: "transfer-video",
      title: "ホロライブへ移籍しました！",
    });
    expect(
      featuredMoments.find((moment) => moment.title === "「かなけん」入社")
        ?.media,
    ).toMatchObject({
      videoId: "kanaken-video",
      title: "【#かなけん面接】顔合わせ！面接＆説明会をします！",
    });
    expect(
      featuredMoments.find((moment) => moment.title === "あずいろ結成")?.media,
    ).toMatchObject({
      videoId: "same-day-video",
      title: "あずいろ結成配信",
    });
  });

  it("JSTで同じ日のマイルストーンを1つの日付グループにまとめる", () => {
    const days = groupJourneyMomentsByDate([
      {
        id: "one",
        kind: "milestone",
        occurredAt: "2023-05-13T15:00:00Z",
        title: "First",
      },
      {
        id: "two",
        kind: "milestone",
        occurredAt: "2023-05-14T13:00:00Z",
        title: "Second",
      },
      {
        id: "three",
        kind: "milestone",
        occurredAt: "2023-05-14T15:00:00Z",
        title: "Third",
      },
    ]);

    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      dateKey: "2023-05-14",
      moments: [{ title: "First" }, { title: "Second" }],
    });
    expect(days[1].dateKey).toBe("2023-05-15");
  });

  it("正規表現で指定した重要マイルストーンを大きく表示する対象にする", () => {
    expect(
      isProminentJourneyMilestoneTitle(
        "「Virtual Diva AZKi」としてYouTube活動開始",
      ),
    ).toBe(true);
    expect(isProminentJourneyMilestoneTitle("100万人達成")).toBe(true);
    expect(isProminentJourneyMilestoneTitle("90万人達成")).toBe(false);
  });
});
