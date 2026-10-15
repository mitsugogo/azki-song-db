import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jaMessages from "@/messages/ja.json";

const { pathnameMock, pushMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameMock(),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () =>
    (key: string, values: Record<string, unknown> = {}): string => {
      const dict: Record<string, string> = {
        ...jaMessages.Header,
        toggleNavigation: "ナビゲーションを開く",
        searchPlaceholder: "曲名、アーティスト、タグなどで検索",
        languageSwitcher: "言語切替",
      };
      return (dict[key] ?? key).replace(/\{(\w+)\}/g, (_, name) =>
        String(values[name]),
      );
    },
}));

vi.mock("@mantine/core", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Burger: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>menu</button>
  ),
}));

vi.mock("@mantine/hooks", () => ({
  useDisclosure: () => [false, { toggle: vi.fn(), close: vi.fn() }] as const,
}));

vi.mock("../ThemeToggle", () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle" />,
}));

vi.mock("../FoldableToggle", () => ({
  __esModule: true,
  default: () => <div data-testid="foldable-toggle" />,
}));

vi.mock("../DrawerMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="drawer-menu" />,
}));

vi.mock("../LanguageSwitcher", () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher" />,
}));

vi.mock("../AccountMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="account-menu" />,
}));

vi.mock("../../hook/useSongs", () => ({
  __esModule: true,
  default: () => ({ allSongs: [], songsFetchedAt: null }),
}));

vi.mock("../SearchInput", () => ({
  __esModule: true,
  default: ({
    onSearchChange,
  }: {
    onSearchChange: (values: string[]) => void;
  }) => <button onClick={() => onSearchChange([])}>clear-search</button>,
}));

import { Header } from "../Header";
import { HomeHeader } from "../../home/HomeHeader";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathnameMock.mockReturnValue("/ja/watch");
    global.__mockNextRouter = {
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    };
  });

  it.each([
    ["通常ページ", <Header />],
    ["TOP", <HomeHeader drawerOpened={false} onToggleDrawer={() => {}} />],
  ])("%sではサイト名の直後に活動日数を添える", (_, header) => {
    render(header);

    const siteLink = screen.getByRole("link", { name: /AZKi SONG DATABASE/ });
    const badge = screen.getByRole("link", { name: /AZKi 活動\d+日目/ });
    expect(siteLink).toHaveAttribute("href", "/");
    expect(siteLink.parentElement).toContainElement(badge);
    expect(
      siteLink.compareDocumentPosition(badge) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("watchページで検索バーをクリアしたときはsearchに遷移せずqのみ削除する", () => {
    window.history.pushState(
      {},
      "",
      "/watch?v=JUgZ8feAFcE&t=2215s&q=artist%3Asupercell",
    );

    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "clear-search" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const target = pushMock.mock.calls[0]?.[0] as string;
    expect(target.startsWith("/search")).toBe(false);
    expect(target).toContain("/watch");
    expect(target).toContain("v=JUgZ8feAFcE");
    expect(target).toContain("t=2215s");
    expect(target).not.toContain("q=");
  });

  it("discographyページで検索バーをクリアしたときはsearchに遷移せずqのみ削除する", () => {
    pathnameMock.mockReturnValue("/ja/discography");
    window.history.pushState({}, "", "/discography?q=artist%3Asupercell");

    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "clear-search" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const target = pushMock.mock.calls[0]?.[0] as string;
    expect(target.startsWith("/search")).toBe(false);
    expect(target).toBe("/discography");
  });

  it("外部からメニューを制御する場合はボタン操作を委譲し、Drawerを重複表示しない", () => {
    const onToggle = vi.fn();
    render(
      <Header withDesktopNavigation navigation={{ opened: false, onToggle }} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "menu" }));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("drawer-menu")).not.toBeInTheDocument();
  });
});
