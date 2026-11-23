import React from "react";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMembersOnlyAccessToken,
  membersOnlyAccessCookieName,
} from "@/app/lib/membersOnlyAccess";
import { encodePlaylistUrlParam } from "@/app/lib/playlistUrl";
import type { Song } from "@/app/types/song";

const { fetchLookupMock, fetchSongsMock, cookiesMock, localeState } =
  vi.hoisted(() => ({
    fetchLookupMock: vi.fn(),
    fetchSongsMock: vi.fn(),
    cookiesMock: vi.fn(),
    localeState: { current: "ja" },
  }));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve(localeState.current),
  getTranslations: () =>
    Promise.resolve((key: string) => (key === "keywords" ? "AZKi,Song" : key)),
}));
vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongMetadataLookup: fetchLookupMock,
  fetchSongsFromApiCached: fetchSongsMock,
}));
vi.mock("../client", () => ({ default: () => React.createElement("div") }));
vi.mock("../../layout", () => ({
  metadata: {
    openGraph: {},
    twitter: {},
  },
}));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: {
    siteName: "AZKi Song Database",
    siteSlug: "azki-song-db",
    siteUrl: "https://example.test",
  },
}));

import { generateMetadata } from "../page";

const song: Song = {
  title: "New Song",
  artist: "AZKi",
  hl: {
    ja: { title: "New Song", artist: "AZKi", artists: ["AZKi"] },
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
  video_title: "New Song Video",
  video_uri: "https://youtu.be/video-id",
  video_id: "video-id",
  start: 10,
  end: 0,
  broadcast_at: "2026-08-15T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
};

function setRequestCookies(cookie = "") {
  const request = new NextRequest("https://example.test/watch", {
    headers: { cookie },
  });
  cookiesMock.mockResolvedValue(request.cookies);
}

function setValidMembersOnlyCookie() {
  const accessToken = createMembersOnlyAccessToken();
  if (!accessToken) throw new Error("Test access token was not created");

  const accessCookie = `${membersOnlyAccessCookieName}=${accessToken}`;
  setRequestCookies(`session=value; ${accessCookie}`);
  return accessCookie;
}

describe("watch generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MEMBERS_ONLY_SONGS_PASSWORD", "test-password");
    vi.stubEnv("MEMBERS_ONLY_COOKIE_SECRET", "test-cookie-secret");
    localeState.current = "ja";
    setRequestCookies();
    fetchLookupMock.mockResolvedValue([song]);
    fetchSongsMock.mockResolvedValue([song]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("公開曲は軽量lookupから曲別OGメタデータを生成する", async () => {
    const result = await generateMetadata({
      searchParams: Promise.resolve({ v: "video-id", t: "10" }),
    });

    expect(fetchLookupMock).toHaveBeenCalledWith({
      locale: "ja",
      videoId: "video-id",
      start: 10,
    });
    expect(fetchSongsMock).not.toHaveBeenCalled();
    expect(result.title).toBe("New Song - AZKi | AZKi Song Database");
    expect(JSON.stringify(result.openGraph?.images)).toContain(
      "/api/og/thumb?v=video-id&t=10s&hl=ja",
    );
  });

  it.each(["session=value", `${membersOnlyAccessCookieName}=invalid`])(
    "閲覧権限のない Cookie (%s) では公開曲を取得する",
    async (cookie) => {
      setRequestCookies(cookie);
      const result = await generateMetadata({
        searchParams: Promise.resolve({ v: "video-id" }),
      });

      expect(fetchLookupMock).toHaveBeenCalledExactlyOnceWith({
        locale: "ja",
        videoId: "video-id",
        start: undefined,
      });
      expect(fetchSongsMock).not.toHaveBeenCalled();
      expect(result.title).toBe("New Song - AZKi | AZKi Song Database");
    },
  );

  it("権限が有効な場合は権限 Cookie だけを送って限定曲を取得する", async () => {
    const accessCookie = setValidMembersOnlyCookie();
    fetchSongsMock.mockResolvedValue([{ ...song, title: "Members Song" }]);

    const result = await generateMetadata({
      searchParams: Promise.resolve({ v: "video-id", t: "10" }),
    });

    expect(fetchLookupMock).not.toHaveBeenCalled();
    expect(fetchSongsMock).toHaveBeenCalledExactlyOnceWith({
      locale: "ja",
      includeMembersOnly: true,
      cookie: accessCookie,
    });
    expect(result.title).toBe("Members Song - AZKi | AZKi Song Database");
  });

  it("限定曲の取得に失敗したときは公開曲を一度検索する", async () => {
    setValidMembersOnlyCookie();
    fetchSongsMock.mockRejectedValueOnce(new Error("unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateMetadata({
      searchParams: Promise.resolve({ v: "video-id", t: "10s" }),
    });

    expect(fetchLookupMock).toHaveBeenCalledExactlyOnceWith({
      locale: "ja",
      videoId: "video-id",
      start: 10,
    });
    expect(result.title).toBe("New Song - AZKi | AZKi Song Database");
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      "[watch] Failed to fetch members-only song metadata",
    );
  });

  it.each([
    { hasAccess: false, t: undefined, suffix: "" },
    { hasAccess: true, t: "10s", suffix: "&t=10s" },
  ])(
    "公開曲も取得できない場合に汎用メタデータを返す (閲覧権限=$hasAccess)",
    async ({ hasAccess, t, suffix }) => {
      if (hasAccess) {
        setValidMembersOnlyCookie();
        fetchSongsMock.mockRejectedValueOnce(new Error("unavailable"));
      }
      fetchLookupMock.mockRejectedValueOnce(new Error("unavailable"));
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await generateMetadata({
        searchParams: Promise.resolve({ v: "video-id", t }),
      });

      const canonical = `https://example.test/watch?v=video-id${suffix}`;
      expect(result.title).toBe("AZKi Song Database");
      expect(result.description).toBe("description");
      expect(result.alternates?.canonical).toBe(canonical);
      expect(result.openGraph?.url).toBe(canonical);
      expect(result.openGraph?.images).toEqual([
        {
          url: "/api/og?title=AZKi+Song+Database&subtitle=description&w=1200&h=630",
          width: 1200,
          height: 630,
          alt: "AZKi Song Database",
        },
      ]);
      expect(result.twitter?.images).toEqual([
        "/api/og?title=AZKi+Song+Database&subtitle=description&w=1200&h=630",
      ]);
      expect(warn).toHaveBeenLastCalledWith(
        "[watch] Failed to fetch public song metadata",
      );
      expect(warn).toHaveBeenCalledTimes(hasAccess ? 2 : 1);
    },
  );

  it("曲を取得できない場合もプレイリストのメタデータを生成する", async () => {
    fetchLookupMock.mockRejectedValueOnce(new Error("unavailable"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const playlist = encodePlaylistUrlParam({
      name: "My playlist",
      songs: [{ videoId: "video-id", start: "10" }],
    });

    const result = await generateMetadata({
      searchParams: Promise.resolve({ v: "video-id", t: "10", playlist }),
    });

    expect(result.title).toBe("playlist.title");
    expect(result.openGraph?.images).toEqual([
      expect.objectContaining({
        url: expect.stringMatching(/^\/api\/og\/playlist\?/),
        width: 400,
        height: 400,
      }),
    ]);
  });

  it("英語表示ではOpen Graph localeをen_USにする", async () => {
    localeState.current = "en";

    const result = await generateMetadata({
      searchParams: Promise.resolve({}),
    });

    expect(result.openGraph?.locale).toBe("en_US");
    expect(result.openGraph?.title).toBe(result.title);
    expect(result.twitter?.title).toBe(result.title);
    expect(result.openGraph?.description).toBe(result.description);
    expect(result.twitter?.description).toBe(result.description);
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(fetchLookupMock).not.toHaveBeenCalled();
    expect(fetchSongsMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      searchParams: { q: "year:2020" },
      canonical: "https://example.test/watch?q=year%3A2020",
    },
    {
      searchParams: { v: "abc" },
      canonical: "https://example.test/watch?v=abc",
    },
    {
      searchParams: { v: "abc", t: "100s" },
      canonical: "https://example.test/watch?v=abc&t=100s",
    },
    {
      searchParams: { v: "abc", t: "100" },
      canonical: "https://example.test/watch?v=abc&t=100s",
    },
    {
      searchParams: { q: "year:2020", v: "abc" },
      canonical: "https://example.test/watch?v=abc",
    },
    {
      searchParams: { q: "artist:AZKi", v: "abc", t: "100s" },
      canonical: "https://example.test/watch?v=abc&t=100s",
    },
    {
      searchParams: { videoId: "abc", t: "100s" },
      canonical: "https://example.test/watch?v=abc&t=100s",
    },
    {
      searchParams: { q: "foo", v: "abc", playlist: "xyz" },
      canonical: "https://example.test/watch?v=abc&playlist=xyz",
    },
    {
      searchParams: { q: "foo", v: "abc", t: "100s", playlist: "xyz" },
      canonical: "https://example.test/watch?v=abc&t=100s&playlist=xyz",
    },
  ])(
    "canonicalとog:urlを$canonicalに正規化する",
    async ({ searchParams, canonical }) => {
      const result = await generateMetadata({
        searchParams: Promise.resolve(searchParams),
      });

      expect(result.alternates?.canonical).toBe(canonical);
      expect(result.openGraph?.url).toBe(canonical);
    },
  );
});
