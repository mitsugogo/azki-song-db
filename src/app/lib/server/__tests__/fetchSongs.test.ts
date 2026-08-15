import { afterEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import {
  fetchSongMetadataLookup,
  fetchSongsFromApiWithRecentFallback,
  fetchSongsVersionFromApi,
} from "../fetchSongs";

const makeSong = (title: string, videoId = "video-id"): Song => ({
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
  video_title: "Video",
  video_uri: `https://youtu.be/${videoId}`,
  video_id: videoId,
  start: 10,
  end: 0,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
});

const jsonResponse = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("fetchSongs server helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("通常取得に期待する曲があればfresh取得を行わない", async () => {
    const song = makeSong("Known");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([song]));

    const songs = await fetchSongsFromApiWithRecentFallback(
      { baseUrlOverride: "https://example.test" },
      (candidateSongs) => candidateSongs.some((item) => item.title === "Known"),
    );

    expect(songs).toEqual([song]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("_fresh=");
  });

  it("通常取得に曲がなければ5分bucket付きで一度だけ再取得する", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T00:02:30.000Z"));
    const freshSong = makeSong("Fresh");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([freshSong]));

    const songs = await fetchSongsFromApiWithRecentFallback(
      { locale: "ja", baseUrlOverride: "https://example.test" },
      (candidateSongs) => candidateSongs.some((item) => item.title === "Fresh"),
    );

    expect(songs).toEqual([freshSong]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const freshUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(freshUrl.searchParams.get("_fresh")).toBe(
      Math.floor(Date.now() / (5 * 60 * 1000)).toString(),
    );
  });

  it("限定公開取得はCookieを引き継ぎfresh取得へ進まない", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([]));

    await fetchSongsFromApiWithRecentFallback(
      {
        includeMembersOnly: true,
        cookie: "azki_members_only_access=token",
        baseUrlOverride: "https://example.test",
      },
      () => false,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("mo")).toBe("true");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        cache: "no-store",
        headers: { cookie: "azki_members_only_access=token" },
      }),
    );
  });

  it("HEADから曲データ世代を取得する", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        headers: { "x-songs-version": "version-a" },
      }),
    );

    await expect(
      fetchSongsVersionFromApi({ baseUrlOverride: "https://example.test" }),
    ).resolves.toBe("version-a");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: "HEAD" }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("cache");
  });

  it("公開lookupへvideoIdとstartだけを渡す", async () => {
    const entry = {
      video_id: "video-id",
      start: 10,
      title: "Song",
      artist: "AZKi",
      video_title: "Video",
      broadcast_at: "2026-01-01T00:00:00.000Z",
      tags: [],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([entry]));

    await expect(
      fetchSongMetadataLookup({
        locale: "en",
        videoId: "video-id",
        start: 10,
        baseUrlOverride: "https://example.test",
      }),
    ).resolves.toEqual([entry]);

    const lookupUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(lookupUrl.pathname).toBe("/api/songs/lookup");
    expect(lookupUrl.searchParams.get("hl")).toBe("en");
    expect(lookupUrl.searchParams.get("v")).toBe("video-id");
    expect(lookupUrl.searchParams.get("t")).toBe("10");
    expect(fetchMock.mock.calls[0]?.[1]).toBeUndefined();
  });
});
