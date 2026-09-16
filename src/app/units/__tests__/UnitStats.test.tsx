import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { theme } from "../../theme";
import type { ArchiveItem } from "../../types/archiveItem";
import type { ChannelEntry } from "../../types/api/yt/channels";

const mocks = vi.hoisted(() => ({
  unitArchives: [] as ArchiveItem[],
  allArchives: [] as ArchiveItem[],
  channels: [] as ChannelEntry[],
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () =>
    (key: string, values: Record<string, string | number> = {}) => {
      const labels: Record<string, string> = {
        statsTitle: `数字で見る ${values.name ?? ""}`,
        statsDaysValue: `${values.count}日`,
        statsDays: "活動期間",
        statsStreams: "コラボ配信",
        statsStreamDuration: "一緒に配信した時間",
        statsStreamDurationRank: `配信時間順位 ${values.rank}位`,
        statsSongsTogether: "一緒に歌った曲",
        statsPerformancesSub: `延べ${values.count}回歌唱`,
      };
      return labels[key] ?? key;
    },
}));

vi.mock("@/app/hook/useArchives", () => ({
  default: () => ({ items: mocks.allArchives, isLoading: false }),
}));

vi.mock("@/app/hook/useChannels", () => ({
  default: () => ({ channels: mocks.channels, isLoading: false }),
}));

vi.mock("../components/useUnitArchives", () => ({
  useUnitArchives: () => ({ items: mocks.unitArchives, isLoading: false }),
}));

import UnitStats from "../components/UnitStats";

const createChannel = (name: string, youtubeId: string): ChannelEntry => ({
  branch: "JP",
  generation: "",
  talentName: name,
  artistName: name,
  youtubeId,
  channelName: `${name} Channel`,
  handle: `@${youtubeId}`,
  subscriberCount: 0,
  iconUrl: "",
});

const createArchive = (
  videoId: string,
  duration: string,
  participants: string[],
  title = videoId,
): ArchiveItem => ({
  sequence: 1,
  topic: "コラボ",
  title,
  video_id: videoId,
  channel_id: "azki",
  video_url: `https://youtube.com/watch?v=${videoId}`,
  video_duration: duration,
  description: "",
  published_at: "2026-01-01T00:00:00Z",
  stream_started_at: "2026-01-01T00:00:00Z",
  timestamp_comment: "",
  participants,
});

describe("UnitStats", () => {
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

  it("uses archive ranking duration, excludes Shorts, and shares archive links", () => {
    const regular = createArchive("iroha", "PT3H", ["AZKi", "風真いろは"]);
    const shorts = createArchive(
      "iroha-shorts",
      "PT10H",
      ["AZKi", "風真いろは"],
      "#Shorts あずいろ",
    );
    const suisei = createArchive("suisei", "PT2H", ["AZKi", "星街すいせい"]);
    mocks.unitArchives = [regular, shorts];
    mocks.allArchives = [regular, shorts, suisei];
    mocks.channels = [
      createChannel("AZKi", "azki"),
      createChannel("風真いろは", "iroha"),
      createChannel("星街すいせい", "suisei"),
    ];

    render(
      <MantineProvider theme={theme}>
        <UnitStats
          participant="風真いろは"
          unitName="あずいろ"
          unitSearchName="あずいろ"
          activityDays={1460}
          uniqueSongCount={44}
          performanceCount={57}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("3h")).toBeVisible();
    expect(screen.getByLabelText("配信時間順位 1位")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();

    const archiveHref =
      "/stream-archives/list?cast=%E9%A2%A8%E7%9C%9F%E3%81%84%E3%82%8D%E3%81%AF";
    expect(screen.getByRole("link", { name: /コラボ配信/ })).toHaveAttribute(
      "href",
      archiveHref,
    );
    expect(
      screen.getByRole("link", { name: /一緒に配信した時間/ }),
    ).toHaveAttribute("href", archiveHref);
    expect(
      screen.getByRole("link", { name: /一緒に歌った曲/ }),
    ).toHaveAttribute(
      "href",
      "/search?q=unit%3A%E3%81%82%E3%81%9A%E3%81%84%E3%82%8D",
    );
  });
});
