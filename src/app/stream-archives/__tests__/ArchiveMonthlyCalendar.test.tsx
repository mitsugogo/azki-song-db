import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveMonthlyCalendar from "../ArchiveMonthlyCalendar";
import type { ArchiveCalendarDayStats } from "../archiveStats";

vi.mock("../../hook/useActivityTimeline", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hook/useActivityTimeline")>();

  return {
    ...actual,
    default: () => ({
      items: [],
      isLoading: false,
      isViewMilestonesLoading: false,
    }),
  };
});

vi.mock("../../hook/useAnniversaries", () => ({
  default: () => ({ items: [], isLoading: false }),
}));

vi.mock("../../hook/useEvents", () => ({
  default: () => ({ items: [], isLoading: false }),
}));

vi.mock("../../hook/useMilestones", () => ({
  default: () => ({ items: [], isLoading: false }),
}));

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

  it("reuses the activity calendar and filters without rendering a timeline", async () => {
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
          member_only: true,
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

    const { container } = render(
      <MantineProvider>
        <ArchiveMonthlyCalendar
          days={
            new Map([
              [previousDay.dateKey, previousDay],
              [day.dateKey, day],
            ])
          }
          archives={day.items}
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
            empty: "データなし",
          }}
        />
      </MantineProvider>,
    );

    expect(screen.getByTestId("activity-calendar")).toBeInTheDocument();
    expect(
      container.querySelector('button[data-date="2026-01-02"]'),
    ).toBeInTheDocument();
    expect(screen.getByAltText("新年配信")).toBeInTheDocument();
    expect(screen.queryByText("timelineView")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-selected-day-details"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("activity-calendar-thumbnail"));
    expect(
      await screen.findByTestId("activity-detail-content"),
    ).toHaveAttribute(
      "data-activity-id",
      "archive-video-1-2026-01-01T15:00:00.000Z",
    );
    expect(screen.getByText("memberOnlyBadge")).toBeInTheDocument();
    const drawerOverlay = document.querySelector(".mantine-Drawer-overlay");
    expect(drawerOverlay).toBeInTheDocument();
    fireEvent.click(drawerOverlay!);
    await waitFor(() =>
      expect(
        screen.queryByTestId("activity-detail-content"),
      ).not.toBeInTheDocument(),
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
      container.querySelector('button[data-date="2025-12-31"]'),
    ).toBeInTheDocument();
    expect(screen.queryByAltText("新年配信")).not.toBeInTheDocument();
    expect(nextMonthButton).toBeEnabled();

    fireEvent.click(nextMonthButton);
    expect(
      container.querySelector('button[data-date="2026-01-02"]'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "activityFilterLabel" }),
    );
    fireEvent.click(
      await screen.findByRole("checkbox", {
        name: "activityFilterArchives",
        hidden: true,
      }),
    );
    expect(screen.queryByAltText("新年配信")).not.toBeInTheDocument();
  });
});
