import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SongCountOverview from "../SongCountOverview";
import type { Song } from "../../types/song";
import type { StatisticsItem } from "../../types/statisticsItem";

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
  it("表示用達成日が直近7日なら集計時刻が現在より後でも達成一覧に含める", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T15:33:40.000Z"));

    render(
      <MantineProvider>
        <SongCountOverview
          items={[hotLimitItem]}
          primaryLabel=""
          topLabel=""
          totalCountLabel=""
          countUnit=""
          showMilestoneHighlights
          showTopTile={false}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("HOT LIMIT - T.M.Revolution")).toBeInTheDocument();
    expect(screen.getByText("2026/07/16")).toBeInTheDocument();
  });
});
