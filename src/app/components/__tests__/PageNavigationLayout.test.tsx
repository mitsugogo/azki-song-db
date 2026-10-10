import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import {
  Suspense,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import PageNavigationLayout from "../PageNavigationLayout";
import SitePageLayout from "../SitePageLayout";
import Loading from "../../loading";
import { ScrollToTopButton } from "../ScrollToTopButton";
import { usePageNavigationViewport } from "../PageNavigationLayoutContext";

const state = vi.hoisted(() => ({
  pathname: "/discography",
  locale: "ja" as "ja" | "en",
  installable: false,
  songsFetchedAt: null as string | null,
  promptInstall: vi.fn(),
  loading: false,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => state.pathname,
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        event.preventDefault();
      }}
      href={
        state.locale === "en" && href?.startsWith("/") ? `/en${href}` : href
      }
    />
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
  useTranslations: (namespace: "DrawerMenu" | "Loading") => (key: string) => {
    const messages = (state.locale === "ja" ? ja : en)[namespace];
    return messages[key as keyof typeof messages] ?? key;
  },
}));

vi.mock("../Header", () => ({
  Header: ({
    navigation,
  }: {
    navigation: { opened: boolean; onToggle: () => void };
  }) => (
    <header>
      <input aria-label="ヘッダーの検索" />
      <button aria-expanded={navigation.opened} onClick={navigation.onToggle}>
        ナビゲーションを開く
      </button>
    </header>
  ),
}));

vi.mock("../Footer", () => ({
  default: () => <footer>フッター</footer>,
}));

vi.mock("../AnalyticsWrapper", () => ({
  AnalyticsWrapper: () => null,
}));

vi.mock("../../context/LoadingContext", () => ({
  useLoading: () => ({ loading: state.loading }),
}));

vi.mock("../../hook/useSongs", () => ({
  default: () => ({ songsFetchedAt: state.songsFetchedAt }),
}));

vi.mock("../../hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => ({ currentSong: null }),
}));

vi.mock("../../hook/usePWAInstall", () => ({
  default: () => ({
    isInstallable: state.installable,
    isInstalled: false,
    promptInstall: state.promptInstall,
  }),
}));

vi.mock("../Acknowledgment", () => ({
  default: () => <p>謝辞</p>,
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

function renderLayout(children: ReactNode = <main>Discographyの本文</main>) {
  return render(
    <MantineProvider>
      <PageNavigationLayout>{children}</PageNavigationLayout>
    </MantineProvider>,
  );
}

beforeEach(() => {
  state.pathname = "/discography";
  state.locale = "ja";
  state.installable = false;
  state.songsFetchedAt = null;
  state.promptInstall.mockClear();
  state.loading = false;
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
        addEventListener: (
          _: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.add(listener),
        removeEventListener: (
          _: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(listener),
      };
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '{"version":"2.44.0","buildDate":"2026-09-21T12:00:00+09:00"}',
        ),
    }),
  );
});

function siteLayoutTree(children: ReactNode) {
  return (
    <MantineProvider>
      <SitePageLayout>{children}</SitePageLayout>
    </MantineProvider>
  );
}

