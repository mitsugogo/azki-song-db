import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useSearchFilterModeData from "../useSearchFilterModeData";
import { Song } from "../../../types/song";

const createSong = (overrides: Partial<Song>): Song => ({
  title: "test",
  artist: "test",
  hl: {
    ja: {
      title: "test",
      artist: "test",
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
  video_title: "",
  video_uri: "",
  video_id: "vid",
  start: 0,
  end: 0,
  broadcast_at: "2025-01-01T00:00:00.000Z",
  year: 2025,
  tags: [],
  milestones: [],
  ...overrides,
});

describe("useSearchFilterModeData related-artists", () => {
  const songs: Song[] = [
    createSong({ title: "song1", artist: "YUI", video_id: "1" }),
    createSong({ title: "song2", artist: "YUI", video_id: "2" }),
    createSong({ title: "song3", artist: "BUMP OF CHICKEN", video_id: "3" }),
    createSong({ title: "song4", artist: "LiSA", video_id: "4" }),
    createSong({
      title: "song5",
      artist: "Unknown",
      artists: ["Aimer"],
      video_id: "5",
    }),
  ];

  it("related-artistsモードでカテゴリ配列を返す", () => {
    const { result } = renderHook(() =>
      useSearchFilterModeData(songs, "related-artists", "count-desc", "ja"),
    );

    expect(result.current.filterMode).toBe("related-artists");
    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.data.some((c) => c.categoryKey === "childhood")).toBe(
      true,
    );
  });

  it("count-descでカテゴリ内が件数降順になる", () => {
    const { result } = renderHook(() =>
      useSearchFilterModeData(songs, "related-artists", "count-desc", "ja"),
    );

    const childhood = result.current.data.find(
      (category) => category.categoryKey === "childhood",
    );

    expect(childhood?.artists[0].artist).toBe("YUI");
    expect(childhood?.artists[0].count).toBe(2);
  });

  it("alpha-ascでカテゴリ内が名前順になる", () => {
    const { result } = renderHook(() =>
      useSearchFilterModeData(songs, "related-artists", "alpha-asc", "ja"),
    );

    const childhood = result.current.data.find(
      (category) => category.categoryKey === "childhood",
    );

    expect(childhood?.artists[0].artist).toBe("BUMP OF CHICKEN");
    expect(childhood?.artists[1].artist).toBe("YUI");
  });
});
