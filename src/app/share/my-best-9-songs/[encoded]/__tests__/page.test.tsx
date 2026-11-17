import { buildBestNineLiveChoices } from "@/app/lib/bestNineLive";
import { departureGroups } from "@/app/lib/__tests__/fixtures/bestNineLive";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import { decodeThemes, emptyThemes } from "@/app/lib/myBestNineSongs";
import { emptySlotCategories } from "@/app/lib/bestNineCategories";

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

  it("動画がない1曲のライブ回答を表示し、公演へリンクする", async () => {
    const live = buildBestNineLiveChoices(departureGroups)[0];
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        selection: {
          title: "Departureの1曲",
          songCount: 1,
          songs: [
            {
              kind: "live",
              liveId: live.liveId,
              liveEntryKey: live.entryKey,
              snapshot: live,
            },
          ],
        },
      }),
    );
    render(<Page />);
    await screen.findByRole("heading", { name: "未来カンパネラ" });
    expect(
      screen.getByRole("link", { name: "Departure / 2025-11-19" }),
    ).toHaveAttribute("href", "/lives/departure");
    expect(screen.queryByTestId("yt-thumb")).toBeNull();
    expect(globalPlayerMock.setCurrentSong).not.toHaveBeenCalled();
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

  it.each([
    { maximum: 1, count: 1, theme: "", expected: "" },
    { maximum: 9, count: 1, theme: "", expected: "" },
    {
      maximum: 1,
      count: 1,
      theme: "今1番推したい曲",
      expected: "1. 今1番推したい曲",
    },
    { maximum: 2, count: 2, theme: "", expected: "1." },
    { maximum: 2, count: 2, theme: "出会い", expected: "1. 出会い" },
  ])(
    "共有カードは選曲数と枠のお題に応じた見出しを表示する: %j",
    async ({ maximum, count, theme, expected }) => {
      const themes = emptyThemes();
      themes[0] = theme;
      const second = { ...sampleSong, video_id: "video-2", title: "二曲目" };
      useSongsMock.mockReturnValue({
        allSongs: [sampleSong, second],
        isLoading: false,
      });
      vi.mocked(fetch).mockResolvedValue(
        Response.json({
          selection: {
            title: "見出しの確認",
            songCount: maximum,
            themes,
            slotCategories: Array.from({ length: 9 }, () => ["original"]),
            songs: [
              { v: "video-1", s: "15", slot: 0 },
              ...(count > 1 ? [{ v: "video-2", s: "15", slot: 1 }] : []),
            ],
          },
        }),
      );
      render(<Page />);
      await screen.findByText("見出しの確認");
      if (expected)
        expect(screen.getByText(expected, { exact: true })).toBeInTheDocument();
      else expect(screen.queryByText(/^1\./)).toBeNull();
      if (count > 1)
        expect(screen.getByText("2.", { exact: true })).toBeInTheDocument();
      expect(screen.queryByText(/freeSlot|自由枠/)).toBeNull();
    },
  );

  it("タイトルを消した枠でもカテゴリ設定があれば共有時の位置を維持する", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[8] = ["original"];
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        selection: {
          title: "カテゴリ別9選",
          themes: emptyThemes(),
          slotCategories,
          topicId: "12345678-1234-4234-8234-123456789abc",
          topicVersion: 1,
          songs: [{ v: "video-1", s: "15", slot: 8 }],
        },
      }),
    );
    render(<Page />);
    await screen.findByText("カテゴリ別9選");
    const grid = screen.getAllByText("myBest9.themes.unanswered")[0]
      .parentElement!.parentElement!;
    expect(grid.children).toHaveLength(9);
    expect(grid.children[0]).toHaveTextContent("myBest9.themes.unanswered");
    expect(grid.children[8]).toHaveTextContent("テスト曲");
    expect(
      screen.getByRole("link", { name: "share.createFromTopic" }),
    ).toHaveAttribute(
      "href",
      "/share/my-best-9-songs?topic=12345678-1234-4234-8234-123456789abc",
    );
  });

  it("お題・未回答・取得できない曲の位置を保ち、お題募集URLへ引き継ぐ", async () => {
    const themes = emptyThemes();
    themes[0] = "出会い";
    themes[8] = "歌枠の一曲";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        selection: {
          title: "お題付き9選",
          themes,
          songs: [
            { v: "missing-video", s: "0", slot: 0 },
            { v: "video-1", s: "15", slot: 8 },
          ],
        },
      }),
    );
    render(<Page />);
    await screen.findByText("お題付き9選");
    const grid = screen.getByText("1. 出会い").parentElement!.parentElement!;
    expect(grid.children).toHaveLength(9);
    expect(grid.children[0]).toHaveTextContent("myBest9.themes.missingSong");
    expect(grid.children[1]).toHaveTextContent("myBest9.themes.unanswered");
    expect(grid.children[8]).toHaveTextContent("9. 歌枠の一曲");
    expect(grid.children[8]).toHaveTextContent("テスト曲");
    const url = new URL(
      screen
        .getByRole("link", { name: "share.createFromTopic" })
        .getAttribute("href")!,
      "https://example.test",
    );
    expect(decodeThemes(url.searchParams.get("themes")!)).toEqual(themes);
    expect(url.searchParams.get("title")).toBe("お題付き9選");
  });
});
