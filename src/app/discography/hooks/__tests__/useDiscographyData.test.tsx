import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../../types/song";
import { useDiscographyData } from "../useDiscographyData";

const mocks = vi.hoisted(() => ({
  useSongs: vi.fn(),
}));

vi.mock("../../../hook/useSongs", () => ({
  default: mocks.useSongs,
}));

const createSong = (
  videoId: string,
  title: string,
  overrides: Partial<Song>,
): Song =>
  ({
    video_id: videoId,
    start: 0,
    title,
    artist: "AZKi",
    sing: "AZKi",
    tags: ["オリ曲"],
    album: "",
    broadcast_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as Song;

describe("useDiscographyData", () => {
  beforeEach(() => {
    mocks.useSongs.mockReturnValue({
      allSongs: [
        createSong("original", "Original Song", {}),
        createSong("unit", "Unit Song", {
          artist: "hololive unit",
          tags: ["オリ曲", "ユニット曲"],
        }),
        createSong("overall", "Overall Song", {
          artist: "hololive members",
          tags: ["オリ曲", "全体曲"],
        }),
        createSong("fes-overall", "Fes Overall Song", {
          artist: "hololive members",
          sing: "AZKi、hololive members",
          tags: ["オリ曲", "fes全体曲"],
        }),
        createSong("official", "Official Song", {
          artist: "hololive production",
          tags: ["公式ソング"],
        }),
        createSong("official-without-azki", "Official Song without AZKi", {
          artist: "hololive production",
          sing: "hololive members",
          tags: ["公式ソング"],
        }),
      ],
      isLoading: false,
    });
  });

  it("全体曲・fes全体曲・公式ソングを専用タブに入れ、オリ曲・ユニット曲から除外する", () => {
    const { result } = renderHook(() => useDiscographyData(false, false));

    expect(result.current.tabCounts).toMatchObject({
      all: 5,
      originals: 1,
      unit: 1,
      overall: 3,
    });
    expect(
      result.current.overallSongCountsByReleaseDate.map(
        (item) => item.firstVideo.video_id,
      ),
    ).toEqual(["overall", "fes-overall", "official"]);
    expect(
      result.current.originalSongCountsByReleaseDate.map(
        (item) => item.firstVideo.video_id,
      ),
    ).toEqual(["original"]);
    expect(
      result.current.unitSongCountsByReleaseDate.map(
        (item) => item.firstVideo.video_id,
      ),
    ).toEqual(["unit"]);
  });

  it.each([false, true])(
    "Magiaを1曲・2動画として数え、MVを代表にする（アルバム集約: %s）",
    (groupByAlbum) => {
      const metadata = {
        artist: "Kalafina",
        sing: "アキ・ローゼンタール、大神ミオ、AZKi",
        sings: ["アキ・ローゼンタール", "大神ミオ", "AZKi"],
      };
      const mv = createSong("Ti2ELlQbuYc", "Magia", {
        ...metadata,
        video_title: "Magia / RosaMiA🌹 (cover)",
        tags: ["カバー曲", "カバー曲MV", "歌ってみた"],
        source_order: 1934,
        broadcast_at: "2026-08-12T00:00:00Z",
      });
      const live = createSong("X0wwLISllTM", "Magia", {
        ...metadata,
        video_title: "【3D Live ver.】Magia / RosaMiA🌹 (cover)",
        tags: ["カバー曲", "歌ってみた", "公式切り抜き"],
        source_order: 1935,
        broadcast_at: "2026-08-13T00:00:00Z",
      });
      mocks.useSongs.mockReturnValue({
        allSongs: [live, mv],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useDiscographyData(groupByAlbum, false),
      );

      expect(result.current.tabCounts).toMatchObject({ all: 1, covers: 1 });
      for (const items of [
        result.current.coverSongCountsByReleaseDate,
        result.current.allSongCountsByReleaseDate,
      ]) {
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          count: 1,
          isAlbum: false,
          firstVideo: mv,
          lastVideo: mv,
        });
        expect(items[0].videos).toHaveLength(2);
      }
    },
  );
});
