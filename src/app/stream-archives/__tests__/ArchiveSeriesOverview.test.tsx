import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ArchiveStatsItem } from "../archiveStats";
import ArchiveSeriesCard from "../ArchiveSeriesCard";
import ArchiveSeriesOverview from "../ArchiveSeriesOverview";
import {
  createArchiveSeriesGroups,
  formatArchiveSeriesDuration,
} from "../archiveSeries";

const createItem = (
  videoId: string,
  topic: string,
  startedAt: string,
  duration: string,
): ArchiveStatsItem => ({
  sequence: 1,
  topic,
  title: `${topic}の配信`,
  video_id: videoId,
  channel_id: "channel-1",
  video_url: `https://www.youtube.com/watch?v=${videoId}`,
  video_duration: duration,
  description: "",
  published_at: startedAt,
  stream_started_at: startedAt,
  timestamp_comment: "",
  participantEntries: [],
});

const labels = {
  title: "シリーズ別",
  sortLabel: "シリーズの並び順",
  sortByDuration: "総配信時間が長い順",
  sortByVideos: "動画が多い順",
  sortByRecent: "最近配信した順",
  itemsCount: (count: number) => `${count} 件`,
  openSeries: (title: string) => `${title} の動画リストを開く`,
  noData: "表示できる配信アーカイブはありません。",
};

describe("ArchiveSeriesOverview", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const items = [
    createItem("recent", "最近", "2026-03-01T00:00:00.000Z", "PT1H"),
    createItem("long", "長時間", "2025-01-01T00:00:00.000Z", "PT10H"),
    createItem("many-1", "動画多数", "2024-01-03T00:00:00.000Z", "PT30M"),
    createItem("many-2", "動画多数", "2024-01-02T00:00:00.000Z", "PT30M"),
    createItem("many-3", "動画多数", "2024-01-01T00:00:00.000Z", "PT30M"),
  ];

  const renderOverview = () =>
    render(
      <MantineProvider>
        <ArchiveSeriesOverview
          items={items}
          locale="ja"
          uncategorizedLabel="その他"
          labels={labels}
        />
      </MantineProvider>,
    );

  const cardLabels = () =>
    screen.getAllByRole("link").map((link) => link.getAttribute("aria-label"));

  it("shows the existing series cards in recent-stream order by default", () => {
    renderOverview();

    const heading = screen.getByRole("heading", { name: "シリーズ別" });
    expect(heading).toBeVisible();
    expect(heading.closest("section")).toHaveClass(
      "rounded-xl",
      "border",
      "bg-white/70",
      "p-4",
      "shadow-sm",
    );
    expect(
      screen.getByRole("combobox", { name: "シリーズの並び順" }),
    ).toHaveValue("最近配信した順");
    expect(cardLabels()).toEqual([
      "最近 の動画リストを開く",
      "長時間 の動画リストを開く",
      "動画多数 の動画リストを開く",
    ]);
    expect(
      screen.getByRole("link", { name: "長時間 の動画リストを開く" }),
    ).toHaveAttribute(
      "href",
      "/stream-archives/list?series=%E9%95%B7%E6%99%82%E9%96%93",
    );
    expect(screen.getByText("10:00:00")).toBeVisible();
  });

  it("sorts all series by total duration or video count", () => {
    renderOverview();
    const select = screen.getByRole("combobox", {
      name: "シリーズの並び順",
    });

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "総配信時間が長い順" }));
    expect(cardLabels()).toEqual([
      "長時間 の動画リストを開く",
      "動画多数 の動画リストを開く",
      "最近 の動画リストを開く",
    ]);

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "動画が多い順" }));
    expect(cardLabels()).toEqual([
      "動画多数 の動画リストを開く",
      "最近 の動画リストを開く",
      "長時間 の動画リストを開く",
    ]);
  });

  it("keeps the source series card selection behavior", () => {
    const onSelect = vi.fn();
    const group = createArchiveSeriesGroups([items[0]])[0];

    render(
      <MantineProvider>
        <ArchiveSeriesCard
          group={group}
          itemsCountLabel="1 件"
          totalDurationLabel="01:00:00"
          latestDateLabel="2026/03/01"
          openSeriesLabel="最近 の動画リストを開く"
          onSelect={onSelect}
        />
      </MantineProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "最近 の動画リストを開く" }),
    );
    expect(onSelect).toHaveBeenCalledWith("最近");
    expect(screen.getByText("01:00:00")).toBeVisible();
  });
});

describe("formatArchiveSeriesDuration", () => {
  it("formats an unbounded hour duration as hh:mm:ss", () => {
    expect(formatArchiveSeriesDuration(0)).toBe("00:00:00");
    expect(formatArchiveSeriesDuration(5 * 3_600 + 2 * 60 + 3)).toBe(
      "05:02:03",
    );
    expect(formatArchiveSeriesDuration(999 * 3_600 + 59 * 60 + 59)).toBe(
      "999:59:59",
    );
  });
});
