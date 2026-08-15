import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

const { fetchSongsMock, fetchVersionMock } = vi.hoisted(() => ({
  fetchSongsMock: vi.fn(),
  fetchVersionMock: vi.fn(),
}));

vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongsFromApiCached: fetchSongsMock,
  fetchSongsVersionFromApi: fetchVersionMock,
}));

import { GET } from "../route";

const makeSong = (title: string, videoId: string, start = 10): Song => ({
  title,
  artist: "AZKi",
  hl: {
    ja: { title, artist: "AZKi", artists: ["AZKi"] },
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
  video_title: `${title} Video`,
  video_uri: `https://youtu.be/${videoId}`,
  video_id: videoId,
  start,
  end: 0,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: ["歌枠"],
  milestones: [],
});

const lookupRequest = (locale: string, videoId?: string, start?: number) => {
  const url = new URL("https://example.test/api/songs/lookup");
  url.searchParams.set("hl", locale);
  if (videoId) url.searchParams.set("v", videoId);
  if (start !== undefined) url.searchParams.set("t", String(start));
  return new Request(url);
};

describe("songs lookup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("vがなければno-storeの400を返す", async () => {
    const response = await GET(lookupRequest("missing-v"));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(fetchVersionMock).not.toHaveBeenCalled();
  });

  it("en以外のhlは日本語のインデックスキーへ正規化する", async () => {
    fetchVersionMock.mockResolvedValue("version-locale");
    fetchSongsMock.mockResolvedValue([makeSong("Song", "video-locale")]);

    const response = await GET(
      lookupRequest("unexpected-locale", "video-locale", 10),
    );

    expect(response.status).toBe(200);
    expect(fetchVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "ja" }),
    );
    expect(fetchSongsMock).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "ja" }),
    );
  });

  it("同一世代の並行lookupで全曲取得を一度に集約する", async () => {
    const songs = [
      makeSong("Song A", "video-a"),
      makeSong("Song B", "video-b"),
    ];
    fetchVersionMock.mockResolvedValue("version-concurrent");
    let resolveSongs: ((songs: Song[]) => void) | undefined;
    fetchSongsMock.mockImplementationOnce(
      () =>
        new Promise<Song[]>((resolve) => {
          resolveSongs = resolve;
        }),
    );

    const responseAPromise = GET(lookupRequest("concurrent-test", "video-a"));
    const responseBPromise = GET(lookupRequest("concurrent-test", "video-b"));
    await vi.waitFor(() => expect(resolveSongs).toBeTypeOf("function"));
    resolveSongs?.(songs);

    const [responseA, responseB] = await Promise.all([
      responseAPromise,
      responseBPromise,
    ]);
    expect(await responseA.json()).toEqual([
      expect.objectContaining({ title: "Song A", video_id: "video-a" }),
    ]);
    expect(await responseB.json()).toEqual([
      expect.objectContaining({ title: "Song B", video_id: "video-b" }),
    ]);
    expect(fetchSongsMock).toHaveBeenCalledTimes(1);
  });

  it("世代変更時はタイトル修正と新曲追加を新しいインデックスへ切り替える", async () => {
    fetchVersionMock
      .mockResolvedValueOnce("version-a")
      .mockResolvedValueOnce("version-b")
      .mockResolvedValueOnce("version-b");
    fetchSongsMock
      .mockResolvedValueOnce([makeSong("Old title", "video-version")])
      .mockResolvedValueOnce([
        makeSong("New title", "video-version"),
        makeSong("Added song", "video-added"),
      ]);

    const first = await GET(lookupRequest("version-test", "video-version", 10));
    const second = await GET(
      lookupRequest("version-test", "video-version", 10),
    );
    const added = await GET(lookupRequest("version-test", "video-added", 10));

    expect(await first.json()).toEqual([
      expect.objectContaining({ title: "Old title" }),
    ]);
    expect(await second.json()).toEqual([
      expect.objectContaining({ title: "New title" }),
    ]);
    expect(await added.json()).toEqual([
      expect.objectContaining({ title: "Added song" }),
    ]);
    expect(fetchSongsMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ version: "version-b" }),
    );
    expect(fetchSongsMock).toHaveBeenCalledTimes(2);
  });

  it("通常インデックスに新曲がなければrecent取得結果を返す", async () => {
    const freshSong = makeSong("Fresh song", "video-fresh");
    fetchVersionMock.mockResolvedValue("version-stale");
    fetchSongsMock.mockImplementation(
      async (options: { freshness?: string }) =>
        options.freshness === "recent" ? [freshSong] : [],
    );

    const response = await GET(lookupRequest("fresh-test", "video-fresh", 10));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ title: "Fresh song" }),
    ]);
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(fetchSongsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ freshness: "recent" }),
    );
  });

  it("recent取得にも曲がなければ空配列をキャッシュしない", async () => {
    fetchVersionMock.mockResolvedValue("version-empty");
    fetchSongsMock.mockResolvedValue([]);

    const response = await GET(lookupRequest("empty-test", "video-missing"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
