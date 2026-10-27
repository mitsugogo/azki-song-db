import { describe, expect, it, vi } from "vitest";
let locale = "ja";
vi.mock("next-intl/server", () => ({
  getLocale: async () => locale,
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ locale, href }: { locale: string; href: string }) =>
    `${locale === "en" ? "/en" : ""}${href}`,
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));
import { generateMetadata } from "../page";

describe("お題管理ページのメタデータ", () => {
  it.each(["ja", "en"])(
    "%s: 一般的なOG画像とnoindexを設定する",
    async (language) => {
      locale = language;
      const metadata = await generateMetadata();
      const canonical = `https://example.test${language === "en" ? "/en" : ""}/share/my-best-9-songs/topics`;
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.openGraph?.url).toBe(canonical);
      expect(metadata.openGraph?.locale).toBe(
        language === "ja" ? "ja_JP" : "en_US",
      );
      expect(metadata.openGraph?.title).toBe(metadata.title);
      expect(metadata.twitter?.title).toBe(metadata.title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.twitter?.description).toBe(metadata.description);
      expect(metadata.twitter?.card).toBe("summary_large_image");
      const images = metadata.openGraph?.images as {
        url: string;
        width: number;
        height: number;
        alt: string;
      }[];
      expect(images[0]).toMatchObject({
        width: 1200,
        height: 630,
        alt: "manage",
      });
      const image = new URL(images[0].url, "https://example.test");
      expect(image.searchParams.get("subtitle")).toBe(metadata.description);
      expect(image.pathname).toBe("/api/og");
      expect(metadata.twitter?.images).toEqual([images[0].url]);
    },
  );
});
