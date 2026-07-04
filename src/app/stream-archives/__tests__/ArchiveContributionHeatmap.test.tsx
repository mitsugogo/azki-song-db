import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveContributionHeatmap from "../ArchiveContributionHeatmap";
import { createArchiveActivitySummary } from "../archiveActivity";

const labels = {
  title: "配信開始日の活動時間",
  totalDuration: (duration: string) => `合計 ${duration}`,
  yearLabel: "表示年",
  legendLess: "少ない",
  legendMore: "多い",
  cellLabel: (date: string, duration: string, count: number) =>
    `${date}: ${duration}（${count} 件）`,
  emptyCellLabel: (date: string) => `${date}: 0m`,
  noData: "配信開始日を算出できるアーカイブがありません。",
};

describe("ArchiveContributionHeatmap", () => {
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

  it("renders yearly activity and notifies date clicks", () => {
    const onDateClick = vi.fn();
    const summary = createArchiveActivitySummary([
      {
        stream_started_at: "2026-01-01T15:00:00.000Z",
        video_duration: "1:00:00",
      },
      {
        stream_started_at: "2026-01-02T01:00:00.000Z",
        video_duration: "30:00",
      },
    ]);

    render(
      <MantineProvider>
        <ArchiveContributionHeatmap
          summary={summary}
          selectedYear="2026"
          labels={labels}
          locale="ja"
          onSelectedYearChange={vi.fn()}
          onDateClick={onDateClick}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("配信開始日の活動時間")).toBeInTheDocument();
    expect(screen.getByText("合計 1h 30m")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "2026-01-02: 1h 30m（2 件）" }),
    );

    expect(onDateClick).toHaveBeenCalledWith("2026-01-02");
  });

  it("renders an empty state when no activity year is selected", () => {
    const summary = createArchiveActivitySummary([]);

    render(
      <MantineProvider>
        <ArchiveContributionHeatmap
          summary={summary}
          selectedYear={null}
          labels={labels}
          locale="ja"
          onSelectedYearChange={vi.fn()}
          onDateClick={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByText("配信開始日を算出できるアーカイブがありません。"),
    ).toBeInTheDocument();
  });
});
