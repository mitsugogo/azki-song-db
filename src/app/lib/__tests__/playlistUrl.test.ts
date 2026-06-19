import { describe, expect, it } from "vitest";
import {
  decodePlaylistOgPayload,
  decodePlaylistUrlParam,
  encodePlaylistOgPayload,
  encodePlaylistUrlParam,
  getPlaylistOgGridSize,
  tryDecodePlaylistUrlParam,
  type Playlist,
} from "../playlistUrl";

describe("playlistUrl", () => {
  const createPlaylist = (count: number): Playlist => ({
    id: "1781615621099",
    name: "2026/06/16 Forza Horizon配信で掛かってたオリ曲",
    songs: Array.from({ length: count }, (_, index) => ({
      videoId: `video-${index}`,
      start: String(index * 30),
    })),
    createdAt: "2026-06-16T13:13:41.099Z",
    updatedAt: "2026-06-16T15:01:59.267Z",
  });

  it("日本語名を含む既存プレイリスト形式をエンコード/デコードできる", () => {
    const playlist = createPlaylist(2);
    const encoded = encodePlaylistUrlParam(playlist);
    const decoded = decodePlaylistUrlParam(encoded);

    expect(decoded.name).toBe("2026/06/16 Forza Horizon配信で掛かってたオリ曲");
    expect(decoded.songs).toEqual([
      { videoId: "video-0", start: "0" },
      { videoId: "video-1", start: "30" },
    ]);
    expect(decoded.createdAt).toBe("2026-06-16T13:13:41.099Z");
    expect(decoded.updatedAt).toBe("2026-06-16T15:01:59.267Z");
  });

  it("OG payloadはbase64urlで、曲リストを先頭4曲に制限する", () => {
    const encoded = encodePlaylistOgPayload(createPlaylist(26));

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toContain("=");

    const decoded = decodePlaylistOgPayload(encoded);
    expect(decoded?.n).toBe("2026/06/16 Forza Horizon配信で掛かってたオリ曲");
    expect(decoded?.c).toBe(26);
    expect(decoded?.s).toHaveLength(4);
    expect(decoded?.s[0]).toEqual({ v: "video-0", s: "0" });
    expect(decoded?.s[3]).toEqual({ v: "video-3", s: "90" });
  });

  it("3曲以下のOG payloadは先頭1曲だけに制限する", () => {
    const encoded = encodePlaylistOgPayload(createPlaylist(3));
    const decoded = decodePlaylistOgPayload(encoded);

    expect(decoded?.c).toBe(3);
    expect(decoded?.s).toEqual([{ v: "video-0", s: "0" }]);
  });

  it.each([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 2],
    [5, 2],
    [9, 2],
    [10, 2],
    [16, 2],
    [26, 2],
  ])("%i曲のOGグリッド辺は%iになる", (count, gridSize) => {
    expect(getPlaylistOgGridSize(count)).toBe(gridSize);
  });

  it("壊れたplaylistやOG payloadは例外ではなくnullにできる", () => {
    expect(tryDecodePlaylistUrlParam("not-base64")).toBeNull();
    expect(decodePlaylistOgPayload("not-base64url")).toBeNull();
  });

  it("playlist OGP URLは正方形の専用OGルートになる", () => {
    const ogImageUrl = new URL(
      "/api/og/playlist",
      "https://azki-song-db.vercel.app",
    );
    ogImageUrl.searchParams.set(
      "p",
      encodePlaylistOgPayload(createPlaylist(4)),
    );
    ogImageUrl.searchParams.set("hl", "ja");
    ogImageUrl.searchParams.set("w", "400");
    ogImageUrl.searchParams.set("h", "400");

    expect(ogImageUrl.pathname).toBe("/api/og/playlist");
    expect(ogImageUrl.searchParams.get("p")).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(ogImageUrl.searchParams.get("hl")).toBe("ja");
    expect(ogImageUrl.searchParams.get("w")).toBe("400");
    expect(ogImageUrl.searchParams.get("h")).toBe("400");
  });
});
