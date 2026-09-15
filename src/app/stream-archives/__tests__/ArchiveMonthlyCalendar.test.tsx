import { MantineProvider } from "@mantine/core";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:00:00.000Z"));

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
          participants: ["AZKi", "星街すいせい"],
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
          channels={[
            {
              branch: "hololive",
              generation: "0期生",
              talentName: "AZKi",
              artistName: "AZKi",
              youtubeId: "UC-azki",
              channelName: "AZKi Channel",
              handle: "@azki",
              subscriberCount: 0,
              iconUrl: "https://example.com/azki.png",
            },
            {
              branch: "hololive",
              generation: "0期生",
              talentName: "星街すいせい",
              artistName: "星街すいせい",
              youtubeId: "UC-suisei",
              channelName: "Suisei Channel",
              handle: "@hoshimachisuisei",
              subscriberCount: 0,
              iconUrl: "https://example.com/suisei.png",
            },
          ]}
          labels={{
            title: "月間カレンダー",
            subtitle: "日ごとの配信",
            monthLabel: "表示月",
            previousMonth: "前月を表示",
            nextMonth: "次月を表示",
            scheduledTime: (time) => `配信予定 ${time}`,
            empty: "データなし",
          }}
        />
      </MantineProvider>,
    );
    vi.useRealTimers();

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
    const participants = screen.getByTestId("activity-detail-participants");
    expect(
      within(participants).getByRole("img", { name: "AZKi" }),
    ).toBeInTheDocument();
    expect(
      within(participants).getByRole("img", { name: "星街すいせい" }),
    ).toBeInTheDocument();
    expect(
      within(participants).getByTestId("activity-detail-participant-unit-name"),
    ).toHaveTextContent("AS_tar");
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

  it("defaults to today and shows future streams with their scheduled JST time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T03:00:00.000Z"));

    const futureArchive = {
      sequence: 2,
      topic: "ライブ",
      title: "配信予定ライブ",
      video_id: "upcoming-video",
      channel_id: "channel-1",
      video_url: "https://www.youtube.com/watch?v=upcoming-video",
      video_duration: "",
      description: "",
      published_at: "2026-02-01T12:00:00.000Z",
      stream_started_at: "2026-02-01T12:00:00.000Z",
      timestamp_comment: "",
      member_only: false,
      participantEntries: [],
    };

    try {
      const { container } = render(
        <MantineProvider>
          <ArchiveMonthlyCalendar
            days={
              new Map([
                [
                  "2026-02-01",
                  {
                    dateKey: "2026-02-01",
                    streamCount: 1,
                    totalDurationSeconds: 0,
                    items: [futureArchive],
                  },
                ],
              ])
            }
            archives={[futureArchive]}
            latestMonth="2026-02"
            locale="ja"
            songs={[]}
            channels={[]}
            labels={{
              title: "月間カレンダー",
              subtitle: "日ごとの配信",
              monthLabel: "表示月",
              previousMonth: "前月を表示",
              nextMonth: "次月を表示",
              scheduledTime: (time) => `配信予定 ${time}`,
              empty: "データなし",
            }}
          />
        </MantineProvider>,
      );

      expect(
        container.querySelector('button[data-date="2026-01-15"]'),
      ).toHaveAttribute("aria-pressed", "true");
      expect(screen.queryByAltText("配信予定ライブ")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "次月を表示" }));

      expect(screen.getByAltText("配信予定ライブ")).toBeInTheDocument();
      expect(
        screen.getByTestId("activity-calendar-scheduled-time"),
      ).toHaveTextContent("配信予定 21:00");
    } finally {
      vi.useRealTimers();
    }
  });
});
