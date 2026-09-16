import { describe, expect, it, vi } from "vitest";
import { getUnitBySlug } from "../../config/units";
import type { Song } from "../../types/song";
import {
  buildUnitHistory,
  getUnitActivityDays,
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

  it("counts unique songs and performances and ranks repeated songs", () => {
    const stats = getUnitSingingStats(
      [
        createSong({ title: "アンドロイドガール" }),
        createSong({ title: "アンドロイドガール", video_id: "second" }),
        createSong({ title: "心予報", video_id: "third" }),
        createSong({ sings: ["AZKi"], title: "ソロ曲" }),
      ],
      unit,
    );

    expect(stats.uniqueSongCount).toBe(2);
    expect(stats.performanceCount).toBe(3);
    expect(stats.ranked[0]).toEqual({ title: "アンドロイドガール", count: 2 });
  });

  it("counts activity days at JST midnight boundaries", () => {
    expect(getUnitActivityDays(unit, new Date("2022-09-16T15:00:00Z"))).toBe(0);
    expect(getUnitActivityDays(unit, new Date("2022-09-17T15:00:00Z"))).toBe(1);
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
