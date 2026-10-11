import { cleanup, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import PolicyPage from "../PolicyPage";
import { generateMetadata as termsMetadata } from "../../terms/page";
import { generateMetadata as privacyMetadata } from "../../privacy/page";
import { viewport as termsViewport } from "../../terms/layout";
import { viewport as privacyViewport } from "../../privacy/layout";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve(state.locale),
  getTranslations: async (options: string | { namespace: string }) => {
    const namespace = typeof options === "string" ? options : options.namespace;
    const messages = (state.locale === "ja" ? ja : en) as Record<
      string,
      unknown
    >;
    const resolve = (key: string) =>
      key
        .split(".")
        .reduce<unknown>(
          (value, part) => (value as Record<string, unknown>)[part],
          messages[namespace],
        );
    return Object.assign((key: string) => resolve(key), { raw: resolve });
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      href={state.locale === "en" ? `/en${href === "/" ? "" : href}` : href}
    />
  ),
  getPathname: ({ locale, href }: { locale: string; href: string }) =>
    locale === "en" ? `/en${href}` : href,
}));

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe.each(["ja", "en"] as const)("legal pages (%s)", (locale) => {
  const messages = locale === "ja" ? ja : en;

  it.each(["terms", "privacy"] as const)(
    "%sに本文・パンくず・日付・問い合わせ・相互リンクを表示する",
    async (document) => {
      state.locale = locale;
      const content = document === "terms" ? messages.Terms : messages.Privacy;
      render(
        <MantineProvider>{await PolicyPage({ document })}</MantineProvider>,
      );
      expect(
        screen.getByRole("heading", { level: 1, name: content.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(content.description)).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Breadcrumb" }),
      ).toHaveTextContent(content.title);
      const home = within(
        screen.getByRole("navigation", { name: "Breadcrumb" }),
      ).getByRole("link", { name: "HOME" });
      expect(home).toHaveAttribute("href", locale === "en" ? "/en" : "/");
      for (const section of content.sections) {
        const region = screen.getByRole("region", { name: section.heading });
        for (const paragraph of section.paragraphs)
          expect(within(region).getByText(paragraph)).toBeInTheDocument();
      }
      expect(screen.getAllByText("2026-10-11")).toHaveLength(2);
      for (const date of screen.getAllByText("2026-10-11"))
        expect(date).toHaveAttribute("datetime", "2026-10-11");
      expect(
        screen.getByRole("link", { name: "X: @mitsugogo" }),
      ).toHaveAttribute("href", "https://x.com/mitsugogo");
      const other = document === "terms" ? "privacy" : "terms";
      expect(
        screen.getByRole("link", { name: messages.Legal[other] }),
      ).toHaveAttribute("href", `${locale === "en" ? "/en" : ""}/${other}`);
    },
  );

  it("Google情報の利用・共有範囲・削除と現在地の説明を掲載する", async () => {
    state.locale = locale;
    render(
      <MantineProvider>
        {await PolicyPage({ document: "privacy" })}
      </MantineProvider>,
    );
    const google = screen.getByRole("region", {
      name: messages.Privacy.sections.find(
        (section) => section.id === "googleAccount",
      )!.heading,
    });
    const sharing = screen.getByRole("region", {
      name: messages.Privacy.sections.find(
        (section) => section.id === "sharing",
      )!.heading,
    });
    const deletion = screen.getByRole("region", {
      name: messages.Privacy.sections.find(
        (section) => section.id === "deletion",
      )!.heading,
    });
    const location = screen.getByRole("region", {
      name: messages.Privacy.sections.find(
        (section) => section.id === "location",
      )!.heading,
    });
    expect(google).toHaveTextContent(
      locale === "ja"
        ? "メールアドレスの取得権限は要求しておらず"
        : "does not request permission to obtain your email address",
    );
    expect(google).toHaveTextContent(
      locale === "ja"
        ? "ログインセッションに含まれます"
        : "included in the sign-in session",
    );
    expect(sharing).toHaveTextContent(
      locale === "ja"
        ? "訪問日時、メモ、URL"
        : "visit dates and times, notes and URLs",
    );
    expect(deletion).toHaveTextContent(
      locale === "ja"
        ? "連携解除だけでは削除されません"
        : "does not by itself delete saved data",
    );
    expect(location).toHaveTextContent(
      locale === "ja"
        ? "訪問記録として自動保存することはありません"
        : "not automatically saved as a visit record",
    );
    expect(
      screen.getByRole("link", { name: messages.Legal.services.analytics }),
    ).toHaveAttribute(
      "href",
      "https://vercel.com/docs/analytics/privacy-policy",
    );
    expect(
      screen.getByRole("link", { name: messages.Legal.services.gsi }),
    ).toHaveAttribute("href", "https://www.gsi.go.jp/GSI/puraibasi-porisi.htm");
    expect(
      screen.getByRole("link", { name: messages.Legal.services.google }),
    ).toHaveAttribute("href", "https://policies.google.com/privacy");
  });

  it.each([
    ["terms", termsMetadata],
    ["privacy", privacyMetadata],
  ] as const)(
    "%sのcanonical・OG・Xを言語に合わせる",
    async (document, generateMetadata) => {
      state.locale = locale;
      const content = document === "terms" ? messages.Terms : messages.Privacy;
      const metadata = await generateMetadata();
      const canonical = new URL(
        `${locale === "en" ? "/en" : ""}/${document}`,
        baseUrl,
      ).toString();
      const title = `${content.title} | ${siteConfig.siteName}`;
      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(content.description);
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.openGraph).toMatchObject({
        title,
        description: content.description,
        url: canonical,
        siteName: siteConfig.siteName,
        locale: locale === "ja" ? "ja_JP" : "en_US",
        type: "website",
      });
      const [image] = metadata.openGraph?.images as {
        url: string;
        width: number;
        height: number;
        alt: string;
      }[];
      expect(image).toMatchObject({
        width: 1200,
        height: 630,
        alt: content.title,
      });
      const imageUrl = new URL(image.url, baseUrl);
      expect(imageUrl.pathname).toBe("/api/og");
      expect(Object.fromEntries(imageUrl.searchParams)).toEqual({
        title: content.title,
        subtitle: content.description,
        w: "1200",
        h: "630",
      });
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        title,
        description: content.description,
        images: [image.url],
      });
    },
  );
});

it("両ページで本文の拡大を許可する", () => {
  for (const viewport of [termsViewport, privacyViewport]) {
    expect(viewport.userScalable).toBe(true);
    expect(viewport.maximumScale).toBeGreaterThan(1);
  }
});
