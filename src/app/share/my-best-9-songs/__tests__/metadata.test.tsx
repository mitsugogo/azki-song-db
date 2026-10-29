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
vi.mock("@/app/lib/server/bestNineTopics", () => ({
  loadBestNineTopic: vi.fn(),
}));
vi.mock("@/app/config/siteConfig", () => ({
  baseUrl: "https://example.test",
  siteConfig: { siteName: "AZKi Song Database" },
}));

import { generateMetadata } from "../page";
import { buildThemeQuery } from "@/app/lib/myBestNineSongs";

describe("my best 9 generateMetadata", () => {
  it("お題URLのcanonicalに9題を保持する", async () => {
    const themes = Array(9).fill("お題");
    const params = Object.fromEntries(
      new URLSearchParams(buildThemeQuery("募集", themes)),
    );
    const result = await generateMetadata({
      searchParams: Promise.resolve(params),
    });
    expect(result.alternates?.canonical).toBe(
      `https://example.test/share/my-best-9-songs?${buildThemeQuery("募集", themes)}`,
    );
    expect(result.openGraph?.url).toBe(result.alternates?.canonical);
  });
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
