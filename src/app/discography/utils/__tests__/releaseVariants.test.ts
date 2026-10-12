import { describe, expect, it } from "vitest";
import type { Song } from "../../../types/song";
import {
  chooseReleaseRepresentative,
  findReleaseVariantGroup,
  getReleaseVariantKind,
  getSelectableReleaseVariants,
  getSongInstanceKey,
  groupReleaseVariants,
  hasMultipleReleaseVariants,
  matchesReleaseVariantGroupKey,
} from "../releaseVariants";

const baseSong = (overrides: Partial<Song>): Song =>
  ({
    title: "Going My Way",
    artist: "AZKi & 星街すいせい",
    album: "Going My Way",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "2026-05-19T00:00:00.000Z",
    album_is_compilation: false,
    sing: "AZKi、星街すいせい",
    sings: ["AZKi", "星街すいせい"],
    video_title: "",
    video_uri: "",
    video_id: "base-video",
    start: 0,
    end: 0,
    broadcast_at: "2026-05-19T00:00:00.000Z",
    year: 2026,
    tags: ["オリ曲"],
    milestones: [],
    hl: {
      ja: {
        title: "Going My Way",
        artist: "AZKi & 星街すいせい",
        artists: ["AZKi", "星街すいせい"],
        album: "Going My Way",
        sing: "AZKi、星街すいせい",
        sings: ["AZKi", "星街すいせい"],
      },
    },
    ...overrides,
  }) as Song;

