import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActivityMonthDisplay from "../ActivityMonthDisplay";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";

function makeEvent(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "event",
    occurredAt,
    href: `https://example.com/${id}`,
    importance: "normal",
    event: {
      start_at: occurredAt,
      end_at: occurredAt,
      content: id,
      place: "",
      place_url: "",
      note: "",
      url: `https://example.com/${id}`,
      importance: "normal",
    },
  };
}

function makeArchive(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "archive",
    occurredAt,
    href: `/stream-archives#archive-${id}`,
    youtubeHref: `https://www.youtube.com/watch?v=${id}`,
    videoId: id,
    importance: "normal",
    archive: {
      sequence: 1,
      topic: "雑談",
      title: `archive-${id}`,
      video_id: id,
      channel_id: "UC-test",
      video_url: `https://www.youtube.com/watch?v=${id}`,
      video_duration: "01:00:00",
      description: "",
      published_at: occurredAt,
      stream_started_at: occurredAt,
      timestamp_comment: "",
    },
  };
}

function makeMilestone(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "milestone",
    occurredAt,
    href: undefined,
    importance: "high",
    milestone: {
      date: occurredAt,
      content: id,
      note: "",
      url: "",
      place: "",
      place_url: "",
      importance: "high",
    },
  };
}

function makeAnniversary(id: string, occurredAt: string): ActivityTimelineItem {
  return {
    id,
    kind: "anniversary",
    occurredAt,
    href: "https://example.com/anniversary",
    importance: "high",
    displayName: "8周年",
    anniversary: {
      date: "01/02",
      first_date_at: "2018-01-01T15:00:00.000Z",
      name: "{n}周年",
      url: "https://example.com/anniversary",
      note: "記念日のメモ",
    },
  };
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("ActivityMonthDisplay", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("shows only the selected day below the calendar on mobile", () => {
    const { container } = render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[
            makeEvent("event-1", "2026-01-01T00:00:00.000Z"),
            makeEvent("event-2", "2026-01-01T01:00:00.000Z"),
            makeEvent("event-3", "2026-01-01T02:00:00.000Z"),
            makeEvent("event-4", "2026-01-01T03:00:00.000Z"),
            makeEvent("event-5", "2026-01-02T00:00:00.000Z"),
          ]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    expect(screen.getByTestId("activity-calendar")).toBeInTheDocument();
    expect(screen.getByText("calendarMoreItems")).toBeInTheDocument();
    const selectedDayDetails = screen.getByTestId(
      "activity-selected-day-details",
    );
    expect(selectedDayDetails).toHaveAttribute("data-activity-scope", "day");
    expect(within(selectedDayDetails).getByText("event-1")).toBeInTheDocument();

    fireEvent.click(container.querySelector('button[data-date="2026-01-02"]')!);

    expect(within(selectedDayDetails).getByText("event-5")).toBeInTheDocument();
    expect(
      within(selectedDayDetails).queryByText("event-1"),
    ).not.toBeInTheDocument();
  });

  it("shows the entire filtered month below the calendar on desktop", async () => {
    mockMatchMedia(true);
    const { container } = render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[
            makeEvent("event-1", "2026-01-01T00:00:00.000Z"),
            makeEvent("event-2", "2026-01-02T00:00:00.000Z"),
          ]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    const monthDetails = screen.getByTestId("activity-selected-day-details");
    await waitFor(() =>
      expect(monthDetails).toHaveAttribute("data-activity-scope", "month"),
    );
    expect(within(monthDetails).getByText("event-1")).toBeInTheDocument();
    expect(within(monthDetails).getByText("event-2")).toBeInTheDocument();

    fireEvent.click(container.querySelector('button[data-date="2026-01-02"]')!);

    expect(within(monthDetails).getByText("event-1")).toBeInTheDocument();
    expect(within(monthDetails).getByText("event-2")).toBeInTheDocument();
  });

  it("switches to the timeline and applies the shared archive filter", async () => {
    render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[
            makeEvent("event", "2026-01-01T00:00:00.000Z"),
            makeArchive("archive", "2026-01-02T00:00:00.000Z"),
            makeMilestone("milestone", "2026-01-03T00:00:00.000Z"),
          ]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "activityFilterLabel" }),
    );
    const archivesFilter = await screen.findByRole("checkbox", {
      name: "activityFilterArchives",
      hidden: true,
    });
    fireEvent.click(archivesFilter);

    fireEvent.click(screen.getByText("timelineView"));

    await waitFor(() =>
      expect(screen.queryByText("archive-archive")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "event" })).toBeInTheDocument();
    expect(screen.getByText("milestone")).toBeInTheDocument();
  });

  it("opens item details from calendar previews without nesting controls", async () => {
    render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[
            makeEvent("first-day", "2026-01-01T00:00:00.000Z"),
            makeEvent("event-2", "2026-01-02T00:00:00.000Z"),
            makeArchive("archive-1", "2026-01-02T01:00:00.000Z"),
            makeArchive("archive-2", "2026-01-02T02:00:00.000Z"),
            makeArchive("archive-3", "2026-01-02T03:00:00.000Z"),
          ]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    const calendar = screen.getByTestId("activity-calendar");
    const secondDayButton = calendar.querySelector(
      'button[data-date="2026-01-02"]',
    )!;
    const secondDayCell = secondDayButton.closest("td")!;
    const thumbnails = within(secondDayCell).getAllByTestId(
      "activity-calendar-thumbnail",
    );

    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0].parentElement).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
    );
    expect(thumbnails[0]).not.toHaveClass("hidden");
    expect(thumbnails[1]).toHaveClass("hidden", "sm:block");
    expect(
      within(secondDayCell).getByAltText("archive-archive-1"),
    ).toBeInTheDocument();
    expect(
      within(secondDayCell).getByAltText("archive-archive-2"),
    ).toBeInTheDocument();
    expect(
      within(secondDayCell).queryByAltText("archive-archive-3"),
    ).not.toBeInTheDocument();
    expect(within(secondDayCell).getByText("event-2")).toBeVisible();
    expect(within(secondDayCell).getByText("calendarMoreItems")).toBeVisible();
    expect(secondDayButton.contains(thumbnails[0])).toBe(false);

    fireEvent.click(secondDayButton);
    expect(
      screen.queryByTestId("activity-detail-content"),
    ).not.toBeInTheDocument();

    thumbnails[0].focus();
    fireEvent.click(thumbnails[0]);
    const drawer = await screen.findByTestId("activity-detail-content");
    expect(drawer).toHaveAttribute("data-activity-id", "archive-1");
    expect(
      drawer.querySelector('a[href="/stream-archives#archive-archive-1"]'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "calendarActivityDetailClose" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("activity-detail-content"),
      ).not.toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(thumbnails[0]);

    const eventButton = within(secondDayCell)
      .getByText("event-2")
      .closest("button")!;
    fireEvent.click(eventButton);

    expect(
      await screen.findByTestId("activity-detail-content"),
    ).toHaveAttribute("data-activity-id", "event-2");
    expect(
      screen.getByTestId("activity-selected-day-details"),
    ).toHaveTextContent("event-2");

    eventButton.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
      code: "Escape",
    });
    await waitFor(() =>
      expect(
        screen.queryByTestId("activity-detail-content"),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByTestId("activity-selected-day-details"),
    ).toHaveTextContent("event-2");
  });

  it("uses the full cell width for a single archive thumbnail", () => {
    const { container } = render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[makeArchive("single", "2026-01-02T01:00:00.000Z")]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    const dayButton = container.querySelector('button[data-date="2026-01-02"]');
    const thumbnailGrid = dayButton
      ?.closest("td")
      ?.querySelector('[data-testid="activity-calendar-thumbnails"]');

    expect(thumbnailGrid).toHaveClass("w-full", "grid-cols-1");
    expect(thumbnailGrid).not.toHaveClass("grid-cols-2");
  });

  it("opens the drawer from selected-day details and keeps timeline links direct", async () => {
    render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[makeEvent("mobile-event", "2026-01-02T01:00:00.000Z")]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    const selectedDayDetails = screen.getByTestId(
      "activity-selected-day-details",
    );
    fireEvent.click(
      within(selectedDayDetails).getAllByRole("button", {
        name: "calendarOpenActivityDetail",
      })[0],
    );

    const drawer = await screen.findByTestId("activity-detail-content");
    expect(drawer).toHaveAttribute("data-activity-id", "mobile-event");
    expect(
      within(drawer).getByRole("link", { name: "mobile-event" }),
    ).toHaveAttribute("href", "https://example.com/mobile-event");

    fireEvent.click(
      screen.getByRole("button", { name: "calendarActivityDetailClose" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("activity-detail-content"),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("timelineView"));

    expect(screen.getByRole("link", { name: "mobile-event" })).toHaveAttribute(
      "href",
      "https://example.com/mobile-event",
    );
  });

  it("highlights anniversaries, opens their details, and filters them", async () => {
    const { container } = render(
      <MantineProvider>
        <ActivityMonthDisplay
          activityMonth={{ year: 2026, month: 1 }}
          items={[
            makeEvent("first-day", "2026-01-01T00:00:00.000Z"),
            makeAnniversary("anniversary", "2026-01-01T15:00:00.000Z"),
            makeArchive("anniversary-day", "2026-01-02T01:00:00.000Z"),
          ]}
          isLoading={false}
          isViewMilestonesLoading={false}
          channels={[]}
        />
      </MantineProvider>,
    );

    const anniversaryDayButton = container.querySelector(
      'button[data-date="2026-01-02"]',
    )!;
    const anniversaryDayCell = anniversaryDayButton.closest("td")!;
    const anniversaryPreview = anniversaryDayCell.querySelector(
      'button[data-activity-kind="anniversary"]',
    )!;
    const anniversaryThumbnail = within(anniversaryDayCell).getByTestId(
      "activity-calendar-thumbnail",
    );
    const mobileMarker = anniversaryDayCell.querySelector(
      'span[data-activity-kind="anniversary"]',
    );

    expect(anniversaryDayButton).toHaveClass("bg-pink-50/90");
    expect(anniversaryDayButton).not.toHaveClass("bg-linear-to-br");
    expect(anniversaryPreview).toHaveClass("border-pink-200/90");
    expect(anniversaryPreview).toHaveClass("bg-pink-100/95");
    expect(anniversaryPreview).not.toHaveClass("bg-gradient-to-r");
    expect(
      anniversaryPreview.compareDocumentPosition(anniversaryThumbnail) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(mobileMarker).toHaveClass("h-2", "w-2");

    fireEvent.click(anniversaryPreview);
    const drawer = await screen.findByTestId("activity-detail-content");
    expect(drawer).toHaveAttribute("data-activity-id", "anniversary");
    expect(within(drawer).getByText("記念日のメモ")).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "8周年" })).toHaveAttribute(
      "href",
      "https://example.com/anniversary",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "calendarActivityDetailClose" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("activity-detail-content"),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "activityFilterLabel" }),
    );
    const anniversaryFilter = await screen.findByRole("checkbox", {
      name: "activityFilterAnniversaries",
      hidden: true,
    });
    expect(anniversaryFilter).toBeChecked();
    fireEvent.click(anniversaryFilter);
    expect(
      anniversaryDayCell.querySelector(
        'button[data-activity-kind="anniversary"]',
      ),
    ).toBeNull();

    fireEvent.click(anniversaryFilter);
    fireEvent.click(screen.getByText("timelineView"));
    expect(screen.getByRole("link", { name: "8周年" })).toHaveAttribute(
      "href",
      "https://example.com/anniversary",
    );
  });
});
