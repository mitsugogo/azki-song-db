import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ encoded: "shared-selection-id" }),
}));

const decodeFromUrlParamMock = vi.fn();
vi.mock("@/app/hook/useMyBestNineSongs", () => ({
  default: () => ({
    decodeFromUrlParam: decodeFromUrlParamMock,
  }),
}));

const useSongsMock = vi.fn();
vi.mock("@/app/hook/useSongs", () => ({
  default: () => useSongsMock(),
}));

const globalPlayerMock = {
  setCurrentSong: vi.fn(),
  setCurrentTime: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsMinimized: vi.fn(),
};

vi.mock("@/app/hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => globalPlayerMock,
}));

vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => (
    <div data-testid="yt-thumb" data-alt={alt} />
  ),
}));

import Page from "../page";

const sampleSong: Song = {
  title: "テスト曲",
  artist: "AZKi",
  album: "Album",
  lyricist: "Lyricist",
  composer: "Composer",
  arranger: "Arranger",
  album_list_uri: "",
  album_release_at: "2024-01-01",
  album_is_compilation: false,
  sing: "AZKi",
  video_title: "テスト動画",
  video_uri: "https://youtu.be/video-1",
  video_id: "video-1",
  start: "15",
  end: "30",
  broadcast_at: "2024-01-01",
  year: 2024,
  tags: [],
  milestones: [],
};

describe("共有9選ページ", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSongsMock.mockReturnValue({
      allSongs: [sampleSong],
      isLoading: false,
    });

    decodeFromUrlParamMock.mockReturnValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          selection: {
            title: "共有9選",
            author: "テストユーザー",
            songs: [{ v: "video-1", s: "15" }],
          },
        }),
      }),
    );
  });

  it("サムネクリックでMiniPlayerの再生を開始する", async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("共有9選")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "テスト曲 をミニプレイヤで再生",
      }),
    );

    expect(globalPlayerMock.setCurrentSong).toHaveBeenCalledWith(sampleSong);
    expect(globalPlayerMock.setCurrentTime).toHaveBeenCalledWith(15);
    expect(globalPlayerMock.setIsMinimized).toHaveBeenCalledWith(true);
    expect(globalPlayerMock.setIsPlaying).toHaveBeenCalledWith(true);
    expect(screen.getByRole("link", { name: "テスト曲" })).toHaveAttribute(
      "href",
      "/watch?v=video-1&t=15",
    );
  });
});
