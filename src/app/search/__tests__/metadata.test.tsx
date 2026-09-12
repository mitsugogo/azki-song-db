import { describe, expect, it, vi } from "vitest";

const { fetchSongsMock } = vi.hoisted(() => ({
  fetchSongsMock: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: () =>
    Promise.resolve(
      (key: string, values?: { countSongs?: string; countVideos?: string }) => {
        if (key === "summary") {
          return `全${values?.countSongs}曲・${values?.countVideos}動画からの楽曲検索`;
        }
        if (key === "description") {
          return "曲名・アーティスト・タグなどによる楽曲検索";
        }
        return key;
      },
    ),
}));
vi.mock("@/app/lib/server/fetchSongs", () => ({
  fetchSongsFromApiCached: fetchSongsMock,
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));

import { generateMetadata } from "../page";

describe("search generateMetadata", () => {
  it("収録件数をmetadata専用の要約文としてOG/Xにも設定する", async () => {
    fetchSongsMock.mockResolvedValue([
      { video_id: "video-1" },
      { video_id: "video-1" },
      { video_id: "video-2" },
    ]);

    const result = await generateMetadata({
      searchParams: Promise.resolve({}),
    });
    const title = "検索 | AZKi Song Database";
    const description = "全3曲・2動画からの楽曲検索";
    const image = Array.isArray(result.openGraph?.images)
      ? result.openGraph.images[0]
      : null;
    const imageUrl = new URL(
      typeof image === "object" && image && "url" in image
        ? String(image.url)
        : "",
      "https://example.test",
    );

    expect(result.title).toBe(title);
    expect(result.description).toBe(description);
    expect(result.openGraph?.title).toBe(title);
    expect(result.openGraph?.description).toBe(description);
    expect(result.twitter?.title).toBe(title);
    expect(result.twitter?.description).toBe(description);
    expect(imageUrl.searchParams.get("subtitle")).toBe(description);
  });
});
