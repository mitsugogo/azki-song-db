import { act, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityTimelineItem } from "../../hook/useActivityTimeline";
import ActivityItemDetail from "../ActivityItemDetail";

const { sharedSourceRef, globalPlayerMock } = vi.hoisted(() => ({
  sharedSourceRef: { current: null as any },
  globalPlayerMock: {
    setCurrentSong: vi.fn(),
    setIsPlaying: vi.fn(),
    setIsMinimized: vi.fn(),
  },
}));

vi.mock("../SharedYouTubePlayer", () => ({
  useSharedYouTubePlayerSource: (source: any) => {
    sharedSourceRef.current = source;
  },
  SharedYouTubePlayerSlot: ({ sourceId, active }: any) => (
    <div data-testid={`shared-slot-${sourceId}`} data-active={active} />
  ),
}));

vi.mock("../../hook/useGlobalPlayer", () => ({
  useOptionalGlobalPlayer: () => globalPlayerMock,
}));

function makeArchive(
  timestampComment = "",
  databaseHref?: string,
  memberOnly = false,
): ActivityTimelineItem {
  return {
    id: "archive-detail",
    kind: "archive",
    occurredAt: "2026-06-01T00:00:00.000Z",
    href: "/stream-archives#archive-video-1",
    youtubeHref: "https://www.youtube.com/watch?v=video-1",
    databaseHref,
    videoId: "video-1",
    importance: "normal",
    archive: {
      sequence: 1,
      topic: "ホロライブドリームス",
      title: "大きく表示する配信",
      video_id: "video-1",
      channel_id: "UC-channel",
      video_url: "https://www.youtube.com/watch?v=video-1",
      video_duration: "01:00:00",
      description: "配信の詳しい説明",
      published_at: "2026-06-01T00:00:00.000Z",
      stream_started_at: "2026-06-01T00:00:00.000Z",
      timestamp_comment: timestampComment,
      member_only: memberOnly,
    },
  };
}

