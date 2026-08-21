import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: () =>
    Promise.resolve((key: string, values?: { siteName?: string }) => {
      const messages: Record<string, string> = {
        acrosticSetlistTitleWithSite: `縦読みセトリメーカー | ${values?.siteName}`,
        acrosticSetlistOgTitle: "縦読みセトリメーカー",
        lead: "AZKiさんが過去に歌唱したレパートリーから、縦読みセットリストを作成しましょう！",
      };

      return messages[key] ?? key;
    }),
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: {
    siteName: "AZKi Song Database",
  },
}));

import { generateMetadata } from "../page";

describe("acrostic setlist generateMetadata", () => {
  it("共通OG画像をOpen GraphとXカードへ設定する", async () => {
    const result = await generateMetadata();
    const expectedDescription =
      "AZKiさんが過去に歌唱したレパートリーから、縦読みセットリストを作成しましょう！";
    const expectedImage = `/api/og?title=${encodeURIComponent(
      "縦読みセトリメーカー",
    )}&subtitle=${encodeURIComponent(expectedDescription)}&w=1200&h=630`;

    expect(result.description).toBe(expectedDescription);
    expect(result.openGraph?.description).toBe(expectedDescription);
    expect(result.openGraph?.images).toEqual([
      {
        url: expectedImage,
        width: 1200,
        height: 630,
        alt: "縦読みセトリメーカー - AZKi Song Database",
      },
    ]);
    expect(result.twitter).toEqual({
      card: "summary_large_image",
      title: "縦読みセトリメーカー | AZKi Song Database",
      description: expectedDescription,
      images: [expectedImage],
    });
  });
});
