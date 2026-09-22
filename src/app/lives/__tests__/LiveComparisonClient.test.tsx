import { render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveTitleGroup } from "@/app/types/live";
import LiveComparisonClient from "../LiveComparisonClient";

const group: LiveTitleGroup = {
  canonicalId: "test-day",
  pageSlug: "test-live",
  title: "Test Live",
  category: "ソロライブ",
  latestDate: "2025-01-01",
  totalSongs: 5,
  performances: [
    {
      id: "test-day",
      performanceSlug: "day",
      title: "Test Live",
      category: "ソロライブ",
      performance: "昼公演",
      date: "2025-01-01",
      doorsTime: "",
      startTime: "",
      venue: "横浜",
      url: "",
      performers: "AZKi",
      ticket: "",
      note: "",
      setlist: [
        { order: "01", title: "A", artist: "AZKi", singers: "", note: "" },
        { order: "02a", title: "B", artist: "AZKi", singers: "", note: "" },
      ],
    },
    {
      id: "test-night",
      performanceSlug: "night",
      title: "Test Live",
      category: "ソロライブ",
      performance: "夜公演",
      date: "2025-01-01",
      doorsTime: "",
      startTime: "",
      venue: "横浜",
      url: "",
      performers: "AZKi",
      ticket: "",
      note: "",
      setlist: [
        { order: "01", title: "A", artist: "AZKi", singers: "", note: "" },
        { order: "01-1", title: "X", artist: "AZKi", singers: "", note: "" },
        { order: "02a", title: "B", artist: "AZKi", singers: "", note: "" },
      ],
    },
  ],
};

describe("LiveComparisonClient", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("ALLを選択し、公演別の曲と演奏公演数を表示する", () => {
    render(
      <MantineProvider>
        <LiveComparisonClient group={group} />
      </MantineProvider>,
    );

    expect(screen.getByRole("heading", { name: "Test Live" })).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "allPerformances" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "昼公演" })).toHaveAttribute(
      "href",
      "/lives/test-live/day",
    );
    const table = screen.getByRole("table", { name: "comparisonTableLabel" });
    expect(
      within(table).getByRole("columnheader", { name: /昼公演/ }),
    ).toHaveTextContent("横浜");
    expect(within(table).getByText("01-1")).toBeVisible();
    expect(within(table).getAllByText("B")).toHaveLength(2);
    expect(screen.getAllByText("2 / 2")).toHaveLength(2);
    expect(screen.getAllByText("1 / 2")).toHaveLength(1);
  });

  it("公式fesの比較表ではAZKiが歌った公演のセルだけを強調する", () => {
    const officialGroup: LiveTitleGroup = {
      ...group,
      category: "公式fes",
      performances: group.performances.map((performance, index) => ({
        ...performance,
        setlist: performance.setlist.map((entry) => ({
          ...entry,
          singers: index === 0 && entry.title === "A" ? "AZKi" : "別の歌唱者",
        })),
      })),
    };
    render(
      <MantineProvider>
        <LiveComparisonClient group={officialGroup} />
      </MantineProvider>,
    );

    const table = screen.getByRole("table", { name: "comparisonTableLabel" });
    const [azkiSong, otherSong] = within(table).getAllByText("A");
    expect(azkiSong).toHaveClass("text-primary-700", "font-bold");
    expect(otherSong).toHaveClass("text-gray-900", "font-medium");
    within(table)
      .getAllByText("B")
      .forEach((song) => expect(song).not.toHaveClass("text-primary-700"));
  });
});
