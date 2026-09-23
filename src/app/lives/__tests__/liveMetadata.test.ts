import { describe, expect, it } from "vitest";
import { buildLivePageMetadata } from "../liveMetadata";

describe("buildLivePageMetadata", () => {
  it("canonicalと共有OG/X画像を組み立てる", () => {
    const metadata = buildLivePageMetadata({
      title: "Test Live",
      description: "Test description",
      pathname: "/lives/LIVE-001",
      locale: "ja",
    });
    const openGraphImages = metadata.openGraph?.images as Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
    const imageUrl = new URL(openGraphImages[0].url, "https://example.com");

    expect(metadata.title).toBe("Test Live | AZKi Song Database");
    expect(metadata.description).toBe("Test description");
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/LIVE-001",
    );
    expect(metadata.openGraph).toMatchObject({
      description: "Test description",
      locale: "ja_JP",
    });
    expect(openGraphImages[0]).toMatchObject({
      width: 1200,
      height: 630,
      alt: "Test Live",
    });
    expect(imageUrl.pathname).toBe("/api/og");
    expect(imageUrl.searchParams.get("title")).toBe("Test Live");
    expect(imageUrl.searchParams.get("subtitle")).toBe("Test description");
    expect(imageUrl.searchParams.get("w")).toBe("1200");
    expect(imageUrl.searchParams.get("h")).toBe("630");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Test Live | AZKi Song Database",
      description: "Test description",
    });
  });
});