describe("ActivityItemDetail", () => {
  beforeEach(() => {
    sharedSourceRef.current = null;
    vi.clearAllMocks();
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
  });

  it("renders one archive with a full-width paused shared player", () => {
    const { container, rerender } = render(
      <MantineProvider>
        <ActivityItemDetail
          item={makeArchive("", "/watch?v=video-1&t=15s", true)}
          channels={[
            {
              branch: "hololive",
              generation: "",
              talentName: "Test",
              artistName: "Test",
              youtubeId: "UC-channel",
              channelName: "Test Channel",
              handle: "@test",
              subscriberCount: 0,
              iconUrl: "https://example.com/channel.png",
            },
          ]}
          active
        />
      </MantineProvider>,
    );

    expect(screen.getByTestId("activity-detail-player")).toHaveClass("w-full");
    expect(screen.getByTestId("activity-detail-title")).toHaveClass("w-full");
    expect(
      screen.getByRole("link", { name: "大きく表示する配信" }),
    ).toHaveAttribute("href", "/stream-archives#archive-video-1");
    const databaseLink = screen.getByRole("link", {
      name: "buttons.viewInDatabase",
    });
    const youtubeLink = screen.getByRole("link", {
      name: "calendarActivityOpenYoutube",
    });
    expect(databaseLink).toHaveAttribute("href", "/watch?v=video-1&t=15s");
    expect(
      databaseLink.compareDocumentPosition(youtubeLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Test Channel")).toBeInTheDocument();
    expect(screen.getByText("memberOnlyBadge")).toBeInTheDocument();
    expect(screen.getByText("publicInfoOnlyNote")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("publicInfoOnlyNote");
    expect(screen.getByTestId("activity-detail-description")).toHaveTextContent(
      "配信の詳しい説明",
    );
    const metadata = screen.getByTestId("activity-detail-archive-metadata");
    expect(within(metadata).getByText("publishedAtLabel")).toBeInTheDocument();
    expect(
      within(metadata).getByText("videoDurationLabel"),
    ).toBeInTheDocument();
    expect(within(metadata).getByText("01:00:00")).toBeInTheDocument();
    expect(within(metadata).getByText("topicLabel")).toBeInTheDocument();
    expect(
      within(metadata).getByRole("link", { name: "ホロライブドリームス" }),
    ).toHaveAttribute(
      "href",
      "/stream-archives?series=%E3%83%9B%E3%83%AD%E3%83%A9%E3%82%A4%E3%83%96%E3%83%89%E3%83%AA%E3%83%BC%E3%83%A0%E3%82%B9",
    );
    expect(screen.queryByTestId("activity-detail-timestamps")).toBeNull();
    expect(container.querySelector(".mantine-Timeline-root")).toBeNull();
    expect(sharedSourceRef.current).toMatchObject({
      sourceId: "activity-detail",
      active: true,
      autoPlay: false,
      showNativeControls: true,
    });
    expect(globalPlayerMock.setCurrentSong).toHaveBeenCalledWith(null);
    expect(globalPlayerMock.setIsPlaying).toHaveBeenCalledWith(false);

    const player = {
      pauseVideo: vi.fn(),
      stopVideo: vi.fn(() => {
        throw new Error("The YouTube player is not attached to the DOM");
      }),
    };
    act(() => sharedSourceRef.current.onReady({ target: player }));
    expect(player.pauseVideo).toHaveBeenCalled();

    rerender(
      <MantineProvider>
        <ActivityItemDetail item={makeArchive()} channels={[]} active={false} />
      </MantineProvider>,
    );
    expect(sharedSourceRef.current).toMatchObject({
      sourceId: "activity-detail",
      active: false,
    });
    expect(player.stopVideo).not.toHaveBeenCalled();
  });

  it("uses a thumbnail link when the shared player reports an error", () => {
    render(
      <MantineProvider>
        <ActivityItemDetail item={makeArchive()} channels={[]} active />
      </MantineProvider>,
    );

    act(() => sharedSourceRef.current.onError({ target: {} }));

    const player = screen.getByTestId("activity-detail-player");
    expect(player).toHaveAttribute("data-player-failed", "true");
    expect(
      within(player).getByRole("link", {
        name: "calendarActivityPlayerFallbackLink",
      }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=video-1");
  });

  it("renders archive timestamps with links to the matching YouTube positions", () => {
    render(
      <MantineProvider>
        <ActivityItemDetail
          item={makeArchive("00:10 オープニング\n01:23 本編開始")}
          channels={[]}
          active
        />
      </MantineProvider>,
    );

    const timestamps = screen.getByTestId("activity-detail-timestamps");
    expect(within(timestamps).getByText("timestampLabel")).toBeInTheDocument();
    expect(within(timestamps).getByText(/オープニング/)).toBeInTheDocument();
    expect(
      within(timestamps).getByRole("link", { name: "00:10" }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=video-1&t=10");
    expect(
      within(timestamps).getByRole("link", { name: "01:23" }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=video-1&t=83");
  });

  it("renders a non-video event without an empty player area", () => {
    const event: ActivityTimelineItem = {
      id: "event-detail",
      kind: "event",
      occurredAt: "2026-06-01T00:00:00.000Z",
      href: "https://example.com/event",
      importance: "normal",
      event: {
        start_at: "2026-06-01T00:00:00.000Z",
        end_at: "2026-06-01T00:00:00.000Z",
        content: "イベント詳細",
        note: "イベント説明",
        place: "テスト会場",
        place_url: "https://example.com/place",
        url: "https://example.com/event",
        importance: "normal",
      },
    };

    render(
      <MantineProvider>
        <ActivityItemDetail item={event} channels={[]} active />
      </MantineProvider>,
    );

    expect(screen.queryByTestId("activity-detail-player")).toBeNull();
    expect(
      screen.queryByRole("link", { name: "buttons.viewInDatabase" }),
    ).toBeNull();
    expect(screen.queryByTestId("activity-detail-archive-metadata")).toBeNull();
    expect(screen.queryByTestId("activity-detail-timestamps")).toBeNull();
    expect(screen.getByTestId("activity-detail-title")).toHaveTextContent(
      "イベント詳細",
    );
    expect(screen.getByRole("link", { name: "テスト会場" })).toHaveAttribute(
      "href",
      "https://example.com/place",
    );
  });
});
