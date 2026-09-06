import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: () =>
    Promise.resolve((key: string, values?: { siteName?: string }) => {
      const messages: Record<string, string> = {
        description: "AZKiさんの歌を楽しむためのデータベースです。",
        ogAlt: `${values?.siteName} のトップページ`,
      };

      return messages[key] ?? key;
    }),
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("../layout", () => ({
  metadata: {
    openGraph: {},
  },
}));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: {
    siteName: "AZKi Song Database",
  },
}));

import { generateMetadata } from "../page";

describe("TOP generateMetadata", () => {
  it("固定OG画像をOpen GraphとXカードへ設定する", async () => {
    const result = await generateMetadata();
    const expectedImage = "/top_ogp_az.png";

    expect(result.openGraph?.images).toEqual([
      {
        url: expectedImage,
        width: 1731,
        height: 909,
        alt: "AZKi Song Database のトップページ",
      },
    ]);
    expect(result.twitter).toEqual({
      card: "summary_large_image",
      title: "AZKi Song Database",
      description: "AZKiさんの歌を楽しむためのデータベースです。",
      images: [expectedImage],
    });
    expect(result.alternates).toEqual({
      canonical: "https://example.test/",
    });
  });
});
