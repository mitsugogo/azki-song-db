import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import ActivityTimelineSection from "../ActivityTimelineSection";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";

describe("ActivityTimelineSection", () => {
  it("enlarges a text-only extra-high event and keeps its importance data attribute", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const item: ActivityTimelineItem = {
      id: "event-extra-high",
      kind: "event",
      occurredAt: "2026-07-01T00:00:00.000Z",
      href: "/events",
      importance: "extra_high",
      event: {
        start_at: "2026-07-01T00:00:00.000Z",
        end_at: "2026-07-01T00:00:00.000Z",
        content: "重要なイベント",
        place: "",
        place_url: "",
        note: "",
        url: "",
        importance: "extra_high",
      },
    };

    const { container } = render(
      <MantineProvider>
        <ActivityTimelineSection
          items={[item]}
          isLoading={false}
          shouldLoadViewStatistics={false}
          channels={[]}
          showTitle={false}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("link", { name: "重要なイベント" })).toHaveClass(
      "text-base",
      "sm:text-lg",
    );
    expect(
      container.querySelector('[data-importance="extra_high"]'),
    ).toBeInTheDocument();
    expect(container.querySelector(".mt-2.py-1")).not.toBeInTheDocument();
  });

  it("shows the filter dropdown with the requested defaults", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MantineProvider>
        <ActivityTimelineSection
          items={[]}
          isLoading={false}
          shouldLoadViewStatistics={false}
          channels={[]}
          showTitle={false}
        />
      </MantineProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "activityFilterLabel" }),
    );

    const getFilterCheckbox = (name: string) =>
      screen.getByRole("checkbox", { name, hidden: true });

    await waitFor(() =>
      expect(getFilterCheckbox("activityFilterShorts")).toBeInTheDocument(),
    );
    expect(getFilterCheckbox("activityFilterShorts")).not.toBeChecked();
    expect(getFilterCheckbox("activityFilterArchives")).toBeChecked();
    expect(getFilterCheckbox("activityFilterSongUpdates")).toBeChecked();
    expect(getFilterCheckbox("activityFilterViewMilestones")).toBeChecked();

    fireEvent.click(getFilterCheckbox("activityFilterShorts"));
    expect(getFilterCheckbox("activityFilterShorts")).toBeChecked();
  });

  it("shows a small channel icon and name below an archive title", () => {
    const item: ActivityTimelineItem = {
      id: "archive-channel",
      kind: "archive",
      occurredAt: "2026-06-24T00:00:00.000Z",
      href: "/stream-archives#archive-video-1",
      youtubeHref: "https://www.youtube.com/watch?v=video-1",
      videoId: "video-1",
      importance: "normal",
      archive: {
        sequence: 1,
        topic: "雑談",
        title: "配信タイトル",
        video_id: "video-1",
        channel_id: "UC-channel-1",
        video_url: "https://www.youtube.com/watch?v=video-1",
        video_duration: "01:00:00",
        description: "",
        published_at: "2026-06-24T00:00:00.000Z",
        stream_started_at: "2026-06-24T00:00:00.000Z",
        timestamp_comment: "",
      },
    };

    const { container } = render(
      <MantineProvider>
        <ActivityTimelineSection
          items={[item]}
          isLoading={false}
          shouldLoadViewStatistics={false}
          channels={[
            {
              branch: "hololive",
              generation: "",
              talentName: "AZKi",
              artistName: "AZKi",
              youtubeId: "UC-channel-1",
              channelName: "AZKi",
              handle: "@AZKi",
              subscriberCount: 0,
              iconUrl: "https://example.com/azki.png",
            },
          ]}
          showTitle={false}
        />
      </MantineProvider>,
    );

    const channelLink = screen.getByRole("link", { name: "AZKi" });
    expect(channelLink).toHaveAttribute(
      "href",
      "https://www.youtube.com/channel/UC-channel-1",
    );
    expect(screen.getByRole("img", { name: "AZKi" })).toHaveAttribute(
      "src",
      "https://example.com/azki.png",
    );
    expect(channelLink.parentElement).toHaveClass("text-xs");
    expect(
      screen
        .getByRole("link", { name: "配信タイトル" })
        .compareDocumentPosition(channelLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      container.querySelector('[data-importance="normal"]'),
    ).toBeInTheDocument();
  });
});
