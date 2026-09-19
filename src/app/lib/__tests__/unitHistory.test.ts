import { describe, expect, it, vi } from "vitest";
import { getUnitBySlug } from "../../config/units";
import type { Song } from "../../types/song";
import {
  buildUnitHistory,
  getUnitActivityDays,
  getUnitAchievementSongs,
  getUnitKaraokeStreams,
  getUnitKaraokeVideoIds,
  getUnitLegacyActivityDays,
  keepUnitArchiveItem,
  getUnitSingingStats,
  getUnitWorks,
  isUnitWork,
  pickUnitHeroBackgroundSong,
  songIncludesEveryUnitMember,
} from "../unitHistory";

const unit = getUnitBySlug("aziro")!;

const createSong = (overrides: Partial<Song> = {}): Song => ({
  title: "テスト曲",
  artist: "AZKi × 風真いろは",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "2022-09-17",
  album_is_compilation: false,
  sing: "AZKi、風真いろは",
  sings: ["AZKi", "風真いろは"],
  video_title: "テスト動画",
  video_uri: "",
  video_id: "video-id",
  start: 0,
  end: 0,
  broadcast_at: "",
  year: 2022,
  tags: ["カバー曲"],
  milestones: [],
  hl: {
    ja: {
      title: "テスト曲",
      artist: "AZKi × 風真いろは",
      artists: ["AZKi", "風真いろは"],
    },
  },
  ...overrides,
});

