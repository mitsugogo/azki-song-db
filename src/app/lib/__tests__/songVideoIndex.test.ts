import { describe, expect, it } from "vitest";
import type { Song } from "../../types/song";
import { createFirstSongsByVideoId } from "../songVideoIndex";

const makeSong = (videoId: string, start: number) =>
  ({ video_id: videoId, start }) as Song;

describe("createFirstSongsByVideoId", () => {
  it("keeps the earliest song position for each video", () => {
    const laterSong = makeSong("video-1", 120);
    const earliestSong = makeSong("video-1", 15);
    const otherSong = makeSong("video-2", 30);

    const index = createFirstSongsByVideoId([
      laterSong,
      otherSong,
      earliestSong,
    ]);

    expect(index.get("video-1")).toBe(earliestSong);
    expect(index.get("video-2")).toBe(otherSong);
  });

  it("ignores songs without a video id", () => {
    const index = createFirstSongsByVideoId([makeSong("", 0)]);

    expect(index.size).toBe(0);
  });
});
