import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({
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
  usePathname: () => "/watch",
}));

vi.mock("@mantine/core", () => ({
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

vi.mock("../../hook/useSongs", () => ({
  __esModule: true,
  default: () => ({ allSongs: [], songsFetchedAt: null }),
}));

vi.mock("../../hook/useSearch", () => ({
  __esModule: true,
  default: () => ({
    searchTerm: "artist:supercell",
    setSearchTerm: vi.fn(),
  }),
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

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
