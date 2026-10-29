import { describe, expect, it, vi } from "vitest";
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href }: { href: string }) => `/en${href}`,
}));
vi.mock("../client", () => ({ default: () => null }));
import { generateMetadata } from "../page";

describe("集計ページのメタデータ", () => {
  it("noindexと一般的なOG画像を設定し、集計を公開しない", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "topic" }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph?.locale).toBe("en_US");
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.description).toBe(metadata.description);
    expect(String(metadata.alternates?.canonical)).toContain(
      "/en/share/my-best-9-songs/topics/topic/results",
    );
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });
});
