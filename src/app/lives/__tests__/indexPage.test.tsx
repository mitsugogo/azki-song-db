import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "ja"),
  getTranslations: vi.fn(async () => (key: string) => {
    const messages: Record<string, string> = {
      title: "ライブセットリスト",
      description:
        "AZKiさんが出演したライブの日時・会場・セットリストをまとめています。",
    };
    return messages[key] ?? key;
  }),
}));

import { generateMetadata } from "../page";

describe("lives index metadata", () => {
  it("一覧ページ固有のcanonicalとOG/X画像を返す", async () => {
    const metadata = await generateMetadata();
    const image = (
      metadata.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
      }>
    )[0];
    const imageUrl = new URL(image.url, "https://example.com");

    expect(metadata.title).toBe("ライブセットリスト | AZKi Song Database");
    expect(metadata.alternates?.canonical?.toString()).toContain("/lives");
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alt: "ライブセットリスト",
    });
    expect(imageUrl.searchParams.get("title")).toBe("ライブセットリスト");
    expect(imageUrl.searchParams.get("subtitle")).toBe(metadata.description);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
    });
  });
});
