import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { ComponentProps } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../../types/song";
import type { StatisticsItem } from "../../createStatistics";
import DiscographySongList from "../DiscographySongList";

const globalPlayerMock = {
  setCurrentSong: vi.fn(),
  setCurrentTime: vi.fn(),
  setIsMinimized: vi.fn(),
  setIsPlaying: vi.fn(),
};

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({
    videoId,
    objectFit,
    objectPosition,
    aspectRatio,
  }: {
    videoId: string;
    objectFit?: string;
    objectPosition?: string;
    aspectRatio?: string;
  }) => (
    <div
      data-testid="thumbnail"
      data-video-id={videoId}
      data-object-fit={objectFit}
      data-object-position={objectPosition}
      data-aspect-ratio={aspectRatio}
    />
  ),
}));

vi.mock("@/app/hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => globalPlayerMock,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations: () => (key: string) => key,
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
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

beforeEach(() => {
  Object.values(globalPlayerMock).forEach((mock) => mock.mockClear());
});

const createSong = (videoId: string, tags: string[]): Song =>
  ({
    title: "テスト曲",
    artist: "AZKi",
    album: "テストアルバム",
    album_release_at: "2026-01-01T00:00:00.000Z",
    broadcast_at: "2026-01-01T00:00:00.000Z",
    video_id: videoId,
    video_uri: `https://www.youtube.com/watch?v=${videoId}`,
    start: 12,
    source_order: 1,
    sing: "AZKi",
    tags,
  }) as Song;

describe("DiscographySongList", () => {
  it("同じ統計キーのアイテムがあっても重複キー警告を出さない", () => {
    const firstSong = createSong("duplicate-key-video-1", ["オリ曲MV"]);
    const secondSong = createSong("duplicate-key-video-2", ["オリ曲MV"]);
    const createItem = (song: Song): StatisticsItem => ({
      key: "duplicate-key",
      count: 1,
      isAlbum: false,
      song,
      firstVideo: song,
      lastVideo: song,
      videos: [song],
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <MantineProvider>
        <DiscographySongList
          data={[createItem(firstSong), createItem(secondSong)]}
          groupByAlbum={false}
          groupByYear={false}
          visibleItems={[true, true]}
        />
      </MantineProvider>,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Encountered two children with the same key"),
    );
    consoleError.mockRestore();
  });

  it("選択中の動画をMiniPlayerで再生し、MVとアートトラックを切り替えられる", () => {
    const mv = createSong("mvvideo0001", ["オリ曲MV"]);
    const artTrack = createSong("arttrack001", ["オリ曲", "アートトラック"]);
    const item: StatisticsItem = {
      key: "test-album",
      count: 2,
      isAlbum: true,
      song: mv,
      firstVideo: mv,
      lastVideo: artTrack,
      videos: [mv, artTrack],
    };

    render(
      <MantineProvider>
        <DiscographySongList
          data={[item]}
          groupByAlbum
          groupByYear={false}
          visibleItems={[true]}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "buttons.play" }));
    expect(globalPlayerMock.setCurrentSong).toHaveBeenLastCalledWith(mv);
    expect(globalPlayerMock.setCurrentTime).toHaveBeenLastCalledWith(12);
    expect(globalPlayerMock.setIsMinimized).toHaveBeenLastCalledWith(true);
    expect(globalPlayerMock.setIsPlaying).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByText("artTrack"));
    fireEvent.click(screen.getByRole("button", { name: "buttons.play" }));
    expect(globalPlayerMock.setCurrentSong).toHaveBeenLastCalledWith(artTrack);
  });

  it("アルバム内のアートトラックを正方形トリミングのサムネイルにする", () => {
    const musicVideo = createSong("mvvideo0001", ["オリ曲MV"]);
    const artTrack = createSong("arttrack001", ["オリ曲", "アートトラック"]);
    const item: StatisticsItem = {
      key: "test-album",
      count: 2,
      isAlbum: true,
      song: musicVideo,
      firstVideo: musicVideo,
      lastVideo: artTrack,
      videos: [musicVideo, artTrack],
    };

    render(
      <MantineProvider>
        <DiscographySongList
          data={[item]}
          groupByAlbum
          groupByYear={false}
          visibleItems={[true]}
        />
      </MantineProvider>,
    );

    expect(screen.getByTestId("thumbnail")).toHaveAttribute(
      "data-video-id",
      artTrack.video_id,
    );
    expect(screen.getByTestId("thumbnail")).toHaveAttribute(
      "data-object-fit",
      "cover",
    );
    expect(screen.getByTestId("thumbnail")).toHaveAttribute(
      "data-object-position",
      "top",
    );
    expect(screen.getByTestId("thumbnail")).toHaveAttribute(
      "data-aspect-ratio",
      "square",
    );
  });

  it("AZKiのコラボ曲詳細へリンクする", () => {
    const song = createSong("collabvideo1", ["オリ曲", "ユニット曲"]);
    song.slugv2 = "collaboration-song";
    const item: StatisticsItem = {
      key: "collaboration-song",
      count: 1,
      isAlbum: false,
      song,
      firstVideo: song,
      lastVideo: song,
      videos: [song],
    };

    render(
      <MantineProvider>
        <DiscographySongList
          data={[item]}
          groupByAlbum={false}
          groupByYear={false}
          visibleItems={[true]}
        />
      </MantineProvider>,
    );

    expect(
      screen.getAllByRole("link", { name: "テスト曲" })[0],
    ).toHaveAttribute("href", "/discography/collab/collaboration-song");
  });
});
