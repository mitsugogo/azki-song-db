import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveCategoryRanking from "../ArchiveCategoryRanking";

describe("ArchiveCategoryRanking", () => {
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

  const renderRanking = (onSelectedYearChange = vi.fn()) =>
    render(
      <MantineProvider>
        <ArchiveCategoryRanking
          items={[
            {
              name: "歌枠",
              key: "歌枠",
              streamCount: 10,
              totalDurationSeconds: 3_600,
            },
            {
              name: "雑談",
              key: "雑談",
              streamCount: 5,
              totalDurationSeconds: 7_200,
            },
          ]}
          years={[2026, 2025]}
          selectedYear={null}
          labels={{
            title: "配信数の多いカテゴリ",
            subtitle: "全期間",
            streams: (count) => `${count}件`,
            duration: (duration) => duration,
            streamGauge: (name) => `${name}の配信数`,
            durationGauge: (name) => `${name}の配信時間`,
            metricStreams: "配信数",
            metricDuration: "配信時間",
            metricSwitchAriaLabel: "ランキングの並び替え",
            noData: "データなし",
            allTimeOptionLabel: "全期間",
            yearSelectAriaLabel: "カテゴリランキングの表示期間",
          }}
          formatDuration={(seconds) => `${seconds / 3_600}h`}
          onSelectedYearChange={onSelectedYearChange}
        />
      </MantineProvider>,
    );

  it("links categories to the list and shows the stream count gauge by default", () => {
    renderRanking();

    expect(screen.getByRole("link", { name: /歌枠/ })).toHaveAttribute(
      "href",
      "/stream-archives/list?series=%E6%AD%8C%E6%9E%A0",
    );
    expect(
      screen.getByRole("progressbar", { name: "歌枠の配信数" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(
      screen.getByRole("progressbar", { name: "雑談の配信数" }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(
      screen.queryByRole("progressbar", { name: "歌枠の配信時間" }),
    ).not.toBeInTheDocument();
  });

  it("swaps the ranking order and gauge when switching to the duration metric", () => {
    renderRanking();

    fireEvent.click(screen.getByRole("radio", { name: "配信時間" }));

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("雑談");
    expect(items[1]).toHaveTextContent("歌枠");
    expect(
      screen.getByRole("progressbar", { name: "雑談の配信時間" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(
      screen.getByRole("progressbar", { name: "歌枠の配信時間" }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(
      screen.queryByRole("progressbar", { name: "歌枠の配信数" }),
    ).not.toBeInTheDocument();
  });

  it("lets the user select all time or a specific year", () => {
    const onSelectedYearChange = vi.fn();
    renderRanking(onSelectedYearChange);

    const select = screen.getByRole("combobox", {
      name: "カテゴリランキングの表示期間",
    });
    expect(select).toHaveValue("全期間");

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "2026" }));
    expect(onSelectedYearChange).toHaveBeenCalledWith("2026");
  });
});
