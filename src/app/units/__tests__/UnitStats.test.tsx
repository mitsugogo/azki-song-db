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
        statsLegacyDaysSub: `${values.name ?? ""}始動から ${values.count}日`,
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
          participants={["風真いろは"]}
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

  it("uses the exact member combination for a three-member unit", () => {
    const kozmy = createArchive("kozmy", "PT5H", [
      "AZKi",
      "博衣こより",
      "雪花ラミィ",
    ]);
    const azkoyo = createArchive("azkoyo", "PT10H", ["AZKi", "博衣こより"]);
    mocks.unitArchives = [kozmy];
    mocks.allArchives = [kozmy, azkoyo];
    mocks.channels = [
      createChannel("AZKi", "azki"),
      createChannel("博衣こより", "koyori"),
      createChannel("雪花ラミィ", "lamy"),
    ];

    render(
      <MantineProvider theme={theme}>
        <UnitStats
          participants={["博衣こより", "雪花ラミィ"]}
          unitName="KoZMy"
          unitSearchName="KoZMy"
          activityDays={365}
          uniqueSongCount={1}
          performanceCount={1}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("5h")).toBeVisible();
    expect(screen.getByLabelText("配信時間順位 2位")).toBeVisible();
    const archiveHref =
      "/stream-archives/list?cast=%E5%8D%9A%E8%A1%A3%E3%81%93%E3%82%88%E3%82%8A&cast=%E9%9B%AA%E8%8A%B1%E3%83%A9%E3%83%9F%E3%82%A3";
    expect(screen.getByRole("link", { name: /コラボ配信/ })).toHaveAttribute(
      "href",
      archiveHref,
    );
    expect(
      screen.getByRole("link", { name: /一緒に配信した時間/ }),
    ).toHaveAttribute("href", archiveHref);
  });

  it("shows the AS_tar activity period alongside its INNK roots", () => {
    mocks.unitArchives = [];
    mocks.allArchives = [];
    mocks.channels = [];

    render(
      <MantineProvider theme={theme}>
        <UnitStats
          participants={["星街すいせい"]}
          unitName="AS_tar"
          unitSearchName="AS_tar"
          activityDays={840}
          legacyActivity={{ name: "イノナカ組", days: 2680 }}
          uniqueSongCount={2}
          performanceCount={2}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("840日")).toBeVisible();
    expect(screen.getByText("イノナカ組始動から 2,680日")).toBeVisible();
  });
});
