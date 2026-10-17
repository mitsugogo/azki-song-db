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
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";
import { HomeNavigationLayout } from "../HomeNavigationLayout";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));
const auth = vi.hoisted(() => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => auth);

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
  useTranslations: (namespace: string) => (key: string) => {
    const localizedMessages = state.locale === "en" ? enMessages : jaMessages;
    const messages =
      namespace === "Account"
        ? localizedMessages.Account
        : localizedMessages.DrawerMenu;
    return messages[key as keyof typeof messages] ?? key;
  },
}));

vi.mock("../../components/LanguageSwitcher", () => ({
  default: ({ compact }: { compact?: boolean }) => (
    <button>{compact ? "言語切替（コンパクト）" : "言語切替"}</button>
  ),
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
    <MantineProvider env="test">
      <HomeNavigationLayout footer={<footer>TOPのフッター</footer>}>
        <main>
          <input aria-label="TOPの検索" />
          <p>TOPの本文</p>
        </main>
      </HomeNavigationLayout>
    </MantineProvider>,
  );
}

beforeEach(() => {
  auth.useSession.mockReturnValue({ data: null, status: "unauthenticated" });
  auth.signIn.mockClear();
  auth.signOut.mockClear();
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
  it("TOPのアカウントメニューからサインインできる", async () => {
    renderLayout();

    fireEvent.click(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "アカウントメニュー",
      }),
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Googleでサインイン" }),
    );

    expect(auth.signIn).toHaveBeenCalledWith("google", {
      callbackUrl: window.location.href,
    });
  });

  it("TOPでもログイン済みのユーザー名とサインアウトを表示する", async () => {
    auth.useSession.mockReturnValue({
      data: { user: { name: "テストユーザー" } },
      status: "authenticated",
    });
    renderLayout();

    fireEvent.click(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "アカウントメニュー",
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("テストユーザー")).toBeVisible(),
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "サインアウト" }),
    );

    expect(auth.signOut).toHaveBeenCalledWith({
      callbackUrl: window.location.href,
    });
  });

  it("初回HTMLから開閉ボタンにPC用の非表示CSSを適用する", () => {
    const serverContainer = document.createElement("div");
    serverContainer.innerHTML = renderToString(
      <MantineProvider>
        <HomeNavigationLayout>
          <main>TOPの本文</main>
        </HomeNavigationLayout>
      </MantineProvider>,
    );

    const toggle = within(serverContainer).getByRole("button", {
      name: "Toggle navigation",
    });
    expect(toggle.parentElement).toHaveClass("xl:hidden");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it.each([390, 1440])(
    "幅%dpxで本文を独立してスクロールし、ヘッダーの背景を切り替える",
    async (width) => {
      viewportWidth = width;
      renderLayout();
      const header = screen.getByRole("banner");
      const viewport = screen
        .getByRole("main")
        .closest("[data-scrollarea-viewport]");
      expect(viewport).not.toBeNull();
      expect(header.closest("[data-scrollarea-viewport]")).toBeNull();
      expect(
        screen.getByRole("contentinfo").closest("[data-scrollarea-viewport]"),
      ).toBeNull();

      fireEvent.scroll(viewport!, { target: { scrollTop: 30 } });
      expect(header).toHaveClass("before:bg-white/80");

      if (width >= 1280) {
        const menu = await screen.findByRole("navigation", {
          name: "メニュー",
        });
        const menuViewport = menu.closest("[data-scrollarea-viewport]");
        expect(menuViewport).not.toBeNull();
        expect(menuViewport).not.toBe(viewport);
        fireEvent.scroll(menuViewport!, { target: { scrollTop: 0 } });
        expect(header).toHaveClass("before:bg-white/80");
      }

      fireEvent.scroll(viewport!, { target: { scrollTop: 0 } });
      expect(header).toHaveClass("before:bg-transparent");
    },
  );

  it.each([1280, 1440])(
    "幅%dpxでは左メニューを常時表示し、HOMEを選択中にする",
    async (width) => {
      viewportWidth = width;
      renderLayout();

      const menu = await screen.findByRole("navigation", { name: "メニュー" });
      const headerMenu = within(screen.getByRole("banner")).getByRole(
        "navigation",
      );
      expect(screen.getAllByRole("navigation")).toHaveLength(2);
      for (const [name, href] of [
        ["検索", "/search"],
        ["Discography", "/discography"],
        ["活動の歴史", "/activity"],
        ["記念日", "/anniversaries"],
        ["統計情報", "/statistics"],
      ]) {
        expect(within(headerMenu).getByRole("link", { name })).toHaveAttribute(
          "href",
          href,
        );
      }
      expect(within(menu).getByRole("link", { name: "HOME" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        within(menu).getByRole("link", { name: "歌ったことがある楽曲" }),
      ).toHaveAttribute("href", "/repertoire");
      expect(
        within(menu).getByRole("link", { name: "プレイリスト" }),
      ).toHaveAttribute("href", "/playlist");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const toggle = screen.getByRole("button", { name: "Toggle navigation" });
      expect(toggle.parentElement).toHaveClass("xl:hidden");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
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
    const headerMenu = within(screen.getByRole("banner")).getByRole(
      "navigation",
    );
    expect(
      within(headerMenu).getByRole("link", { name: "Search" }),
    ).toHaveAttribute("href", "/en/search");
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
