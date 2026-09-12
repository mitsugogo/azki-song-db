import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: ({ namespace }: { namespace: string }) =>
    Promise.resolve((key: string) => {
      if (namespace === "Share" && key === "index.title") return "シェア";
      if (namespace === "Metadata.share" && key === "indexDescription") {
        return "楽曲の選択結果をSNSで共有する機能の一覧";
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

describe("share index generateMetadata", () => {
  it("ページ固有のcanonicalとOG/X画像を設定する", async () => {
    const result = await generateMetadata();
    const title = "シェア | AZKi Song Database";
    const description = "楽曲の選択結果をSNSで共有する機能の一覧";
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
    expect(result.alternates?.canonical).toBe("https://example.test/share");
    expect(result.openGraph).toMatchObject({
      title,
      description,
      url: "https://example.test/share",
      siteName: "AZKi Song Database",
      locale: "ja_JP",
      type: "website",
    });
    expect(imageUrl.pathname).toBe("/api/og");
    expect(imageUrl.searchParams.get("title")).toBe("シェア");
    expect(imageUrl.searchParams.get("subtitle")).toBe(description);
    expect(imageUrl.searchParams.get("w")).toBe("1200");
    expect(imageUrl.searchParams.get("h")).toBe("630");
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title,
      description,
    });
  });
});
