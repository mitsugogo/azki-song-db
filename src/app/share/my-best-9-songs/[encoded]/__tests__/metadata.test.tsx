import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
let locale = "ja";
vi.mock("next-intl/server", () => ({
  getLocale: async () => locale,
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));
import { generateMetadata } from "../layout";

describe("共有9選のOGメタデータ", () => {
  beforeEach(() => {
    locale = "ja";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        Response.json({
          selection: {
            title: "私の9曲",
            author: "作者",
            songs: [{ v: "video", s: "0" }],
          },
        }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(["ja", "en"])(
    "%s: 横長画像と大画像カードを維持し、新レイアウトのURLを共有する",
    async (language) => {
      locale = language;
      const metadata = await generateMetadata({
        params: Promise.resolve({ encoded: "selection-id" }),
      });
      const images = metadata.openGraph?.images as {
        url: string;
        width: number;
        height: number;
        alt: string;
      }[];
      expect(images[0]).toMatchObject({
        width: 1200,
        height: 630,
        alt: "私の9曲 by 作者",
      });
      const image = new URL(images[0].url, "https://example.test");
      expect(image.searchParams.get("id")).toBe("selection-id");
      expect(image.searchParams.get("hl")).toBe(language);
      expect(image.searchParams.get("w")).toBe("1200");
      expect(image.searchParams.get("h")).toBe("630");
      expect(image.searchParams.get("v")).toBe("cards-v2");
      expect(metadata.twitter?.card).toBe("summary_large_image");
      expect(metadata.twitter?.images).toEqual([images[0].url]);
      expect(metadata.openGraph?.title).toBe(metadata.title);
      expect(metadata.twitter?.title).toBe(metadata.title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.twitter?.description).toBe(metadata.description);
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    },
  );
});