describe("releaseVariants", () => {
  it("動画情報が同じでもsource_orderが異なる行は別インスタンスとして扱う", () => {
    const first = baseSong({
      video_id: "duplicate-video",
      start: 12,
      slugv2: "duplicate-video-12",
      source_order: 51,
    });
    const second = baseSong({
      video_id: "duplicate-video",
      start: 12,
      slugv2: "duplicate-video-12",
      source_order: 52,
    });

    expect(getSongInstanceKey(first)).toBe("source-order:51");
    expect(getSongInstanceKey(second)).toBe("source-order:52");
  });

  it("source_orderがないデータでは動画情報からインスタンスキーを作る", () => {
    const song = baseSong({
      video_id: "legacy-video",
      start: 12,
      slugv2: "legacy-video-12",
      source_order: undefined,
    });

    expect(getSongInstanceKey(song)).toBe("legacy-video__12__legacy-video-12");
  });

  it("同一アルバム・同一曲・同一アーティストのMVとアートトラックを1グループにする", () => {
    const groups = groupReleaseVariants([
      baseSong({
        video_id: "art-track",
        source_order: 1,
        tags: ["オリ曲", "アートトラック"],
      }),
      baseSong({
        video_id: "music-video",
        source_order: 2,
        tags: ["オリ曲MV"],
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].variants.map((song) => song.video_id)).toEqual([
      "music-video",
      "art-track",
    ]);
    expect(groups[0].representative.video_id).toBe("music-video");
    expect(hasMultipleReleaseVariants(groups[0].variants)).toBe(true);
  });

  it("代表曲はMVをアートトラックより優先する", () => {
    const representative = chooseReleaseRepresentative([
      baseSong({
        video_id: "art-track",
        tags: ["オリ曲", "アートトラック"],
        source_order: 1,
      }),
      baseSong({
        video_id: "music-video",
        tags: ["オリ曲MV"],
        source_order: 99,
      }),
    ]);

    expect(representative.video_id).toBe("music-video");
  });

  const magiaSong = (overrides: Partial<Song>): Song =>
    baseSong({
      title: "Magia",
      artist: "Kalafina",
      album: "",
      sing: "アキ・ローゼンタール、大神ミオ、AZKi",
      sings: ["アキ・ローゼンタール", "大神ミオ", "AZKi"],
      ...overrides,
    });
  const magiaMv = magiaSong({
    video_id: "Ti2ELlQbuYc",
    video_title: "Magia / RosaMiA🌹 (cover)",
    tags: ["カバー曲", "カバー曲MV", "歌ってみた"],
    source_order: 1934,
  });
  const magiaLive = magiaSong({
    video_id: "X0wwLISllTM",
    video_title: "【3D Live ver.】Magia / RosaMiA🌹 (cover)",
    tags: ["カバー曲", "歌ってみた", "公式切り抜き"],
    source_order: 1935,
  });

  it("MagiaのMVと公式3D Live版をまとめ、ライブ本編の歌唱は別に残す", () => {
    const birthdayLive = magiaSong({
      video_id: "_tBlI-l8WLk",
      video_title: "【 3DLIVE 】#アキロゼ生誕祭2026 ーLife is GAMEー",
      tags: ["ゲスト出演", "3Dライブ"],
      source_order: 2093,
      start: 2787,
    });
    const groups = groupReleaseVariants([magiaLive, magiaMv, birthdayLive]);

    expect(groups).toHaveLength(2);
    expect(groups[0].variants).toEqual([magiaMv, magiaLive]);
    expect(groups[0].representative).toBe(magiaMv);
    expect(getReleaseVariantKind(magiaLive)).toBe("3d-live");
    expect(hasMultipleReleaseVariants(groups[0].variants)).toBe(true);
    expect(groups[1].variants).toEqual([birthdayLive]);
    for (const song of [magiaMv, magiaLive]) {
      expect(matchesReleaseVariantGroupKey(song, groups[0].key)).toBe(true);
    }
    expect(matchesReleaseVariantGroupKey(birthdayLive, groups[0].key)).toBe(
      false,
    );
    expect(
      matchesReleaseVariantGroupKey(
        { ...magiaLive, sing: "AZKi", sings: ["AZKi"] },
        groups[0].key,
      ),
    ).toBe(false);
  });

  it.each([
    ["別の曲名", { title: "Another Song" }],
    ["別のアーティスト", { artist: "Another Artist" }],
    ["別の歌唱者", { sing: "AZKi", sings: ["AZKi"] }],
    ["別のアルバム", { album: "Another Album" }],
    ["歌唱者が不明", { sing: "", sings: [] }],
    ["公式切り抜きタグなし", { tags: ["カバー曲", "3Dライブ"] }],
    ["3D Live版の表記なし", { video_title: "Magia / RosaMiA🌹 (cover)" }],
    ["ライブ本編の表記", { video_title: "【3D Live】Birthday Live" }],
  ] satisfies [string, Partial<Song>][])(
    "%sの動画はMVとまとめない",
    (_label, overrides) => {
      const groups = groupReleaseVariants([
        magiaMv,
        { ...magiaLive, ...overrides },
      ]);

      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.variants.length === 1)).toBe(true);
    },
  );

  it("3D Live版は表記ゆれと歌唱者の順序を正規化してアートトラックともまとめる", () => {
    const artTrack = { ...magiaMv, tags: ["カバー曲", "アートトラック"] };
    const live = {
      ...magiaLive,
      title: " Ｍａｇｉａ ",
      artist: " Ｋａｌａｆｉｎａ ",
      sing: "AZKi、大神ミオ、アキ・ローゼンタール",
      sings: ["AZKi", "大神ミオ", "アキ・ローゼンタール"],
      video_title: "【３Ｄ Ｌｉｖｅ ｖｅｒ．】Magia / RosaMiA🌹 (cover)",
    };
    const groups = groupReleaseVariants([live, artTrack]);

    expect(groups).toHaveLength(1);
    expect(groups[0].variants).toEqual([artTrack, live]);
  });

  it("対応するMVやアートトラックがない3D Live動画同士はまとめない", () => {
    const groups = groupReleaseVariants([
      magiaLive,
      { ...magiaLive, video_id: "another-live", source_order: 2000 },
    ]);

    expect(groups).toHaveLength(2);
  });

  it("3D Live版がない既存のMVグループでは歌唱者による集約条件を変えない", () => {
    const soloMv = baseSong({ video_id: "solo-mv", tags: ["カバー曲MV"] });
    const groupMv = baseSong({
      video_id: "group-mv",
      tags: ["カバー曲MV"],
      sing: "hololive members",
      sings: ["hololive members"],
    });

    expect(groupReleaseVariants([soloMv, groupMv])[0].variants).toEqual([
      groupMv,
      soloMv,
    ]);
    expect(groupReleaseVariants([soloMv, groupMv])).toHaveLength(1);
  });

  it("同名でも別アーティストや別アルバムは混ぜない", () => {
    const groups = groupReleaseVariants([
      baseSong({ video_id: "mv-1", tags: ["オリ曲MV"] }),
      baseSong({
        video_id: "mv-2",
        artist: "AZKi",
        tags: ["オリ曲MV"],
      }),
      baseSong({
        video_id: "mv-3",
        album: "Another Album",
        tags: ["オリ曲MV"],
      }),
    ]);

    expect(groups).toHaveLength(3);
  });

  it("歌枠などの通常動画は同名でも動画単位のままにする", () => {
    const groups = groupReleaseVariants([
      baseSong({
        video_id: "live-1",
        album: "",
        tags: ["歌枠"],
        broadcast_at: "2026-05-20T00:00:00.000Z",
      }),
      baseSong({
        video_id: "live-2",
        album: "",
        tags: ["歌枠"],
        broadcast_at: "2026-05-21T00:00:00.000Z",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.variants)).toBe(true);
  });

  it("アルバムがない同一曲・同一アーティストの複数MVを1グループにする", () => {
    const groups = groupReleaseVariants([
      baseSong({
        title: "from A to Z",
        artist: "AZKi",
        album: "",
        video_id: "main-mv",
        tags: ["オリ曲MV"],
        source_order: 2,
      }),
      baseSong({
        title: "from A to Z",
        artist: "AZKi",
        album: "",
        video_id: "early-mv",
        tags: ["オリ曲MV"],
        source_order: 1,
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].variants.map((song) => song.video_id)).toEqual([
      "early-mv",
      "main-mv",
    ]);
    expect(groups[0].representative.video_id).toBe("early-mv");
    expect(hasMultipleReleaseVariants(groups[0].variants)).toBe(true);
  });

  it("複数MVは切替対象として両方残す", () => {
    const selectableVariants = getSelectableReleaseVariants([
      baseSong({
        video_id: "mv-2",
        tags: ["オリ曲MV"],
        source_order: 2,
      }),
      baseSong({
        video_id: "mv-1",
        tags: ["オリ曲MV"],
        source_order: 1,
      }),
    ]);

    expect(selectableVariants.map((song) => song.video_id)).toEqual([
      "mv-1",
      "mv-2",
    ]);
    expect(hasMultipleReleaseVariants(selectableVariants)).toBe(true);
  });

  it("アニAZはアルバムが違っても同一曲・同一アーティストの元MVと1グループにする", () => {
    const groups = groupReleaseVariants([
      baseSong({
        title: "猫ならばいける",
        artist: "AZKi",
        album: "",
        video_id: "animated-mv",
        tags: ["オリ曲MV", "アニAZ"],
        source_order: 1,
      }),
      baseSong({
        title: "猫ならばいける",
        artist: "AZKi",
        album: "Re:Creating world",
        video_id: "original-mv",
        tags: ["オリ曲MV"],
        source_order: 2,
      }),
      baseSong({
        title: "猫ならばいける",
        artist: "AZKi",
        album: "",
        video_id: "live-performance",
        tags: ["歌枠"],
        source_order: 3,
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].variants.map((song) => song.video_id)).toEqual([
      "original-mv",
      "animated-mv",
    ]);
    expect(groups[0].representative.video_id).toBe("original-mv");
    expect(getReleaseVariantKind(groups[0].variants[1])).toBe("animated");
    expect(groups[1].representative.video_id).toBe("live-performance");
  });

  it("片方だけのMVまたはアートトラックは単独グループとして扱う", () => {
    const groups = groupReleaseVariants([
      baseSong({ video_id: "mv-only", tags: ["オリ曲MV"] }),
      baseSong({
        video_id: "art-only",
        title: "Only Art",
        tags: ["オリ曲", "アートトラック"],
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(getReleaseVariantKind(groups[0].representative)).toBe("mv");
    expect(getReleaseVariantKind(groups[1].representative)).toBe("art-track");
  });

  it("同じリリースグループを動画インスタンスから取得できる", () => {
    const musicVideo = baseSong({
      video_id: "music-video",
      tags: ["オリ曲MV"],
    });
    const artTrack = baseSong({
      video_id: "art-track",
      tags: ["オリ曲", "アートトラック"],
    });

    expect(
      findReleaseVariantGroup([musicVideo, artTrack], artTrack)?.variants,
    ).toEqual([musicVideo, artTrack]);
  });
});
