import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageNavigationViewportContext } from "../../components/PageNavigationLayoutContext";
import StatisticsPage from "../client";

vi.mock("../../hook/useSongData", () => ({
  useSongData: () => ({ songs: [], loading: false }),
}));
vi.mock("../../hook/useStatistics", () => ({
  useStatistics: () => ({
    songCounts: [],
    originalSongCountsByReleaseDate: [],
    coverSongCountsByReleaseDate: [],
  }),
}));
vi.mock("../../hook/useReleaseViewCounts", () => ({
  default: () => ({ data: {} }),
}));
vi.mock("../SongCountOverview", () => ({ default: () => null }));
vi.mock("../datatable", () => ({ default: () => null }));
vi.mock("../tabsConfig", () => ({
  getTabsConfig: () => [
    {
      dataKey: "songCounts",
      label: "曲別",
      initialSort: { id: "title", direction: "asc" },
    },
  ],
}));

afterEach(() => vi.unstubAllGlobals());

describe("StatisticsPage scroll", () => {
  it("本文のスクロールに応じて戻るボタンを表示し、本文の先頭へ戻る", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const viewport = document.createElement("div");
    viewport.scrollTo = vi.fn();
    window.scrollTo = vi.fn();
    render(
      <MantineProvider>
        <PageNavigationViewportContext.Provider value={{ current: viewport }}>
          <StatisticsPage />
        </PageNavigationViewportContext.Provider>
      </MantineProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "backToTopAriaLabel" }),
    ).not.toBeInTheDocument();
    fireEvent.scroll(window);
    expect(
      screen.queryByRole("button", { name: "backToTopAriaLabel" }),
    ).not.toBeInTheDocument();
    viewport.scrollTop = 500;
    fireEvent.scroll(viewport);
    fireEvent.click(screen.getByRole("button", { name: "backToTopAriaLabel" }));
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
    viewport.scrollTop = 0;
    fireEvent.scroll(viewport);
    expect(
      screen.queryByRole("button", { name: "backToTopAriaLabel" }),
    ).not.toBeInTheDocument();
  });
});
