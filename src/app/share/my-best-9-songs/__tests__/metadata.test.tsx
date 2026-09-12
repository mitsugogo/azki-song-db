import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: () =>
    Promise.resolve((key: string, values?: { title?: string }) => {
      const messages: Record<string, string> = {
        myBest9WithTopic: `お題:「${values?.title}」 | 究極の9曲ジェネレーター | AZKi Song Database`,
        myBest9TitleWithSite: "究極の9曲ジェネレーター | AZKi Song Database",
        myBest9OgWithTopic: `お題:「${values?.title}」`,
        myBest9OgTitle: "究極の9曲ジェネレーター",
        myBest9OgDescription: "AZKiさんの楽曲から選ぶ究極の9曲の作成・共有",
      };
      return messages[key] ?? key;
    }),
}));
vi.mock("../client", () => ({ default: () => null }));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));

import { generateMetadata } from "../page";

describe("my best 9 generateMetadata", () => {
  it("お題付きタイトルへ余分な空白を入れずdescriptionをOG/Xと共有する", async () => {
    const result = await generateMetadata({
      searchParams: Promise.resolve({ title: "  春の曲  " }),
    });
    const title =
      "お題:「春の曲」 | 究極の9曲ジェネレーター | AZKi Song Database";
    const description = "AZKiさんの楽曲から選ぶ究極の9曲の作成・共有";
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
    expect(String(result.title)).toBe(String(result.title).trim());
    expect(result.openGraph?.title).toBe(title);
    expect(result.twitter?.title).toBe(title);
    expect(result.description).toBe(description);
    expect(result.openGraph?.description).toBe(description);
    expect(result.twitter?.description).toBe(description);
    expect(imageUrl.searchParams.get("subtitle")).toBe(description);
  });
});
