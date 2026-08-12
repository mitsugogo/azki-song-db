import { describe, expect, it } from "vitest";
import type { Song } from "../../../types/song";
import { getAlbumThumbnailSong } from "../albumThumbnail";

const createSong = (tags: string[], videoId: string): Song =>
  ({
    title: "テスト曲",
    artist: "AZKi",
    album: "テストアルバム",
    video_id: videoId,
    tags,
  }) as Song;

describe("getAlbumThumbnailSong", () => {
  it("アルバム内のアートトラックをサムネイルとして優先する", () => {
    const musicVideo = createSong(["オリ曲MV"], "music-video");
    const artTrack = createSong(["オリ曲", "アートトラック"], "art-track");

    expect(getAlbumThumbnailSong([musicVideo, artTrack], musicVideo)).toBe(
      artTrack,
    );
  });

  it("アートトラックがない場合は従来の代表曲を使う", () => {
    const musicVideo = createSong(["オリ曲MV"], "music-video");

    expect(getAlbumThumbnailSong([musicVideo], musicVideo)).toBe(musicVideo);
  });
});
