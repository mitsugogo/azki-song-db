import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadSharedPlaylistMock, sessionMock } = vi.hoisted(() => ({
  loadSharedPlaylistMock: vi.fn(),
  sessionMock: vi.fn(),
}));

vi.mock("@/app/lib/authSession", () => ({
  getOptionalServerSession: sessionMock,
}));
vi.mock("@/app/lib/server/userLibrary", () => ({
  loadSharedPlaylist: loadSharedPlaylistMock,
}));
vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("en"),
  getTranslations: () =>
    Promise.resolve((key: string, values?: { count?: number }) => {
      if (key === "title") return "Playlist";
      if (key === "sharedDescription") {
        return `A playlist containing ${values?.count} songs`;
      }
      return key;
    }),
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));

import { generateMetadata } from "../page";

describe("shared playlist generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue(null);
  });

  it("公開プレイリストへページ固有のOG/X画像を設定する", async () => {
    loadSharedPlaylistMock.mockResolvedValue({
      isOwner: false,
      playlist: {
        id: "playlist-id",
        name: "Favorites",
        visibility: "PUBLIC",
        songs: [
          { videoId: "video-1", start: "10" },
          { videoId: "video-2", start: "20" },
        ],
      },
    });

    const result = await generateMetadata({
      params: Promise.resolve({ id: "playlist-id" }),
    });
    const title = "Favorites | AZKi Song Database";
    const description = "A playlist containing 2 songs";
    const image = Array.isArray(result.openGraph?.images)
      ? result.openGraph.images[0]
      : null;
    const imageUrl = new URL(
      typeof image === "object" && image && "url" in image
        ? String(image.url)
        : "",
      "https://example.test",
    );

    expect(loadSharedPlaylistMock).toHaveBeenCalledWith(
      "playlist-id",
      undefined,
    );
    expect(result.robots).toEqual({ index: true, follow: true });
    expect(result.alternates?.canonical).toBe(
      "https://example.test/playlist/shared/playlist-id",
    );
    expect(result.openGraph).toMatchObject({
      title,
      description,
      locale: "en_US",
      siteName: "AZKi Song Database",
    });
    expect(imageUrl.pathname).toBe("/api/og");
    expect(imageUrl.searchParams.get("title")).toBe("Favorites");
    expect(imageUrl.searchParams.get("subtitle")).toBe(description);
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title,
      description,
    });
  });

  it("限定公開プレイリストはnoindexを維持する", async () => {
    loadSharedPlaylistMock.mockResolvedValue({
      isOwner: false,
      playlist: {
        id: "unlisted-id",
        name: "Unlisted",
        visibility: "UNLISTED",
        songs: [],
      },
    });

    const result = await generateMetadata({
      params: Promise.resolve({ id: "unlisted-id" }),
    });

    expect(result.robots).toEqual({ index: false, follow: false });
  });
});
