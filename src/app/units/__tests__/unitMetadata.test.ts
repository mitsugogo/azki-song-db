import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Noto_Sans_JP: () => ({ variable: "--font-noto-sans" }),
}));

import {
  buildUnitPageMetadata,
  buildUnitsIndexMetadata,
} from "../unitMetadata";

describe("unit metadata", () => {
  it.each([
    [
      "index",
      buildUnitsIndexMetadata({
        title: "ユニット",
        description: "一覧",
        locale: "ja",
      }),
      "/units",
      "ユニット",
    ],
    [
      "detail",
      buildUnitPageMetadata({
        title: "あずいろ",
        description: "詳細",
        slug: "aziro",
        locale: "ja",
      }),
      "/units/aziro",
      "あずいろ",
    ],
  ])(
    "sets canonical and social metadata for the %s page",
    (_name, metadata, pathname, title) => {
      expect(metadata.alternates?.canonical?.toString()).toContain(pathname);
      expect(metadata.openGraph?.url?.toString()).toContain(pathname);
      expect(metadata.openGraph?.title).toContain(title);
      expect(metadata.openGraph?.locale).toBe("ja_JP");
      expect(metadata.twitter?.card).toBe("summary_large_image");

      const image = Array.isArray(metadata.openGraph?.images)
        ? metadata.openGraph.images[0]
        : metadata.openGraph?.images;
      const imageUrl =
        typeof image === "object" && image ? image.url.toString() : "";
      expect(imageUrl).toContain("/api/og?");
      expect(imageUrl).toContain("w=1200");
      expect(imageUrl).toContain("h=630");
    },
  );

  it("uses the English Open Graph locale", () => {
    const metadata = buildUnitPageMetadata({
      title: "AZUIRO",
      description: "Unit history",
      slug: "aziro",
      locale: "en",
    });

    expect(metadata.openGraph?.locale).toBe("en_US");
  });
});
