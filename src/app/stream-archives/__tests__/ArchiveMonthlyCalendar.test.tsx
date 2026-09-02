import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveMonthlyCalendar from "../ArchiveMonthlyCalendar";
import type { ArchiveCalendarDayStats } from "../archiveStats";

describe("ArchiveMonthlyCalendar", () => {
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

  it("links a day to the filtered archive list and opens a detail drawer for each stream", async () => {
    const day: ArchiveCalendarDayStats = {
      dateKey: "2026-01-02",
      streamCount: 1,
      totalDurationSeconds: 3_600,
      items: [
        {
          sequence: 1,
          topic: "雑談",
          title: "新年配信",
          video_id: "video-1",
          channel_id: "channel-1",
          video_url: "https://www.youtube.com/watch?v=video-1",
          video_duration: "PT1H",
          description: "",
          published_at: "2026-01-01T15:00:00.000Z",
          stream_started_at: "2026-01-01T15:00:00.000Z",
          timestamp_comment: "",
          participantEntries: [],
        },
      ],
    };
    const previousDay: ArchiveCalendarDayStats = {
      dateKey: "2025-12-31",
      streamCount: 0,
      totalDurationSeconds: 0,
      items: [],
    };

    render(
      <MantineProvider>
        <ArchiveMonthlyCalendar
          days={
            new Map([
              [previousDay.dateKey, previousDay],
              [day.dateKey, day],
            ])
          }
          latestMonth="2026-01"
          locale="ja"
          songs={[]}
          channels={[]}
          labels={{
            title: "月間カレンダー",
            subtitle: "日ごとの配信",
            monthLabel: "表示月",
            previousMonth: "前月を表示",
            nextMonth: "次月を表示",
            streams: (count) => `${count}件`,
            duration: (duration) => `配信時間 ${duration}`,
            more: (count) => `ほか${count}件`,
            openDate: (date) => `${date}のアーカイブを表示`,
            empty: "データなし",
            detailAriaLabel: (title) => `${title}の詳細を表示`,
            detailCloseLabel: "詳細を閉じる",
            appWatchLabel: "再生",
            castLabel: "出演",
            timestampLabel: "タイムスタンプ",
          }}
          formatDuration={() => "1h"}
        />
      </MantineProvider>,
    );

    expect(
      await screen.findByRole("link", {
        name: "2026-01-02のアーカイブを表示",
      }),
    ).toHaveAttribute(
      "href",
      "/stream-archives/list?from=2026-01-02&to=2026-01-02",
    );

    const previousMonthButton = screen.getByRole("button", {
      name: "前月を表示",
    });
    const nextMonthButton = screen.getByRole("button", {
      name: "次月を表示",
    });
    expect(previousMonthButton).toBeEnabled();
    expect(nextMonthButton).toBeDisabled();

    fireEvent.click(previousMonthButton);
    expect(
      await screen.findByRole("link", {
        name: "2025-12-31のアーカイブを表示",
      }),
    ).toBeInTheDocument();
    expect(nextMonthButton).toBeEnabled();

    fireEvent.click(nextMonthButton);
    await screen.findByRole("link", {
      name: "2026-01-02のアーカイブを表示",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "新年配信の詳細を表示" }),
    );

    const detailContent = await screen.findByTestId("archive-detail-content");
    expect(
      within(detailContent).getByRole("heading", {
        level: 2,
        name: "新年配信",
      }),
    ).toBeInTheDocument();
    expect(
      within(detailContent).getByRole("link", { name: "再生" }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=video-1");
  });
});
