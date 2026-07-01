import { describe, expect, it } from "vitest";
import type { Song } from "../../../types/song";
import {
  chooseReleaseRepresentative,
  getReleaseVariantKind,
  groupReleaseVariants,
  hasMultipleReleaseVariants,
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
});
