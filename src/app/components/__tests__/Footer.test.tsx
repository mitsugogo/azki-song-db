import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import Footer from "../Footer";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: "Footer" | "Legal") => (key: string) => {
    const messages = (state.locale === "ja" ? ja : en)[namespace];
    return messages[key as keyof typeof messages];
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a {...props} href={`${state.locale === "en" ? "/en" : ""}${href}`} />
  ),
}));

let observerCallback: ResizeObserverCallback;
let observedElement: Element;

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        observerCallback = callback;
      }
      observe(element: Element) {
        observedElement = element;
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Footer", () => {
  it.each(["ja", "en"] as const)(
    "%sの説明文と2つの文書リンクを同じタブで開く",
    (locale) => {
      state.locale = locale;
      const messages = locale === "ja" ? ja : en;
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveTextContent(messages.Footer.disclaimer);
      const nav = within(footer).getByRole("navigation", {
        name: messages.Legal.linksLabel,
      });
      for (const document of ["terms", "privacy"] as const) {
        const link = within(nav).getByRole("link", {
          name: messages.Legal[document],
        });
        expect(link).toHaveAttribute(
          "href",
          `${locale === "en" ? "/en" : ""}/${document}`,
        );
        expect(link).not.toHaveAttribute("target");
      }
    },
  );

  it("フッターの折り返し・非表示に合わせて本文の余白を更新する", async () => {
    const { container } = render(<Footer />);
    const spacer = container.querySelector('[aria-hidden="true"]')!;
    expect(observedElement).toBe(screen.getByRole("contentinfo"));
    for (const height of [48, 80, 0]) {
      act(() =>
        observerCallback(
          [
            {
              target: observedElement,
              borderBoxSize: [{ inlineSize: 1024, blockSize: height }],
              contentRect: {
                x: 0,
                y: 0,
                top: 0,
                left: 0,
                bottom: height,
                right: 1024,
              },
            } as unknown as ResizeObserverEntry,
          ],
          {} as ResizeObserver,
        ),
      );
      await waitFor(() =>
        expect(spacer).toHaveStyle({ height: `${height}px` }),
      );
    }
  });
});
