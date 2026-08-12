import { describe, expect, it } from "vitest";
import type { Song } from "../../types/song";
import { getArtTrackVideoIdsHiddenFromHomeViewMilestones } from "../viewMilestoneDisplay";

const createSong = (
  videoId: string,
  tags: string[],
  title: string = "Test Song",
): Song => ({
  title,
  artist: "AZKi",
  album: "Test Album",
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
  video_id: videoId,
  start: 0,
  end: 0,
  broadcast_at: "2026-08-01T00:00:00.000Z",
  year: 2026,
  tags,
  milestones: [],
  hl: {
    ja: {
      title: "Test Song",
      artist: "AZKi",
      artists: ["AZKi"],
    },
  },
});

describe("TOPの再生数達成表示", () => {
  it("同曲のMVとアートトラックではアートトラック側だけを除外する", () => {
    const hiddenVideoIds = getArtTrackVideoIdsHiddenFromHomeViewMilestones([
      createSong("music-video", ["オリ曲MV"]),
      createSong("art-track", ["オリ曲", "アートトラック"]),
      createSong("art-track-only", ["オリ曲", "アートトラック"], "Other Song"),
    ]);

    expect(hiddenVideoIds).toEqual(new Set(["art-track"]));
  });
});
