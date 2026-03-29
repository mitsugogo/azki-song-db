import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

declare global {
  var __mockNextRouter: {
    push: (...args: any[]) => any;
    replace: (...args: any[]) => any;
    back: () => any;
    refresh: () => any;
  };
}

global.__mockNextRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next-intl", () => {
  return {
    __esModule: true,
    useLocale: () => "ja",
    useTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        "detail.preview": "プレビュー",
        searchPlaceholder: "曲名、アーティスト、タグなどで検索",
      };
      return translations[key] ?? key;
    },
    NextIntlClientProvider: ({ children }: any) => children,
  };
});

vi.mock("next-intl/navigation", () => {
  return {
    __esModule: true,
    createNavigation: () => ({
      Link: (props: any) => React.createElement("a", props, props.children),
      redirect: (url: string) => {
        throw new Error(`redirect called: ${url}`);
      },
      usePathname: () => {
        try {
          const nextNav = require("next/navigation");
          return (nextNav?.usePathname?.() as string) ?? "/ja";
        } catch {
          return "/ja";
        }
      },
      useRouter: () => {
        try {
          const nextNav = require("next/navigation");
          const nextRouter = nextNav?.useRouter?.();
          return nextRouter ?? global.__mockNextRouter;
        } catch {
          return global.__mockNextRouter;
        }
      },
      getPathname: () => "/ja",
    }),
  };
});

vi.mock("@/i18n/navigation", () => {
  return {
    __esModule: true,
    Link: (props: any) => React.createElement("a", props, props.children),
    redirect: (url: string) => {
      throw new Error(`redirect called: ${url}`);
    },
    usePathname: () => {
      try {
        const nextNav = require("next/navigation");
        return (nextNav?.usePathname?.() as string) ?? "/ja";
      } catch {
        return "/ja";
      }
    },
    useRouter: () => {
      try {
        const nextNav = require("next/navigation");
        const nextRouter = nextNav?.useRouter?.();
        return nextRouter ?? global.__mockNextRouter;
      } catch {
        return global.__mockNextRouter;
      }
    },
    getPathname: () => "/ja",
  };
});
