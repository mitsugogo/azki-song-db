import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import { HomeAboutAzkiLink } from "../HomeAboutAzkiLink";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: () =>
      original.createTranslator({
        locale: state.locale,
        messages: state.locale === "ja" ? ja : en,
        namespace: "AboutAzki",
      }),
  };
});
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a {...props} href={state.locale === "en" ? `/en${href}` : href} />
  ),
}));
afterEach(cleanup);

describe("HomeAboutAzkiLink", () => {
  it.each(["ja", "en"] as const)(
    "%sで紹介文と新ページへのリンクを表示する",
    (locale) => {
      state.locale = locale;
      const messages = (locale === "ja" ? ja : en).AboutAzki;
      render(<HomeAboutAzkiLink />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        locale === "ja" ? "/about-azki" : "/en/about-azki",
      );
      expect(screen.getByRole("link")).toHaveTextContent(messages.title);
      expect(screen.getByText(messages.homeDescription)).toBeInTheDocument();
    },
  );
});
