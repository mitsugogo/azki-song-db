import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

const { fetchLookupMock, fetchSongsMock, headersMock } = vi.hoisted(() => ({
  fetchLookupMock: vi.fn(),
  fetchSongsMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
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

describe("watch generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    fetchLookupMock.mockResolvedValue([song]);
    fetchSongsMock.mockResolvedValue([song]);
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

  it("Cookie付きでは限定公開対応のno-store曲取得を維持する", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "session=value" }));

    await generateMetadata({
      searchParams: Promise.resolve({ v: "video-id", t: "10" }),
    });

    expect(fetchLookupMock).not.toHaveBeenCalled();
    expect(fetchSongsMock).toHaveBeenCalledWith({
      locale: "ja",
      includeMembersOnly: true,
      cookie: "session=value",
    });
  });
});
