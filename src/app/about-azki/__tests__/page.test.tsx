import { MantineProvider } from "@mantine/core";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import { baseUrl, siteConfig } from "../../config/siteConfig";
import AboutAzkiPage, { generateMetadata } from "../page";
import {
  glossaryGroups,
  guideColumns,
  guidePioneerProfileRows,
  guideSections,
  guideSources,
  guideSourceSection,
  guideVideoGroups,
  type GuideVideo,
} from "../content";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));

vi.mock("next-intl/server", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    getLocale: async () => state.locale,
    getTranslations: async () =>
      createTranslator({
        locale: state.locale,
        messages: state.locale === "ja" ? ja : en,
        namespace: "AboutAzki",
      }),
  };
});
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      href={
        state.locale === "en" && href?.startsWith("/") ? `/en${href}` : href
      }
    />
  ),
}));
vi.mock("../../components/YoutubeThumbnail", () => ({
  default: ({ videoId, alt }: { videoId: string; alt: string }) => (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={alt}
    />
  ),
}));
vi.mock("next/script", () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  state.locale = "ja";
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe("AboutAzkiPage", () => {
  it.each(["ja", "en"] as const)(
    "%sで本人のX投稿を引用し、開拓者のプロフィールを表で表示する",
    async (locale) => {
      state.locale = locale;
      const messages = (locale === "ja" ? ja : en).AboutAzki;
      const { container } = render(
        <MantineProvider>{await AboutAzkiPage()}</MantineProvider>,
      );
      const column = container.querySelector(
        'article[aria-labelledby="column-pioneers"]',
      )!;
      const quote = column.querySelector("blockquote")!;
      expect(quote).toHaveTextContent(
        "ついに開拓者の姿が明らかに！！！こちらです！！！",
      );
      expect(quote).toHaveAttribute(
        "cite",
        "https://x.com/AZKi_VDiVA/status/1657760488783233024",
      );
      const source = within(column as HTMLElement).getByRole("link", {
        name: messages.columns.pioneers.quoteSource,
      });
      expect(source).toHaveAttribute("href", quote.getAttribute("cite"));
      expect(source).toHaveAttribute("target", "_blank");
      expect(source).toHaveAttribute("rel", "noopener noreferrer");
      const table = within(column as HTMLElement).getByRole("table", {
        name: messages.columns.pioneers.profile.title,
      });
      expect(within(table).getAllByRole("row")).toHaveLength(5);
      for (const key of guidePioneerProfileRows) {
        const field = messages.columns.pioneers.profile[key];
        const rowHeader = within(table).getByRole("rowheader", {
          name: field.label,
        });
        expect(rowHeader).toHaveAttribute("scope", "row");
        expect(
          within(rowHeader.parentElement!).getByRole("cell"),
        ).toHaveTextContent(field.value);
      }
      expect(table).toHaveTextContent(
        locale === "ja" ? "新種のUMA" : "A new UMA",
      );
      expect(table).toHaveTextContent(
        locale === "ja"
          ? "ゲッサー類・ディーバ科"
          : "Guesser group, Diva family",
      );
      expect(table).toHaveTextContent("AZKi");
      if (locale === "ja") {
        expect(column).toHaveTextContent("現在の開拓者の姿が決まりました。");
        expect(column).not.toHaveTextContent(
          "ピンク色の架空の生き物へとまとまっていきます。",
        );
      }
    },
  );

  it.each(["ja", "en"] as const)(
    "%sの本文、出典、目次、公式動画と内部導線を表示する",
    async (locale) => {
      state.locale = locale;
      const messages = (locale === "ja" ? ja : en).AboutAzki;
      const { container } = render(
        <MantineProvider>{await AboutAzkiPage()}</MantineProvider>,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        messages.title,
      );
      const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(
        within(breadcrumb).getByRole("link", { name: "HOME" }),
      ).toHaveAttribute("href", locale === "en" ? "/en/" : "/");
      const contents = screen.getByRole("navigation", {
        name: messages.contents,
      });
      for (const link of within(contents).getAllByRole("link")) {
        expect(
          container.querySelector(link.getAttribute("href")!),
        ).toBeInTheDocument();
      }
      const references = container.querySelector(
        `section[aria-labelledby="${guideSourceSection.id}"]`,
      )!;
      expect(references).toBe(
        Array.from(container.querySelectorAll("section")).at(-1),
      );
      const referenceLinks = within(references as HTMLElement)
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("https://"));
      const referencedUrls = new Set(
        [
          ...guideSections,
          ...guideColumns,
          ...glossaryGroups.flatMap((group) => [...group.entries]),
        ]
          .flatMap((entry) => [...entry.sources])
          .map((source) => guideSources[source]),
      );
      expect(referenceLinks).toHaveLength(referencedUrls.size);
      expect(
        new Set(referenceLinks.map((link) => link.getAttribute("href"))),
      ).toEqual(referencedUrls);
      for (const link of referenceLinks) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      const enjoy = container.querySelector(
        'section[aria-labelledby="enjoy"]',
      )!;
      const firstGeoStream = within(enjoy as HTMLElement).getByRole("link", {
        name: "【GeoGuessr】ここ、どこ！？深夜の小旅行🌍【ホロライブ / AZKi】",
      });
      expect(firstGeoStream).toHaveAttribute(
        "href",
        "https://www.youtube.com/watch?v=VpSHOsTeVNo",
      );
      expect(firstGeoStream).toHaveAttribute("target", "_blank");
      expect(firstGeoStream).toHaveAttribute("rel", "noopener noreferrer");
      const verifiedGeoStream = within(enjoy as HTMLElement).getByRole("link", {
        name: messages.watchVideo.replace(
          "{title}",
          messages.videos.geoVerified,
        ),
      });
      expect(verifiedGeoStream).toHaveAttribute(
        "href",
        "https://www.youtube.com/watch?v=Nr7zUSuDzq8&t=159s",
      );
      expect(verifiedGeoStream).toHaveAttribute("target", "_blank");
      expect(verifiedGeoStream).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getAllByRole("article")).toHaveLength(3);
      for (const column of guideColumns) {
        const article = container.querySelector(
          `article[aria-labelledby="${column.id}"]`,
        )!;
        for (const paragraph of messages.columns[column.key].paragraphs) {
          expect(article).toHaveTextContent(paragraph.replace(/<[^>]+>/g, ""));
        }
        const externalLinks = article.querySelectorAll(
          ':scope > p a[href^="https://"]',
        );
        expect(externalLinks).toHaveLength(
          column.key === "microphoneMap" ? 1 : 0,
        );
        if (column.key === "microphoneMap")
          expect(externalLinks[0]).toHaveAttribute(
            "href",
            guideSources.greetingMinecraft,
          );
      }
      for (const group of glossaryGroups) {
        for (const entry of group.entries) {
          const term = container.querySelector(`#${entry.id}`)!;
          expect(term).toBeVisible();
          expect(term.nextElementSibling?.textContent).toContain(
            messages.terms[entry.key].description.replace(/<[^>]+>/g, ""),
          );
          expect(
            term.nextElementSibling?.querySelector('a[href^="https://"]'),
          ).toBeNull();
        }
      }
      expect(
        within(enjoy as HTMLElement).queryByRole("heading", { level: 3 }),
      ).toBeNull();
      const enjoyParagraphs = enjoy.querySelectorAll(":scope > p");
      for (const group of guideVideoGroups) {
        const cards = enjoyParagraphs[group.paragraph].nextElementSibling!;
        expect(within(cards as HTMLElement).getAllByRole("link")).toHaveLength(
          group.videos.length,
        );
        for (const video of group.videos as readonly GuideVideo[]) {
          const title =
            messages.videos[video.key as keyof typeof messages.videos];
          const link = within(cards as HTMLElement).getByRole("link", {
            name: messages.watchVideo.replace("{title}", title),
          });
          expect(link).toHaveAttribute(
            "href",
            `https://www.youtube.com/watch?v=${video.videoId}${video.startSeconds ? `&t=${video.startSeconds}s` : ""}`,
          );
          expect(link).toHaveAttribute("target", "_blank");
          expect(link).toHaveAttribute("rel", "noopener noreferrer");
          expect(
            within(link).getByRole("img", { name: title }),
          ).toBeInTheDocument();
        }
      }
      const prefix = locale === "en" ? "/en" : "";
      for (const path of [
        "/activity",
        "/discography",
        "/stream-archives",
        "/units",
        "/seichi-map",
      ])
        expect(
          container.querySelector(`a[href="${prefix}${path}"]`),
        ).toBeInTheDocument();
      expect(
        container.querySelector('iframe[src*="youtube.com"]'),
      ).not.toBeInTheDocument();
      expect(container.querySelector("time")).toHaveAttribute(
        "datetime",
        "2026-10-11",
      );
    },
  );

  it.each(["ja", "en"] as const)(
    "%sで関連資料を各セクションとコラムの末尾にまとめる",
    async (locale) => {
      state.locale = locale;
      const messages = (locale === "ja" ? ja : en).AboutAzki;
      const { container } = render(
        <MantineProvider>{await AboutAzkiPage()}</MantineProvider>,
      );
      const sections = guideSections.filter(
        (section) => section.id !== "columns",
      );
      for (const entry of [...sections, ...guideColumns]) {
        const scope = container.querySelector(
          `[aria-labelledby="${entry.id}"]`,
        )!;
        const related = within(scope as HTMLElement).getByRole(
          "complementary",
          {
            name: messages.relatedSources,
          },
        );
        expect(scope.lastElementChild).toBe(related);
        const sourceIds =
          entry.id === "glossary"
            ? glossaryGroups.flatMap((group) =>
                group.entries.flatMap((term) => [...term.sources]),
              )
            : entry.sources;
        const links = within(related).getAllByRole("link");
        expect(links).toHaveLength(new Set(sourceIds).size);
        for (const source of new Set(sourceIds)) {
          const link = within(related).getByRole("link", {
            name: messages.sources[source],
          });
          expect(link).toHaveAttribute("href", guideSources[source]);
          expect(link).toHaveAttribute("target", "_blank");
          expect(link).toHaveAttribute("rel", "noopener noreferrer");
        }
      }
      const music = container.querySelector(
        'section[aria-labelledby="enjoy"] aside',
      )!;
      expect(
        within(music as HTMLElement).getByRole("link", {
          name: messages.sources.externalLive,
        }),
      ).toHaveAttribute(
        "href",
        "https://hololive.hololivepro.com/events/3rd-live/",
      );
      const routes = container.querySelector(
        'article[aria-labelledby="column-routes"] aside',
      )!;
      expect(
        within(routes as HTMLElement).getByRole("link", {
          name: messages.sources.departure,
        }),
      ).toHaveAttribute(
        "href",
        "https://hololive.hololivepro.com/events/departure/",
      );
      expect(
        within(routes as HTMLElement).queryByRole("link", {
          name: messages.sources.externalLive,
        }),
      ).toBeNull();
    },
  );

  it.each(["ja", "en"] as const)(
    "%sで削除した案内を表示せず、GeoGuessrの3動画とAZロケの用語を指定位置に置く",
    async (locale) => {
      state.locale = locale;
      const { container } = render(
        <MantineProvider>{await AboutAzkiPage()}</MantineProvider>,
      );
      for (const id of [
        "column-singing",
        "term-otsuazuki",
        "term-azkiart",
        "term-singing-stream",
        "term-cover",
        "term-soraz",
        "term-as-tar",
      ]) {
        expect(container.querySelector(`#${id}`)).toBeNull();
        expect(container.querySelector(`a[href="#${id}"]`)).toBeNull();
      }
      const enjoy = container.querySelector(
        'section[aria-labelledby="enjoy"]',
      )!;
      for (const artist of ["獅子神レオナ", "エルセとさめのぽき", "AMOKA"].map(
        (name, index) =>
          locale === "en"
            ? ["Shishigami Leona", "Else and Same no Poki", "AMOKA"][index]
            : name,
      ))
        expect(enjoy).toHaveTextContent(artist);
      for (const id of ["IsTij69xLBc", "z7EC1VM9L-U", "JaTS4xhV7b8"])
        expect(enjoy.querySelector(`a[href*="${id}"]`)).toBeNull();
      const paragraphs = enjoy.querySelectorAll(":scope > p");
      expect(paragraphs[3].nextElementSibling).toBe(paragraphs[4]);
      expect(paragraphs[4].nextElementSibling).toBe(paragraphs[5]);
      const geoCards = paragraphs[5].nextElementSibling!;
      expect(
        Array.from(geoCards.querySelectorAll("a")).map((link) =>
          link.getAttribute("href"),
        ),
      ).toEqual([
        "https://www.youtube.com/watch?v=VpSHOsTeVNo",
        "https://www.youtube.com/watch?v=4iyKOmwzCP8",
        "https://www.youtube.com/watch?v=Nr7zUSuDzq8&t=159s",
      ]);
      const azLocation = container.querySelector("#term-az-location")!;
      const dokoaz = container.querySelector("#term-dokoaz")!;
      expect(azLocation.parentElement?.nextElementSibling).toBe(
        dokoaz.parentElement,
      );
      expect(dokoaz.nextElementSibling).not.toHaveTextContent(
        /ホロリー|Hololy/,
      );
      expect(dokoaz.nextElementSibling?.querySelector("a")).toHaveAttribute(
        "href",
        locale === "en" ? "/en/seichi-map" : "/seichi-map",
      );
      const pioneers = container.querySelector(
        'article[aria-labelledby="column-pioneers"]',
      )!;
      expect(pioneers).toHaveTextContent(
        locale === "ja" ? "2018年11月15日" : "November 15, 2018",
      );
      expect(pioneers).toHaveTextContent(
        locale === "ja" ? "2023年5月14日" : "May 14, 2023",
      );
      expect(
        container.querySelector("#term-azukichi")?.nextElementSibling,
      ).toHaveTextContent(
        locale === "ja" ? "AZKiさんの愛称。" : "A nickname for AZKi.",
      );
    },
  );

  it.each(["ja", "en"] as const)(
    "%sの口上コラムが3配信の経緯を表示し、末尾に時間指定の一次出典を掲載する",
    async (locale) => {
      state.locale = locale;
      const { container } = render(
        <MantineProvider>{await AboutAzkiPage()}</MantineProvider>,
      );
      const column = container.querySelector(
        'article[aria-labelledby="column-microphone-map"]',
      )!;
      for (const url of [
        "https://www.youtube.com/watch?v=OIOi62xFZzY&t=1314s",
        "https://www.youtube.com/watch?v=dbg1DbAym2o&t=181s",
        "https://www.youtube.com/watch?v=eJZGRZsoPyU&t=67s",
      ]) {
        expect(
          container.querySelector(
            `section[aria-labelledby="sources"] a[href="${url}"]`,
          ),
        ).toBeInTheDocument();
      }
      const dates =
        locale === "ja"
          ? ["2023年4月15日", "4月17日", "4月19日"]
          : ["April 15, 2023", "April 17", "April 19"];
      for (const date of dates) expect(column).toHaveTextContent(date);
      expect(column).toHaveTextContent(
        locale === "ja" ? "自己PR" : "self-presentation",
      );
      expect(column).toHaveTextContent(locale === "ja" ? "30秒" : "30 seconds");
    },
  );

  it.each(["ja", "en"] as const)(
    "%sのcanonicalとOG/Xメタデータが新ページを指す",
    async (locale) => {
      state.locale = locale;
      const messages = (locale === "ja" ? ja : en).AboutAzki;
      const metadata = await generateMetadata();
      const canonical = new URL(
        locale === "en" ? "/en/about-azki" : "/about-azki",
        baseUrl,
      ).toString();
      const title = `${messages.title} | ${siteConfig.siteName}`;
      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(messages.description);
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.openGraph).toMatchObject({
        title,
        description: messages.description,
        url: canonical,
        locale: locale === "en" ? "en_US" : "ja_JP",
        siteName: siteConfig.siteName,
        type: "website",
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
        alt: messages.title,
      });
      const imageUrl = new URL(images[0].url, baseUrl);
      expect(imageUrl.pathname).toBe("/api/og");
      expect(imageUrl.searchParams.get("title")).toBe(messages.title);
      expect(imageUrl.searchParams.get("subtitle")).toBe(messages.description);
      expect(metadata.twitter).toMatchObject({
        title,
        description: messages.description,
        card: "summary_large_image",
        images: [images[0].url],
      });
    },
  );
});

describe("guide content integrity", () => {
  it("セクション・コラム・12用語のアンカーが重複せず、出典を持つ", () => {
    const terms = glossaryGroups.flatMap((group) => [...group.entries]);
    expect(terms).toHaveLength(12);
    const entries = [...guideSections, ...guideColumns, ...terms];
    const ids = [...entries.map((entry) => entry.id), guideSourceSection.id];
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of entries) {
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources)
        expect(new URL(guideSources[source]).protocol).toBe("https:");
    }
  });

  it("日英の翻訳項目が対応し、本文と用語が欠けていない", () => {
    const keys = (value: unknown, prefix = ""): string[] => {
      if (typeof value === "string") {
        expect(value.trim().length).toBeGreaterThan(0);
        return [prefix];
      }
      return Object.entries(value as Record<string, unknown>).flatMap(
        ([key, child]) => keys(child, `${prefix}.${key}`),
      );
    };
    expect(keys(en.AboutAzki).sort()).toEqual(keys(ja.AboutAzki).sort());
  });
});
