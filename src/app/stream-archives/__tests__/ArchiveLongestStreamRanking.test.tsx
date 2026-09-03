import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveLongestStreamRanking from "../ArchiveLongestStreamRanking";

const labels = {
  title: "配信時間が長い配信",
  subtitle: "配信時間の長い順",
  noData: "表示できる配信時間情報がありません。",
  allTimeOptionLabel: "全期間",
  yearSelectAriaLabel: "配信時間ランキングの表示期間",
  itemLabel: (rank: number, title: string, duration: string) =>
    `${rank}位 ${title} ${duration}`,
  gauge: (title: string, duration: string) => `${title}の配信時間 ${duration}`,
  thumbnail: (title: string) => `${title}のサムネイル`,
  detailCloseLabel: "詳細を閉じる",
  appWatchLabel: "再生",
  castLabel: "出演",
  timestampLabel: "タイムスタンプ",
  memberOnlyBadge: "メンバー限定",
  publicInfoOnlyNote: "公開情報のみ掲載しています",
};

describe("ArchiveLongestStreamRanking", () => {
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

  it("renders rank, thumbnail, title, and duration, then opens the detail drawer", async () => {
    const archiveItem = {
      sequence: 1,
      topic: "雑談",
      title: "長時間配信",
      video_id: "longest-1",
      channel_id: "channel-1",
      video_url: "https://www.youtube.com/watch?v=longest-1",
      video_duration: "PT5H",
      description: "",
      published_at: "2026-01-01T00:00:00.000Z",
      stream_started_at: "2026-01-01T00:00:00.000Z",
      timestamp_comment: "",
      member_only: true,
      participantEntries: [],
    };

    render(
      <MantineProvider>
        <ArchiveLongestStreamRanking
          items={[
            {
              key: "longest-1",
              title: "長時間配信",
              videoId: "longest-1",
              videoUrl: "https://www.youtube.com/watch?v=longest-1",
              streamStartedAt: "2026-01-01T00:00:00.000Z",
              durationSeconds: 18_000,
              item: archiveItem,
            },
          ]}
          years={[2026, 2025]}
          selectedYear={null}
          locale="ja"
          labels={labels}
          formatDuration={(seconds) => `${seconds / 3_600}h`}
          onSelectedYearChange={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("配信時間が長い配信")).toBeVisible();
    expect(screen.getByText("長時間配信")).toBeVisible();
    expect(screen.getByText("5h")).toBeVisible();
    const thumbnail = screen.getByRole("img", {
      name: "長時間配信のサムネイル",
    });
    expect(thumbnail).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1位 長時間配信 5h" }));
    const detailContent = await screen.findByTestId("archive-detail-content");
    expect(detailContent).toHaveTextContent("長時間配信");
    expect(detailContent).toHaveTextContent("メンバー限定");
    expect(detailContent).toHaveTextContent("公開情報のみ掲載しています");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "公開情報のみ掲載しています",
    );
    expect(screen.getByRole("link", { name: "再生" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=longest-1",
    );
    expect(
      screen.getByRole("progressbar", {
        name: "長時間配信の配信時間 5h",
      }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("lets the user select all time or a specific year", () => {
    const onSelectedYearChange = vi.fn();
    render(
      <MantineProvider>
        <ArchiveLongestStreamRanking
          items={[]}
          years={[2026, 2025]}
          selectedYear={null}
          locale="ja"
          labels={labels}
          formatDuration={(seconds) => `${seconds / 3_600}h`}
          onSelectedYearChange={onSelectedYearChange}
        />
      </MantineProvider>,
    );

    const select = screen.getByRole("combobox", {
      name: "配信時間ランキングの表示期間",
    });
    expect(select).toHaveValue("全期間");

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "2026" }));
    expect(onSelectedYearChange).toHaveBeenCalledWith("2026");
    expect(
      screen.getByText("表示できる配信時間情報がありません。"),
    ).toBeVisible();
  });
});
