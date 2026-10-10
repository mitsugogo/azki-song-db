import { MantineProvider } from "@mantine/core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";
import { HomeNavigationLayout } from "../HomeNavigationLayout";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      href={
        state.locale === "en" && href?.startsWith("/") ? `/en${href}` : href
      }
      onClick={(event) => {
        props.onClick?.(event);
        event.preventDefault();
      }}
    />
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
  useTranslations: () => (key: string) => {
    const messages = (state.locale === "en" ? enMessages : jaMessages)
      .DrawerMenu;
    return messages[key as keyof typeof messages] ?? key;
  },
}));

vi.mock("../../components/LanguageSwitcher", () => ({
  default: () => <button>言語切替</button>,
}));
vi.mock("../../components/ThemeToggle", () => ({
  default: () => <button>テーマ切替</button>,
}));
vi.mock("../../components/Acknowledgment", () => ({
  default: () => <p>謝辞</p>,
}));
vi.mock("../../hook/useSongs", () => ({
  default: () => ({ songsFetchedAt: null }),
}));
vi.mock("../../hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => ({ currentSong: null }),
}));
vi.mock("../../hook/usePWAInstall", () => ({
  default: () => ({
    isInstallable: false,
    isInstalled: false,
    promptInstall: vi.fn(),
  }),
}));

let viewportWidth = 1280;
const mediaListeners = new Map<
  string,
  Set<(event: MediaQueryListEvent) => void>
>();

function matches(query: string) {
  if (query === "(min-width: 80em)") return viewportWidth >= 1280;
  if (query === "(max-width: 50em)") return viewportWidth <= 800;
  return false;
}

function setViewportWidth(width: number) {
  act(() => {
    viewportWidth = width;
    mediaListeners.forEach((listeners, query) => {
      listeners.forEach((listener) =>
        listener({
          matches: matches(query),
          media: query,
        } as MediaQueryListEvent),
      );
    });
  });
}

function renderLayout() {
  return render(
    <MantineProvider>
      <HomeNavigationLayout>
        <main>
          <input aria-label="TOPの検索" />
          <p>TOPの本文</p>
        </main>
      </HomeNavigationLayout>
    </MantineProvider>,
  );
}

beforeEach(() => {
  state.locale = "ja";
  viewportWidth = 1280;
  mediaListeners.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      mediaListeners.set(query, listeners);
      return {
        matches: matches(query),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (
          _: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.add(listener),
        removeEventListener: (
          _: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(listener),
        dispatchEvent: vi.fn(),
      };
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '{"version":"2.44.1","buildDate":"2026-10-10T00:00:00.000Z"}',
        ),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HomeNavigationLayout", () => {
  it.each([1280, 1440])(
    "幅%dpxでは左メニューを常時表示し、HOMEを選択中にする",
    async (width) => {
      viewportWidth = width;
      renderLayout();

      const menu = await screen.findByRole("navigation", { name: "メニュー" });
      expect(screen.getAllByRole("navigation")).toHaveLength(1);
      expect(within(menu).getByRole("link", { name: "HOME" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        within(menu).getByRole("link", { name: "歌唱レパートリー" }),
      ).toHaveAttribute("href", "/repertoire");
      expect(
        within(menu).getByRole("link", { name: "プレイリスト" }),
      ).toHaveAttribute("href", "/playlist");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Toggle navigation" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveTextContent("TOPの本文");
      expect(screen.getByRole("button", { name: "言語切替" })).toBeVisible();
      expect(screen.getByRole("button", { name: "テーマ切替" })).toBeVisible();
    },
  );

  it.each([390, 1279])(
    "幅%dpxではハンバーガーから開き、リンク選択で閉じる",
    async (width) => {
      viewportWidth = width;
      renderLayout();

      expect(
        screen.queryByRole("navigation", { name: "メニュー" }),
      ).not.toBeInTheDocument();
      const toggle = screen.getByRole("button", { name: "Toggle navigation" });
      fireEvent.click(toggle);
      const menu = await screen.findByRole("navigation", { name: "メニュー" });
      await waitFor(() =>
        expect(screen.getByRole("dialog", { name: "メニュー" })).toBeVisible(),
      );
      fireEvent.click(within(menu).getByRole("link", { name: "プレイリスト" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    },
  );

  it("画面幅の切り替えでDrawerを閉じ、本文の入力を維持する", async () => {
    viewportWidth = 1279;
    renderLayout();
    const input = screen.getByRole("textbox", { name: "TOPの検索" });
    fireEvent.change(input, { target: { value: "AZKi" } });
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    await screen.findByRole("dialog", { name: "メニュー" });

    setViewportWidth(1280);
    expect(
      screen.getByRole("navigation", { name: "メニュー" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "TOPの検索" })).toBe(input);
    expect(input).toHaveValue("AZKi");

    setViewportWidth(1279);
    expect(
      screen.queryByRole("navigation", { name: "メニュー" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("AZKi");
  });

  it("英語でもHOMEを選択中にし、ローカライズしたリンクを表示する", async () => {
    state.locale = "en";
    renderLayout();

    const menu = await screen.findByRole("navigation", { name: "Menu" });
    const home = within(menu).getByRole("link", { name: "HOME" });
    expect(home).toHaveAttribute("href", "/en/");
    expect(home).toHaveAttribute("aria-current", "page");
    expect(
      within(menu).getByRole("link", { name: "Discography" }),
    ).toHaveAttribute("href", "/en/discography");
  });

  it("サイト説明を開いて閉じても左メニューを表示する", async () => {
    renderLayout();
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    fireEvent.click(
      within(menu).getByRole("link", { name: "このサイトについて" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "このサイトについて",
    });
    await waitFor(() => expect(within(dialog).getByText("謝辞")).toBeVisible());
    fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("navigation", { name: "メニュー" })).toBe(menu);
  });
});
