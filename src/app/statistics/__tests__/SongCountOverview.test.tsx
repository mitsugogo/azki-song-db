import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SongCountOverview from "../SongCountOverview";
import type { Song } from "../../types/song";
import type { StatisticsItem } from "../../types/statisticsItem";
import { theme } from "../../theme";

vi.mock("../../components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => <div>{alt}</div>,
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

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

afterEach(() => {
  vi.useRealTimers();
});

const hotLimitSong = {
  slugv2: "y39dmzoqsrw0-abftwz",
  title: "HOT LIMIT",
  artist: "T.M.Revolution",
  sing: "AZKi",
  sings: ["AZKi"],
  video_id: "y39DMzOqsRw",
  video_uri: "https://www.youtube.com/watch?v=y39DMzOqsRw",
  broadcast_at: "2019-09-12T00:00:00Z",
  tags: ["カバー曲", "カバー曲MV", "歌ってみた"],
  view_count: 0,
} as Song;

const hotLimitItem: StatisticsItem = {
  key: "HOT LIMIT (T.M.Revolution) (AZKi)",
  count: 1,
  song: hotLimitSong,
  firstVideo: hotLimitSong,
  lastVideo: hotLimitSong,
  effectiveViewCount: 422369,
  statVideoId: "y39DMzOqsRw",
  viewMilestone: {
    status: "achieved",
    targetCount: 400000,
    achievedAt: "2026-07-17T00:07:10.000Z",
  },
};

describe("SongCountOverview", () => {
  it("指定の大きな達成節目だけtan背景で表示する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T15:33:40.000Z"));

    render(
      <MantineProvider theme={theme}>
        <SongCountOverview
          items={[
            {
              ...hotLimitItem,
              viewMilestone: {
                status: "achieved",
                targetCount: 500000,
                achievedAt: "2026-07-17T00:07:10.000Z",
              },
            },
          ]}
          primaryLabel=""
          topLabel=""
          totalCountLabel=""
          countUnit=""
          showMilestoneHighlights
          showTopTile={false}
          useTanMilestoneBadge
        />
      </MantineProvider>,
    );

    expect(screen.getByText("milestoneLabelJa").parentElement).toHaveAttribute(
      "style",
      expect.stringContaining("--badge-bg: var(--mantine-color-tan-filled)"),
    );
  });

  it("指定の大きな見込み節目もtan背景で表示する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T15:33:40.000Z"));

    render(
      <MantineProvider theme={theme}>
        <SongCountOverview
          items={[
            {
              ...hotLimitItem,
              viewMilestone: {
                status: "remain",
                targetCount: 500000,
                estimatedAt: "2026-07-17T00:07:10.000Z",
              },
            },
          ]}
          primaryLabel=""
          topLabel=""
          totalCountLabel=""
          countUnit=""
          showMilestoneHighlights
          showTopTile={false}
          useTanMilestoneBadge
        />
      </MantineProvider>,
    );

    expect(
      screen.getByText("milestoneLabelEstimateJa").parentElement,
    ).toHaveAttribute(
      "style",
      expect.stringContaining("--badge-bg: var(--mantine-color-tan-light)"),
    );
  });

  it("表示用達成日が直近7日なら集計時刻が現在より後でも達成一覧に含める", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T15:33:40.000Z"));

    render(
      <MantineProvider theme={theme}>
        <SongCountOverview
          items={[hotLimitItem]}
          primaryLabel=""
          topLabel=""
          totalCountLabel=""
          countUnit=""
          showMilestoneHighlights
          showTopTile={false}
          useTanMilestoneBadge
        />
      </MantineProvider>,
    );

    expect(screen.getByText("HOT LIMIT - T.M.Revolution")).toBeInTheDocument();
    expect(screen.getByText("2026/07/16")).toBeInTheDocument();
    expect(screen.getByText("milestoneLabelJa").parentElement).toHaveAttribute(
      "style",
      expect.stringContaining("--badge-bg: var(--mantine-color-pink-filled)"),
    );
  });
});
