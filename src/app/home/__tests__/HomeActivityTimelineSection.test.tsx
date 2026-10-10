import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import jaMessages from "@/messages/ja.json";
import type { ArchiveItem } from "../../types/archiveItem";
import type { Song } from "../../types/song";
import { HomeActivityTimelineSection } from "../HomeActivityTimelineSection";

const archives = vi.hoisted(() => [] as ArchiveItem[]);

vi.mock("../../hook/useArchives", () => ({
  default: () => ({ items: archives, isLoading: false, fetchedAt: null }),
}));
vi.mock("../../hook/useReleaseViewCounts", () => ({
  default: () => ({ data: {}, loading: false }),
}));
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useLocale: () => "ja",
    useTranslations: (namespace: "Home" | "DrawerMenu") =>
      original.createTranslator({
        locale: "ja",
        messages: jaMessages,
        namespace,
      }),
  };
});

const song: Song = {
  title: "収録曲",
  artist: "AZKi",
  artists: ["AZKi"],
  hl: { ja: { title: "収録曲", artist: "AZKi", artists: ["AZKi"] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "歌枠動画",
  video_uri: "https://www.youtube.com/watch?v=singing-stream",
  video_id: "singing-stream",
  start: 0,
  end: 0,
  broadcast_at: "2026-01-07T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
  view_count: 0,
};

describe("HomeActivityTimelineSection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("重複を楽曲側にまとめ、初期表示と続きを表示で配信を欠落させない", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
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
    archives.push(
      ...Array.from({ length: 6 }, (_, index): ArchiveItem => ({
        sequence: index + 1,
        topic: index === 0 ? "歌枠" : "雑談",
        title: index === 0 ? "歌枠動画" : `未収録配信${index}`,
        video_id: index === 0 ? "singing-stream" : `archive-${index}`,
        channel_id: "azki-channel",
        video_url: "",
        video_duration: "01:00:00",
        description: "",
        published_at: `2026-01-0${7 - index}T00:00:00.000Z`,
        stream_started_at: "",
        timestamp_comment: "",
      })),
    );

    render(
      <MantineProvider>
        <HomeActivityTimelineSection
          channels={[]}
          events={[]}
          isEventsLoading={false}
          isMilestonesLoading={false}
          isSongsLoading={false}
          milestones={[]}
          songs={[song, { ...song, title: "収録曲2" }]}
        />
      </MantineProvider>,
    );

    expect(screen.getAllByText("歌枠動画")).toHaveLength(1);
    expect(screen.getByText("収録楽曲を追加：2曲")).toBeVisible();
    expect(screen.getAllByText("配信アーカイブを追加")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "歌枠動画" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=singing-stream",
    );
    expect(screen.queryByText("未収録配信5")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "続きを表示" }));

    expect(screen.getAllByText("歌枠動画")).toHaveLength(1);
    expect(screen.getAllByText("配信アーカイブを追加")).toHaveLength(5);
    expect(screen.getByText("未収録配信5")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "続きを表示" }),
    ).not.toBeInTheDocument();
  });
});