describe("SitePageLayout", () => {
  it.each([
    "/activity/2026/10",
    "/anniversaries",
    "/discography/album/sample",
    "/playlist/shared/sample",
    "/share",
    "/share/my-best-9-songs/sample",
    "/share/acrostic-setlist",
    "/share/where-my-azkichi-began",
    "/share/where-my-robocosan-began",
    "/units/sample",
    "/unlock-members",
    "/search",
    "/data",
    "/lives",
    "/lives/sample",
    "/lives/sample/day-1",
    "/lives/compare",
    "/repertoire",
    "/seichi-map/ranking",
    "/statistics",
    "/stream-archives",
    "/stream-archives/list",
  ])("%sの本文をMantineのスクロール領域に統一する", (pathname) => {
    state.pathname = pathname;
    render(siteLayoutTree(<main>本文</main>));
    expect(
      screen.getByRole("main").closest("[data-scrollarea-viewport]"),
    ).not.toBeNull();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it.each(["/", "/watch", "/unknown", "/discography-other", "/constructor"])(
    "%sの専用画面に通常ページのヘッダーを追加しない",
    (pathname) => {
      state.pathname = pathname;
      render(siteLayoutTree(<main>専用画面</main>));
      expect(screen.queryByRole("banner")).not.toBeInTheDocument();
      expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveTextContent("専用画面");
    },
  );

  it("本文が読み込み表示に切り替わってもヘッダーとメニューを残す", async () => {
    let ready = false;
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    function PendingPage() {
      if (!ready) throw pending;
      return <main>レパートリーの本文</main>;
    }
    const view = render(siteLayoutTree(<main>Discographyの本文</main>));
    const header = screen.getByRole("banner");
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    const search = screen.getByRole("textbox", { name: "ヘッダーの検索" });
    fireEvent.change(search, { target: { value: "AZKi" } });
    const menuViewport = menu.closest("[data-scrollarea-viewport]")!;
    menuViewport.scrollTop = 180;

    state.pathname = "/repertoire";
    view.rerender(
      siteLayoutTree(
        <Suspense fallback={<Loading />}>
          <PendingPage />
        </Suspense>,
      ),
    );

    expect(screen.getByRole("status", { name: "読み込み中" })).toBeVisible();
    expect(screen.getByRole("banner")).toBe(header);
    expect(screen.getByRole("navigation", { name: "メニュー" })).toBe(menu);
    expect(search).toHaveValue("AZKi");
    expect(menuViewport.scrollTop).toBe(180);
    expect(
      within(menu).getByRole("link", { name: "歌唱レパートリー" }),
    ).toHaveAttribute("aria-current", "page");

    await act(async () => {
      ready = true;
      finish();
      await pending;
    });
    expect(screen.getByRole("main")).toHaveTextContent("レパートリーの本文");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("banner")).toBe(header);
    expect(screen.getByRole("navigation", { name: "メニュー" })).toBe(menu);
  });

  it("ページ内スクロールは遷移時に戻し、メニューのスクロールを残す", async () => {
    const view = render(siteLayoutTree(<main>Discographyの本文</main>));
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    const menuViewport = menu.closest("[data-scrollarea-viewport]")!;
    const contentViewport = screen
      .getByRole("main")
      .closest("[data-scrollarea-viewport]")!;
    menuViewport.scrollTop = 120;
    contentViewport.scrollTop = 700;

    // 同じページの再描画でスクロール位置を失わない。
    view.rerender(siteLayoutTree(<main>更新後の本文</main>));
    expect(contentViewport.scrollTop).toBe(700);

    state.pathname = "/activity";
    view.rerender(siteLayoutTree(<main>活動の歴史の本文</main>));
    expect(screen.getByRole("navigation", { name: "メニュー" })).toBe(menu);
    expect(contentViewport.scrollTop).toBe(0);
    expect(menuViewport.scrollTop).toBe(120);
    expect(
      within(menu).getByRole("link", { name: "活動の歴史" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("手動の読み込みオーバーレイを本文内だけに表示する", async () => {
    state.loading = true;
    const { container } = render(siteLayoutTree(<main>本文</main>));
    const overlay = container.querySelector(".mantine-LoadingOverlay-root");
    const busyContent = container.querySelector('[aria-busy="true"]');
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    expect(overlay).toBeVisible();
    expect(busyContent).toContainElement(overlay as HTMLElement);
    expect(busyContent).toContainElement(screen.getByRole("main"));
    expect(busyContent).not.toContainElement(screen.getByRole("banner"));
    expect(busyContent).not.toContainElement(menu);
    expect(busyContent).not.toContainElement(screen.getByRole("contentinfo"));
  });

  it("英語ページでも読み込み表示を本文内に表示する", () => {
    state.locale = "en";
    render(siteLayoutTree(<Loading />));
    expect(screen.getByRole("status", { name: "Loading" })).toBeVisible();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("ライブ・配信アーカイブ・統計の遷移でも同じ本文領域を先頭へ戻す", async () => {
    state.pathname = "/lives/sample";
    const view = render(siteLayoutTree(<main>ライブの本文</main>));
    const header = screen.getByRole("banner");
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    const menuViewport = menu.closest("[data-scrollarea-viewport]")!;
    const contentViewport = screen
      .getByRole("main")
      .closest("[data-scrollarea-viewport]")!;
    menuViewport.scrollTop = 120;

    for (const pathname of [
      "/stream-archives",
      "/stream-archives/list",
      "/statistics",
    ]) {
      contentViewport.scrollTop = 700;
      contentViewport.scrollLeft = 50;
      state.pathname = pathname;
      view.rerender(siteLayoutTree(<main>{pathname}</main>));
      expect(
        screen.getByRole("main").closest("[data-scrollarea-viewport]"),
      ).toBe(contentViewport);
      expect(contentViewport.scrollTop).toBe(0);
      expect(contentViewport.scrollLeft).toBe(0);
      expect(menuViewport.scrollTop).toBe(120);
      expect(screen.getByRole("banner")).toBe(header);
      expect(screen.getByRole("navigation", { name: "メニュー" })).toBe(menu);
    }
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PageNavigationLayout", () => {
  it.each([
    ["/search", "検索"],
    ["/units/sample", "ユニット"],
    ["/lives/sample", "ライブ"],
    ["/repertoire", "歌唱レパートリー"],
    ["/activity/2026/10", "活動の歴史"],
    ["/anniversaries", "記念日"],
    ["/data", "全収録データ"],
    ["/stream-archives/list", "配信アーカイブ"],
    ["/seichi-map/ranking", "聖地マップ"],
    ["/statistics", "統計情報"],
    ["/playlist/shared/sample", "プレイリスト"],
    ["/share/acrostic-setlist", "縦読みセトリメーカー"],
  ])("%sでも左メニューの現在位置を表示する", async (pathname, label) => {
    state.pathname = pathname;
    renderLayout();
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    expect(within(menu).getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it.each([390, 1440])(
    "幅%dpxで本文のスクロール領域を子コンポーネントに伝える",
    async (width) => {
      viewportWidth = width;
      let observedViewport: HTMLDivElement | null = null;
      function Content() {
        const viewportRef = usePageNavigationViewport();
        useEffect(() => {
          observedViewport = viewportRef?.current ?? null;
        }, [viewportRef]);
        return <main>{viewportRef?.current ? "本文" : "準備中"}</main>;
      }
      render(
        <MantineProvider>
          <PageNavigationLayout>
            <Content />
          </PageNavigationLayout>
        </MantineProvider>,
      );
      const viewport = screen
        .getByRole("main")
        .closest("[data-scrollarea-viewport]");
      await waitFor(() =>
        expect(screen.getByRole("main")).toHaveTextContent("本文"),
      );
      expect(viewport).not.toBeNull();
      expect(observedViewport).toBe(viewport);
      expect(viewport).not.toContainElement(screen.getByRole("banner"));
    },
  );

  it("下部の更新情報と外部リンクを維持し、SNSリンクに操作名を付ける", async () => {
    state.songsFetchedAt = "2026-10-08T12:00:00+09:00";
    renderLayout();
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    const versionLink = await within(menu).findByRole("link", {
      name: "v2.44.0",
    });

    expect(versionLink).toHaveAttribute(
      "href",
      "https://github.com/mitsugogo/azki-song-db/releases/tag/v2.44.0",
    );
    expect(within(menu).getByText("Build")).toBeInTheDocument();
    expect(within(menu).getByText("2026/09/21")).toBeInTheDocument();
    expect(within(menu).getByText("Songs")).toBeInTheDocument();
    expect(within(menu).getByText("2026/10/08")).toBeInTheDocument();
    expect(
      within(menu).getByRole("link", { name: /AZKi SOLO LiVE 2025/ }),
    ).toHaveAttribute("href", "https://departure.hololivepro.com/");
    expect(
      within(menu).getByRole("link", { name: "X (mitsugogo)" }),
    ).toHaveAttribute("href", "https://x.com/mitsugogo");
    expect(
      within(menu).getByRole("link", {
        name: "GitHub (mitsugogo/azki-song-db)",
      }),
    ).toHaveAttribute("href", "https://github.com/mitsugogo/azki-song-db");
    expect(
      within(menu).queryByRole("link", { name: "不具合報告" }),
    ).not.toBeInTheDocument();
  });

  it("上部へ戻る操作は本文のScrollAreaを操作し、左メニューを動かさない", async () => {
    renderLayout(
      <main>
        Discographyの本文
        <ScrollToTopButton />
      </main>,
    );

    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    const menuViewport = menu.closest("[data-scrollarea-viewport]");
    const mainViewport = screen
      .getByRole("main")
      .closest("[data-scrollarea-viewport]");
    expect(menuViewport).not.toBeNull();
    expect(mainViewport).not.toBeNull();
    expect(mainViewport).not.toBe(menuViewport);

    const scrollTo = vi.fn();
    Object.defineProperty(mainViewport, "scrollTo", { value: scrollTo });
    const button = screen.getByRole("button", { name: "ページ上部へ戻る" });
    Object.defineProperty(menuViewport, "scrollTop", { value: 500 });
    fireEvent.scroll(menuViewport!);
    expect(button).toHaveClass("opacity-0", "pointer-events-none");

    Object.defineProperty(mainViewport, "scrollTop", { value: 500 });
    fireEvent.scroll(mainViewport!);
    expect(button).toHaveClass("opacity-100", "pointer-events-auto");
    fireEvent.click(button);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("1280px以上でメニューを常時表示し、既存のリンクを維持する", async () => {
    renderLayout();

    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(
      within(menu).getByRole("link", { name: "Discography" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(menu).getByRole("link", { name: "歌唱レパートリー" }),
    ).toHaveAttribute("href", "/repertoire");
    expect(
      within(menu).getByRole("link", { name: "プレイリスト" }),
    ).toHaveAttribute("href", "/playlist");
    expect(
      within(menu).getByRole("link", { name: "AZKi Channel" }),
    ).toHaveAttribute("href", "https://www.youtube.com/@AZKi");
    expect(screen.getByRole("main")).toHaveTextContent("Discographyの本文");
  });

  it.each([390, 1279])(
    "幅%dpxではボタンでメニューを開き、リンク選択で閉じる",
    async (width) => {
      viewportWidth = width;
      renderLayout();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

      const toggle = screen.getByRole("button", {
        name: "ナビゲーションを開く",
      });
      fireEvent.click(toggle);
      const menu = await screen.findByRole("navigation", { name: "メニュー" });
      expect(
        screen.getByRole("dialog", { name: "メニュー" }),
      ).toBeInTheDocument();
      fireEvent.click(within(menu).getByRole("link", { name: "Discography" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    },
  );

  it("開いたDrawerをPC幅で解除し、狭い幅に戻しても閉じた状態にする", async () => {
    viewportWidth = 1279;
    renderLayout();
    fireEvent.click(
      screen.getByRole("button", { name: "ナビゲーションを開く" }),
    );
    await screen.findByRole("dialog", { name: "メニュー" });

    setViewportWidth(1280);
    expect(
      screen.getByRole("navigation", { name: "メニュー" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);

    setViewportWidth(1279);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ナビゲーションを開く" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("英語のカテゴリ別ページでもDiscographyを選択中にする", async () => {
    state.locale = "en";
    state.pathname = "/discography/covers";
    renderLayout();

    const menu = await screen.findByRole("navigation", { name: "Menu" });
    const link = within(menu).getByRole("link", { name: "Discography" });
    expect(link).toHaveAttribute("href", "/en/discography");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(
      within(menu).getByRole("link", { name: "HOME" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("サイドメニューからサイト説明を開き、閉じてもメニューを残す", async () => {
    renderLayout();
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    fireEvent.click(
      within(menu).getByRole("link", { name: "このサイトについて" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "このサイトについて",
    });
    expect(within(dialog).getByText("謝辞")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(menu).toBeInTheDocument();
  });

  it("インストール可能な場合は既存のPWA操作を維持する", async () => {
    state.installable = true;
    renderLayout();
    const menu = await screen.findByRole("navigation", { name: "メニュー" });
    fireEvent.click(within(menu).getByText("アプリをインストール"));
    expect(state.promptInstall).toHaveBeenCalledOnce();
    expect(menu).toBeInTheDocument();
  });
});
