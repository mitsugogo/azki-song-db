import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import { encodePlaylistOgPayload } from "@/app/lib/playlistUrl";

const { fetchLookupMock, fetchWithFallbackMock, fetchFontsMock } = vi.hoisted(
  () => ({
    fetchLookupMock: vi.fn(),
    fetchWithFallbackMock: vi.fn(),
    fetchFontsMock: vi.fn().mockResolvedValue([]),
  }),
);

vi.mock("next/og", () => ({
  ImageResponse: class extends Response {
    constructor(_element: unknown, options?: { headers?: HeadersInit }) {
      super("png", { status: 200, headers: options?.headers });
    }
  },
}));

vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongMetadataLookup: fetchLookupMock,
  fetchSongsFromApiWithRecentFallback: fetchWithFallbackMock,
}));

vi.mock("@/app/api/og/ogDesign", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/app/api/og/ogDesign")>();
  return { ...original, fetchOgFonts: fetchFontsMock };
});

import { GET as getThumb } from "../thumb/route";
import { GET as getGeneric } from "../route";
import { GET as getVideoThumb } from "../videothumb/route";
import { GET as getPlaylist } from "../playlist/route";
import { GET as getBestNine } from "../share/my-best-9-songs/route";

const song: Song = {
  title: "新曲",
  artist: "AZKi",
  hl: { ja: { title: "新曲", artist: "AZKi", artists: ["AZKi"] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "新曲配信",
  video_uri: "https://youtu.be/new-video",
  video_id: "new-video",
  start: 10,
  end: 0,
  broadcast_at: "2026-08-15T00:00:00.000Z",
  year: 2026,
  tags: ["新曲"],
  milestones: [],
};

const lookupSong = {
  video_id: song.video_id,
  start: song.start,
  title: song.title,
  artist: song.artist,
  video_title: song.video_title,
  broadcast_at: song.broadcast_at,
  tags: song.tags,
};

describe("generic OG cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFontsMock.mockResolvedValue([]);
  });

  it("従来URLをそのまま描画し、ブラウザ7日・Vercel CDN 1年でキャッシュする", async () => {
    const response = await getGeneric(
      new Request(
        "https://example.test/api/og?title=タイトル&subtitle=説明&w=1200&h=630",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=604800, stale-while-revalidate=900",
    );
    expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(
      "public, max-age=31536000",
    );
    expect(fetchFontsMock).toHaveBeenCalledOnce();
  });
});

describe("OG song freshness routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFontsMock.mockResolvedValue([]);
  });

  it("thumbはlookupで見つかった新曲を200で描画する", async () => {
    fetchLookupMock.mockResolvedValue([lookupSong]);

    const response = await getThumb(
      new Request(
        "https://example.test/api/og/thumb?v=new-video&t=10s&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchLookupMock).toHaveBeenCalledWith({
      locale: "ja",
      videoId: "new-video",
      start: "10",
      baseUrlOverride: "https://example.test",
    });
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "detail");
  });

  it("videothumbはlookupで見つかった新曲を200で描画する", async () => {
    fetchLookupMock.mockResolvedValue([lookupSong]);

    const response = await getVideoThumb(
      new Request(
        "https://example.test/api/og/videothumb?v=new-video&t=10s&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchLookupMock).toHaveBeenCalledWith({
      locale: "ja",
      videoId: "new-video",
      baseUrlOverride: "https://example.test",
    });
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "detail");
  });

  it("playlistは通常ミス後のrecent曲で画像を200描画する", async () => {
    fetchWithFallbackMock.mockImplementation(
      async (
        _options: unknown,
        hasExpectedSongs: (songs: Song[]) => boolean,
      ) => {
        expect(hasExpectedSongs([])).toBe(false);
        expect(hasExpectedSongs([song])).toBe(true);
        return [song];
      },
    );
    const payload = encodePlaylistOgPayload({
      name: "新曲プレイリスト",
      songs: [{ videoId: "new-video", start: "10" }],
    });

    const response = await getPlaylist(
      new Request(
        `https://example.test/api/og/playlist?p=${payload}&hl=ja&w=1200&h=630`,
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchFontsMock).toHaveBeenCalledWith(expect.any(String), "playlist");
  });

  it("好きな曲9選は通常ミス後のrecent曲で画像を200描画する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        selection: {
          title: "新曲9選",
          author: "tester",
          songs: [{ v: "new-video", s: "10" }],
        },
      }),
    );
    fetchWithFallbackMock.mockImplementation(
      async (
        _options: unknown,
        hasExpectedSongs: (songs: Song[]) => boolean,
      ) => {
        expect(hasExpectedSongs([])).toBe(false);
        expect(hasExpectedSongs([song])).toBe(true);
        return [song];
      },
    );

    const response = await getBestNine(
      new Request(
        "https://example.test/api/og/share/my-best-9-songs?id=new-selection&hl=ja",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(fetchFontsMock).toHaveBeenCalledWith(
      expect.any(String),
      "best-nine",
    );
  });
});
