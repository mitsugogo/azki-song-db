import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { theme } from "../../theme";
import type { ArchiveItem } from "../../types/archiveItem";

const mocks = vi.hoisted(() => ({ items: [] as ArchiveItem[] }));

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () =>
    (key: string, values: Record<string, string | number> = {}) => {
      const labels: Record<string, string> = {
        streamsTitle: "Stream Archives",
        streamsDescription: `${values.name ?? ""}で配信したアーカイブ一覧`,
        "streamCategory.all": "すべて",
        "streamCategory.karaoke": "歌枠",
        "streamCategory.3d": "3D",
        "streamCategory.event": "イベント",
        streamCategoryLabel: "カテゴリ",
        newestFirst: "新しい順",
        oldestFirst: "古い順",
        streamSortLabel: "並び順",
        streamsEmpty: "該当なし",
      };
      return labels[key] ?? key;
    },
}));

vi.mock("../components/useUnitArchives", () => ({
  useUnitArchives: () => ({ items: mocks.items, isLoading: false }),
}));

vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => <div aria-label={alt} />,
}));

import UnitStreams from "../components/UnitStreams";

const createArchive = (
  videoId: string,
  title: string,
  topic: string,
): ArchiveItem => ({
  sequence: 1,
  topic,
  title,
  video_id: videoId,
  channel_id: "channel",
  video_url: `https://youtube.com/watch?v=${videoId}`,
  video_duration: "PT1H",
  description: "",
  published_at: "2026-01-01T00:00:00Z",
  stream_started_at: "2026-01-01T00:00:00Z",
  timestamp_comment: "",
});

describe("UnitStreams", () => {
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

  it("groups karaoke variants under 歌枠 and omits unsupported filters", () => {
    mocks.items = [
      createArchive("karaoke", "通常カラオケ", "カラオケ"),
      createArchive("3d-karaoke", "3Dカラオケ", "3Dカラオケ"),
      createArchive("chat", "雑談配信", "雑談"),
      createArchive("game", "ゲーム配信", "Minecraft"),
      createArchive("event", "周年イベント", "イベント"),
    ];

    render(
      <MantineProvider theme={theme}>
        <UnitStreams
          participants={["風真いろは"]}
          karaokeVideoIds={[]}
          unitName="あずいろ"
        />
      </MantineProvider>,
    );

    expect(screen.getByText("あずいろで配信したアーカイブ一覧")).toBeVisible();
    expect(
      screen.queryByRole("radio", { name: "ゲーム" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "雑談" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "歌枠" }));
    expect(screen.getByRole("heading", { name: "通常カラオケ" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "3Dカラオケ" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "雑談配信" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "3D" }));
    expect(screen.getByRole("heading", { name: "3Dカラオケ" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "通常カラオケ" }),
    ).not.toBeInTheDocument();
  });

  it("uses singing data to classify a collaboration archive as karaoke", () => {
    mocks.items = [
      createArchive(
        "7kS7LNMqJOY",
        "イノナカ組！ホロライブ加入5周年記念！",
        "コラボ",
      ),
    ];

    render(
      <MantineProvider theme={theme}>
        <UnitStreams
          participants={["星街すいせい"]}
          karaokeVideoIds={["7kS7LNMqJOY"]}
          unitName="AS_tar"
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "歌枠" }));
    expect(
      screen.getByRole("heading", {
        name: "イノナカ組！ホロライブ加入5周年記念！",
      }),
    ).toBeVisible();
  });
});