describe("unitHistory", () => {
  it("recognizes exact member lineups and formally tagged unit works", () => {
    const exactLineup = createSong();
    const taggedWithGuest = createSong({
      sings: ["AZKi", "風真いろは", "星街すいせい"],
      tags: ["カバー曲", "あずいろ"],
    });
    const informalPerformance = createSong({ tags: ["歌枠"] });
    const unrelatedEnsemble = createSong({
      sings: ["AZKi", "風真いろは", "星街すいせい"],
      tags: ["カバー曲"],
    });

    expect(songIncludesEveryUnitMember(exactLineup, unit)).toBe(true);
    expect(isUnitWork(exactLineup, unit)).toBe(true);
    expect(isUnitWork(taggedWithGuest, unit)).toBe(true);
    expect(isUnitWork(informalPerformance, unit)).toBe(false);
    expect(isUnitWork(unrelatedEnsemble, unit)).toBe(false);
  });

  it("requires all KoZMy members unless the work has the formal unit tag", () => {
    const kozmy = getUnitBySlug("kozmy")!;
    const exactLineup = createSong({
      sings: ["AZKi", "博衣こより", "雪花ラミィ"],
    });
    const missingMember = createSong({ sings: ["AZKi", "博衣こより"] });
    const taggedWithGuest = createSong({
      sings: ["AZKi", "博衣こより", "雪花ラミィ", "星街すいせい"],
      tags: ["カバー曲", "KoZMy"],
    });

    expect(songIncludesEveryUnitMember(exactLineup, kozmy)).toBe(true);
    expect(isUnitWork(exactLineup, kozmy)).toBe(true);
    expect(songIncludesEveryUnitMember(missingMember, kozmy)).toBe(false);
    expect(isUnitWork(missingMember, kozmy)).toBe(false);
    expect(isUnitWork(taggedWithGuest, kozmy)).toBe(true);
  });

  it("requires all RosaMiA members unless the work has the formal unit tag", () => {
    const rosamia = getUnitBySlug("rosamia")!;
    const exactLineup = createSong({
      sings: ["アキ・ローゼンタール", "大神ミオ", "AZKi"],
    });
    const aliasLineup = createSong({
      sings: ["アキロゼ", "大神ミオ", "AZKi"],
    });
    const missingMember = createSong({ sings: ["AZKi", "大神ミオ"] });
    const taggedWithGuest = createSong({
      sings: ["アキ・ローゼンタール", "大神ミオ", "AZKi", "星街すいせい"],
      tags: ["カバー曲", "RosaMiA"],
    });

    expect(songIncludesEveryUnitMember(exactLineup, rosamia)).toBe(true);
    expect(songIncludesEveryUnitMember(aliasLineup, rosamia)).toBe(true);
    expect(isUnitWork(exactLineup, rosamia)).toBe(true);
    expect(songIncludesEveryUnitMember(missingMember, rosamia)).toBe(false);
    expect(isUnitWork(missingMember, rosamia)).toBe(false);
    expect(isUnitWork(taggedWithGuest, rosamia)).toBe(true);
  });

  it("deduplicates works and keeps the earliest JST release", () => {
    const works = getUnitWorks(
      [
        createSong({
          slugv2: "same-work",
          album_release_at: "2023-09-17",
          video_id: "later",
        }),
        createSong({
          slugv2: "same-work",
          album_release_at: "2022-09-17",
          video_id: "earlier",
        }),
        createSong({
          slugv2: "second-work",
          title: "2曲目",
          album_release_at: "2024-01-01",
        }),
      ],
      unit,
    );

    expect(works).toHaveLength(2);
    expect(works[0].video_id).toBe("earlier");
    expect(works[1].title).toBe("2曲目");
  });

  it("prefers the MV over its paired art track for unit achievements", () => {
    const artTrack = createSong({
      slugv2: "going-my-way-art-track",
      video_id: "art-track",
      tags: ["オリ曲", "アートトラック"],
    });
    const musicVideo = createSong({
      slugv2: "going-my-way-mv",
      video_id: "music-video",
      tags: ["オリ曲MV"],
    });
    const standaloneArtTrack = createSong({
      slugv2: "standalone-art-track",
      title: "アートトラックのみの曲",
      video_id: "standalone-art-track",
      tags: ["オリ曲", "アートトラック"],
    });

    expect(
      getUnitAchievementSongs([artTrack, musicVideo, standaloneArtTrack]).map(
        (song) => song.video_id,
      ),
    ).toEqual(["music-video", "standalone-art-track"]);
  });

  it("builds history with JST dates and hides future curated entries", () => {
    const history = buildUnitHistory(
      unit,
      [
        createSong({
          title: "深夜公開",
          slugv2: "midnight-release",
          album_release_at: "2022-09-16T15:00:00.000Z",
        }),
      ],
      "ja",
      new Date("2024-01-01T00:00:00.000Z"),
    );

    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "あずいろ結成", date: "2022-09-17" }),
        expect.objectContaining({ title: "深夜公開", date: "2022-09-17" }),
      ]),
    );
    expect(history.some((entry) => entry.title === "3周年3Dカラオケ")).toBe(
      false,
    );
  });

  it("covers AS_tar history from its INNK roots", () => {
    const asTar = getUnitBySlug("as-tar")!;
    const history = buildUnitHistory(
      asTar,
      [],
      "ja",
      new Date("2024-06-02T12:00:00.000Z"),
    );

    expect(history.map(({ date, title }) => ({ date, title }))).toEqual([
      { date: "2019-05-19", title: "イノナカミュージック始動" },
      { date: "2019-07-27", title: "INNK EXHiBiTiON" },
      { date: "2019-12-01", title: "星街すいせいがホロライブへ転籍" },
      { date: "2020-10-19", title: "星街すいせい50万人記念3Dライブ" },
      { date: "2021-10-16", title: "The Last Frontier" },
      { date: "2021-10-21", title: "STELLAR into the GALAXY" },
      {
        date: "2022-04-01",
        title: "イノナカミュージック終了・AZKiがホロライブへ移籍",
      },
      { date: "2022-07-03", title: "#AZKi生誕祭2022" },
      {
        date: "2024-05-20",
        title: "イノナカ組・ホロライブ加入5周年記念コラボ",
      },
      { date: "2024-06-02", title: "AS_tar結成" },
    ]);
  });

  it("builds an event-focused SorAZ history without listing each unit song", () => {
    const soraz = getUnitBySlug("soraz")!;
    const history = buildUnitHistory(
      soraz,
      [
        createSong({
          title: "自動追加されないSorAZ楽曲",
          sings: ["ときのそら", "AZKi"],
          tags: ["SorAZ", "オリ曲MV"],
          album_release_at: "2024-02-01",
        }),
      ],
      "ja",
      new Date("2024-02-01T12:00:00.000Z"),
    );

    expect(
      history.map(({ date, title, type }) => ({ date, title, type })),
    ).toEqual([
      { date: "2019-07-21", title: "SorAZ結成", type: "formation" },
      {
        date: "2020-09-26",
        title: "SorAZ Special Live 刹那的クロニクル",
        type: "live",
      },
      {
        date: "2021-09-07",
        title: "ときのそら4周年記念ミニライブ",
        type: "anniversary",
      },
      {
        date: "2022-07-03",
        title: "AZKi生誕祭2022",
        type: "anniversary",
      },
      {
        date: "2022-09-07",
        title: "ときのそら5周年記念3D配信",
        type: "anniversary",
      },
      {
        date: "2023-07-01",
        title: "AZKi 5th Birthday Live “DESTiNATiON”",
        type: "anniversary",
      },
      {
        date: "2023-10-15",
        title: "SorAZメジャーデビュー発表",
        type: "achievement",
      },
      {
        date: "2023-12-20",
        title: "1st Album「Futurity Step」",
        type: "album",
      },
      {
        date: "2024-01-27",
        title: "SorAZ Major Debut Live「First Gravity」",
        type: "live",
      },
    ]);
    expect(
      history.some(({ title }) => title === "自動追加されないSorAZ楽曲"),
    ).toBe(false);
  });

  it("adds the 2026 anniversary to the history with official links", () => {
    const anniversaryEntries = buildUnitHistory(
      unit,
      [
        createSong({
          tags: ["歌枠"],
          milestones: ["AZUIRO"],
          video_title: "あずいろ弁当お渡し会",
          video_id: "Pu1uR5DSH8o",
          broadcast_at: "2026-09-16T15:00:00.000Z",
        }),
      ],
      "ja",
      new Date("2026-09-17T12:00:00.000Z"),
    ).filter((entry) => entry.date === "2026-09-17");

    expect(anniversaryEntries).toHaveLength(1);
    expect(anniversaryEntries[0]).toEqual(
      expect.objectContaining({
        type: "anniversary",
        title: "あずいろ4周年",
        href: "https://shop.hololivepro.com/products/aziro_commemorativemerch",
        youtubeHref: "https://www.youtube.com/watch?v=Pu1uR5DSH8o",
      }),
    );
    expect(anniversaryEntries[0].description).toContain(
      "あずいろルームシェアボイス",
    );
  });

  it("adds an AZUIRO song milestone once per video and hides future data", () => {
    const history = buildUnitHistory(
      unit,
      [
        createSong({
          title: "2曲目",
          tags: ["歌枠"],
          milestones: ["あずいろ"],
          video_title: "あずいろ夏の歌枠",
          video_id: "azuiro-stream",
          start: 120,
          broadcast_at: "2026-08-12T15:00:00.000Z",
        }),
        createSong({
          title: "1曲目",
          tags: ["歌枠"],
          milestones: ["AZUIRO"],
          video_title: "あずいろ夏の歌枠",
          video_id: "azuiro-stream",
          start: 30,
          broadcast_at: "2026-08-12T15:00:00.000Z",
        }),
        createSong({
          tags: ["歌枠"],
          milestones: ["ソロライブ"],
          video_title: "対象外の配信",
          video_id: "other-stream",
          broadcast_at: "2026-08-12T15:00:00.000Z",
        }),
        createSong({
          tags: ["歌枠"],
          milestones: ["あずいろ"],
          video_title: "未来のあずいろ配信",
          video_id: "future-stream",
          broadcast_at: "2026-08-14T15:00:00.000Z",
        }),
      ],
      "ja",
      new Date("2026-08-13T12:00:00.000Z"),
    );

    const streamEntries = history.filter((entry) => entry.type === "stream");
    expect(streamEntries).toEqual([
      expect.objectContaining({
        date: "2026-08-13",
        title: "あずいろ夏の歌枠",
        href: "/watch?v=azuiro-stream&t=30s",
        youtubeHref: "https://www.youtube.com/watch?v=azuiro-stream",
      }),
    ]);
  });

  it("counts unique songs and performances and ranks repeated songs", () => {
    const stats = getUnitSingingStats(
      [
        createSong({ title: "アンドロイドガール" }),
        createSong({ title: "アンドロイドガール", video_id: "second" }),
        createSong({ title: "心予報", video_id: "third" }),
        createSong({ sings: ["AZKi"], title: "ソロ曲" }),
        createSong({
          sings: ["AZKi", "風真いろは", "星街すいせい"],
          title: "ゲストを含む歌唱",
        }),
      ],
      unit,
    );

    expect(stats.uniqueSongCount).toBe(2);
    expect(stats.performanceCount).toBe(3);
    expect(stats.ranked[0]).toEqual({ title: "アンドロイドガール", count: 2 });
    expect(stats.ranked.some(({ title }) => title === "ゲストを含む歌唱")).toBe(
      false,
    );
  });

  it("collects unit karaoke video IDs from singing data", () => {
    const asTar = getUnitBySlug("as-tar")!;
    const karaoke = createSong({
      video_id: "7kS7LNMqJOY",
      sings: ["AZKi", "星街すいせい"],
      tags: ["歌枠", "AS_tar", "コラボ"],
    });

    expect(
      getUnitKaraokeVideoIds(
        [
          karaoke,
          { ...karaoke },
          createSong({
            video_id: "talk",
            sings: ["AZKi", "星街すいせい"],
            tags: ["コラボ"],
          }),
          createSong({
            video_id: "solo-karaoke",
            sings: ["AZKi"],
            tags: ["歌枠"],
          }),
        ],
        asTar,
      ),
    ).toEqual(["7kS7LNMqJOY"]);
  });

  it("treats a karaoke collab as a unit stream even when members sing separately", () => {
    expect(
      getUnitKaraokeVideoIds(
        [
          createSong({
            video_id: "turn-taking",
            video_title: "あずいろ歌枠",
            sings: ["AZKi"],
            tags: ["歌枠"],
            broadcast_at: "2023-01-01T12:00:00+09:00",
            start: 10,
          }),
          createSong({
            video_id: "turn-taking",
            video_title: "あずいろ歌枠",
            sings: ["風真いろは"],
            tags: ["歌枠"],
            broadcast_at: "2023-01-01T12:00:00+09:00",
            start: 80,
          }),
        ],
        unit,
      ),
    ).toEqual(["turn-taking"]);
  });

  it("excludes karaoke streams that include singers outside the unit", () => {
    expect(
      getUnitKaraokeVideoIds(
        [
          createSong({
            video_id: "81kUajFYkUk",
            video_title: "はじめての縦型歌枠！Singing Stream",
            sings: ["AZKi"],
            tags: ["歌枠"],
          }),
          createSong({
            video_id: "81kUajFYkUk",
            video_title: "はじめての縦型歌枠！Singing Stream",
            sings: ["AZKi", "風真いろは"],
            tags: ["歌枠", "あずいろ"],
          }),
          createSong({
            video_id: "81kUajFYkUk",
            video_title: "はじめての縦型歌枠！Singing Stream",
            sings: ["AZKi", "天音かなた"],
            tags: ["歌枠", "かなあず"],
          }),
        ],
        unit,
      ),
    ).toEqual([]);
  });

  it("drops solo karaoke archives once unit karaoke videos are known", () => {
    const unitKaraoke = new Set(["FL4ZqehhBP0"]);

    expect(
      keepUnitArchiveItem(
        { video_id: "gtkVOMb7vl8", topic: "歌枠" },
        unitKaraoke,
      ),
    ).toBe(false);
    expect(
      keepUnitArchiveItem(
        { video_id: "FL4ZqehhBP0", topic: "重大告知" },
        unitKaraoke,
      ),
    ).toBe(true);
    expect(
      keepUnitArchiveItem(
        { video_id: "minecraft", topic: "Minecraft" },
        unitKaraoke,
      ),
    ).toBe(true);
    expect(
      keepUnitArchiveItem({ video_id: "solo", topic: "歌枠" }, new Set()),
    ).toBe(true);
  });

  it("detects karaoke streams from video titles when tags omit 歌枠", () => {
    const soraz = getUnitBySlug("soraz")!;
    const streams = getUnitKaraokeStreams(
      [
        createSong({
          video_id: "DaS44s0V9Lk",
          video_title:
            "【Minecraft】初！？・・・マイクラしながらアカペラ歌枠！！【#SorAZ/#ときのそら生放送】",
          video_uri: "https://www.youtube.com/watch?v=DaS44s0V9Lk",
          sings: ["ときのそら", "AZKi"],
          tags: ["ゲーム", "企画", "アカペラ"],
          broadcast_at: "2021-05-04T21:00:00+09:00",
        }),
        createSong({
          video_id: "cover",
          video_title: "【SorAZ】暁の車 歌ってみた",
          sings: ["ときのそら", "AZKi"],
          tags: ["カバー曲", "SorAZ"],
        }),
      ],
      soraz,
    );

    expect(streams).toEqual([
      {
        videoId: "DaS44s0V9Lk",
        title:
          "【Minecraft】初！？・・・マイクラしながらアカペラ歌枠！！【#SorAZ/#ときのそら生放送】",
        videoUrl: "https://www.youtube.com/watch?v=DaS44s0V9Lk",
        broadcastAt: "2021-05-04T21:00:00+09:00",
      },
    ]);
  });

  it("counts activity days at JST midnight boundaries", () => {
    expect(getUnitActivityDays(unit, new Date("2022-09-16T15:00:00Z"))).toBe(0);
    expect(getUnitActivityDays(unit, new Date("2022-09-17T15:00:00Z"))).toBe(1);
  });

  it("counts AS_tar and its INNK roots from separate start dates", () => {
    const asTar = getUnitBySlug("as-tar")!;
    const now = new Date("2024-06-02T15:00:00.000Z");

    expect(getUnitActivityDays(asTar, now)).toBe(1);
    expect(getUnitLegacyActivityDays(asTar, now)).toBe(1842);
    expect(getUnitLegacyActivityDays(unit, now)).toBeNull();
  });

  it("selects only public unit music videos as hero backgrounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const selected = pickUnitHeroBackgroundSong(
      [
        createSong({ tags: ["カバー曲MV"], is_members_only: true }),
        createSong({ video_id: "stream", tags: ["歌枠"] }),
        createSong({ video_id: "hero", tags: ["オリ曲MV"] }),
      ],
      unit,
    );

    expect(selected?.video_id).toBe("hero");
    vi.restoreAllMocks();
  });
});
