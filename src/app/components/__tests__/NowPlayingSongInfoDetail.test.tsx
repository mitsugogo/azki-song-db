import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import NowPlayingSongInfoDetail from "../NowPlayingSongInfoDetail";
import ja from "@/messages/ja.json";

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations: () => (key: string) =>
    ja.Watch.nowPlayingSongInfoDetail[
      key as keyof typeof ja.Watch.nowPlayingSongInfoDetail
    ] ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    prefetch,
    ...props
  }: React.ComponentProps<"a"> & { prefetch?: boolean }) => <a {...props} />,
}));

const baseSong: Song = {
  title: "統計のある楽曲",
  artist: "AZKi",
  hl: { ja: { title: "統計のある楽曲", artist: "AZKi", artists: ["AZKi"] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "再生中の動画",
  video_uri: "https://www.youtube.com/watch?v=video-1",
  video_id: "video-1",
  start: 30,
  end: 120,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: ["カバー曲"],
  milestones: [],
  slugv2: "stats song",
};

const renderSong = (song: Song) =>
  render(
    <MantineProvider env="test">
      <NowPlayingSongInfoDetail
        currentSong={song}
        allSongs={[song]}
        searchTerm=""
        isPlaying={true}
        hideFutureSongs={false}
        setSearchTerm={vi.fn()}
        changeCurrentSong={vi.fn()}
      />
    </MantineProvider>,
  );

const getVideoTitleRow = () =>
  screen.getByText("動画タイトル:").closest("dt")!.parentElement!;

describe("NowPlayingSongInfoDetail stats link", () => {
  beforeEach(() => {
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

  it.each([
    [["カバー曲"], "covers"],
    [["オリ曲"], "originals"],
    [["オリ曲", "ゲスト参加"], "collaborations"],
    [["全体曲"], "overall"],
  ])("動画タイトル行のYouTubeの直後にstatsを表示する: %s", (tags, category) => {
    renderSong({ ...baseSong, tags });

    const row = getVideoTitleRow();
    const youtubeLink = within(row).getByRole("link", { name: "YouTube" });
    const statsLink = within(row).getByRole("link", { name: "stats" });

    expect(youtubeLink).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=video-1&t=30s",
    );
    expect(youtubeLink.nextElementSibling).toBe(statsLink);
    expect(statsLink).toHaveAttribute(
      "href",
      `/discography/${category}/stats%20song`,
    );
  });

  it.each([{ slugv2: undefined }, { tags: ["歌枠"] }])(
    "統計ページがない楽曲にはstatsを表示しない: %j",
    (overrides) => {
      renderSong({ ...baseSong, ...overrides });

      expect(screen.queryByRole("link", { name: "stats" })).toBeNull();
      expect(
        within(getVideoTitleRow()).getByRole("link", { name: "YouTube" }),
      ).toBeInTheDocument();
    },
  );

  it("選曲するとstatsリンクを現在の楽曲に更新する", () => {
    const view = renderSong(baseSong);
    view.rerender(
      <MantineProvider env="test">
        <NowPlayingSongInfoDetail
          currentSong={{ ...baseSong, slugv2: "next-song", tags: ["オリ曲"] }}
          allSongs={[baseSong]}
          searchTerm=""
          isPlaying={true}
          hideFutureSongs={false}
          setSearchTerm={vi.fn()}
          changeCurrentSong={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("link", { name: "stats" })).toHaveAttribute(
      "href",
      "/discography/originals/next-song",
    );
  });
});
