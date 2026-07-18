import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import SearchAndSongList from "../SearchAndSongList";

const playlistActionsMock = vi.hoisted(() => ({
  playPlaylist: vi.fn(),
  disablePlaylistMode: vi.fn(),
  decodePlaylistFromUrl: vi.fn(() => null),
}));

const playlistsMock = vi.hoisted(() => ({
  playlists: [] as any[],
  savePlaylist: vi.fn(),
  isDuplicate: vi.fn(() => false),
}));

vi.mock("@mantine/core", () => {
  const Button = ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  );

  const Menu = ({ children }: any) => <div>{children}</div>;
  Menu.Target = ({ children }: any) => <div>{children}</div>;
  Menu.Dropdown = ({ children }: any) => <div>{children}</div>;
  Menu.Item = ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  );
  Menu.Label = ({ children }: any) => <div>{children}</div>;
  Menu.Divider = () => <hr />;

  const Grid = ({ children }: any) => <div>{children}</div>;
  Grid.Col = ({ children }: any) => <div>{children}</div>;

  const Modal = ({ children }: any) => <div>{children}</div>;
  Modal.Body = ({ children }: any) => <div>{children}</div>;

  const ScrollArea = ({ children }: any) => <div>{children}</div>;
  const CopyButton = ({ children }: any) =>
    children({ copied: false, copy: vi.fn() });
  const Tooltip = ({ children }: any) => <>{children}</>;

  return {
    __esModule: true,
    Button,
    Menu,
    Grid,
    Modal,
    ScrollArea,
    CopyButton,
    Tooltip,
  };
});

vi.mock("../SongList", () => ({
  __esModule: true,
  default: ({ songs }: { songs: Song[] }) => (
    <div data-testid="songs-list-order">
      {songs.map((song) => song.title).join("|")}
    </div>
  ),
}));

vi.mock("../SearchInput", () => ({
  __esModule: true,
  default: () => <div data-testid="search-input" />,
}));

vi.mock("../CreatePlaylistModal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("../SongModeControls", () => ({
  __esModule: true,
  default: () => <div data-testid="song-mode-controls" />,
}));

vi.mock("../../loading", () => ({
  __esModule: true,
  default: () => <div>loading</div>,
}));

vi.mock("../../hook/usePlaylists", () => ({
  __esModule: true,
  default: () => ({
    playlists: playlistsMock.playlists,
    isNowPlayingPlaylist: () => false,
    encodePlaylistUrlParam: () => "encoded-playlist",
    savePlaylist: playlistsMock.savePlaylist,
    isDuplicate: playlistsMock.isDuplicate,
  }),
}));

vi.mock("../../hook/useFavorites", () => ({
  __esModule: true,
  default: () => ({
    favorites: [],
  }),
}));

vi.mock("../../hook/usePlaylistActions", () => ({
  __esModule: true,
  usePlaylistActions: () => ({
    playPlaylist: playlistActionsMock.playPlaylist,
    disablePlaylistMode: playlistActionsMock.disablePlaylistMode,
    decodePlaylistFromUrl: playlistActionsMock.decodePlaylistFromUrl,
  }),
}));

const makeSong = (overrides: Partial<Song>): Song => ({
  video_id: overrides.video_id ?? "video-id",
  start: overrides.start ?? "0",
  end: overrides.end ?? "100",
  title: overrides.title ?? "Song",
  artist: overrides.artist ?? "AZKi",
  album: overrides.album ?? "",
  lyricist: overrides.lyricist ?? "",
  composer: overrides.composer ?? "",
  arranger: overrides.arranger ?? "",
  album_list_uri: overrides.album_list_uri ?? "",
  album_release_at: overrides.album_release_at ?? "",
  album_is_compilation: overrides.album_is_compilation ?? false,
  sing: overrides.sing ?? "AZKi",
  video_title: overrides.video_title ?? "video-title",
  video_uri: overrides.video_uri ?? "",
  broadcast_at: overrides.broadcast_at ?? "2025-01-01T00:00:00.000Z",
  year: overrides.year ?? 2025,
  tags: overrides.tags ?? [],
  milestones: overrides.milestones ?? [],
  source_order: overrides.source_order,
});

const oldOriginal = makeSong({
  video_id: "orig-old",
  title: "Old Original",
  broadcast_at: "2024-01-01T00:00:00.000Z",
  tags: ["オリ曲"],
});

const newOriginal = makeSong({
  video_id: "orig-new",
  title: "New Original",
  broadcast_at: "2025-01-01T00:00:00.000Z",
  tags: ["オリ曲"],
});

const oldCover = makeSong({
  video_id: "cover-old",
  title: "Old Cover",
  broadcast_at: "2024-06-01T00:00:00.000Z",
  tags: ["カバー曲"],
});

const newCover = makeSong({
  video_id: "cover-new",
  title: "New Cover",
  broadcast_at: "2026-01-01T00:00:00.000Z",
  tags: ["カバー曲"],
});

const searchSongs = vi.fn((songsToFilter: Song[], term: string) => {
  if (term === "original-songs") {
    return songsToFilter
      .filter((song) => song.tags.includes("オリ曲"))
      .sort((leftSong, rightSong) => {
        return (
          new Date(leftSong.broadcast_at || "").getTime() -
          new Date(rightSong.broadcast_at || "").getTime()
        );
      });
  }

  if (term === "cover-songs") {
    return songsToFilter.filter((song) => song.tags.includes("カバー曲"));
  }

  return songsToFilter;
});

const baseProps = {
  allSongs: [newOriginal, oldOriginal, oldCover, newCover],
  currentSong: null,
  hideFutureSongs: false,
  changeCurrentSong: vi.fn(),
  playRandomSong: vi.fn(),
  setSearchTerm: vi.fn(),
  setSongs: vi.fn(),
  searchSongs,
  showPlaylistSelector: false,
  setShowPlaylistSelector: vi.fn(),
};

describe("SearchAndSongList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playlistsMock.playlists = [];
    playlistsMock.isDuplicate.mockReturnValue(false);
    playlistActionsMock.decodePlaylistFromUrl.mockReturnValue(null);
    window.history.replaceState({}, "", "/");
  });

  it("横持ちでは曲名領域を確保するため一覧を40%幅にする", () => {
    const { container } = render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm=""
        layoutMode="landscape-columns"
      />,
    );

    expect(container.querySelector("section")).toHaveClass("min-w-0", "w-2/5");
  });

  it("縦持ちではページ末尾の重複モード切替を描画しない", () => {
    render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm=""
        layoutMode="portrait-theater"
      />,
    );

    // 閉じたモバイルオーバーレイ内の1組だけを残し、通常フローには出さない。
    expect(screen.getAllByTestId("song-mode-controls")).toHaveLength(1);
  });

  it("縦持ちの検索シートはChrome UIを除いた動的viewport内に収める", () => {
    render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm=""
        layoutMode="portrait-theater"
        isOverlayOpen
      />,
    );

    expect(screen.getByTestId("mobile-song-list-sheet")).toHaveClass(
      "h-[90dvh]",
      "max-h-[90dvh]",
    );
  });

  it("tabletopでは下段右半分に常設リストだけを表示する", () => {
    render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm=""
        layoutMode="tabletop"
      />,
    );

    const songListPane = screen.getByTestId("watch-song-list-pane");
    expect(songListPane).toHaveStyle({ position: "fixed" });
    expect(songListPane).toHaveAttribute("data-segment-layout", "css-env");
    expect(screen.getAllByTestId("songs-list-order")).toHaveLength(1);
    expect(screen.queryByLabelText("Close song list")).not.toBeInTheDocument();
  });

  it("URL直打ちでオリ曲モードを開いたときは初期表示が古い順になる", async () => {
    render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm="original-songs"
      />,
    );

    await waitFor(() => {
      const orders = screen.getAllByTestId("songs-list-order");
      expect(orders[0]).toHaveTextContent("Old Original|New Original");
      expect(
        screen.getAllByRole("button", { name: "sortAscending" }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("オリ曲モードで古い順にして先頭曲を再生し、他モードで新しい順へ戻す", async () => {
    const { rerender } = render(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm=""
      />,
    );

    rerender(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, oldOriginal]}
        searchTerm="original-songs"
      />,
    );

    await waitFor(() => {
      expect(baseProps.setSongs).toHaveBeenCalledWith([
        oldOriginal,
        newOriginal,
      ]);
      expect(baseProps.changeCurrentSong).toHaveBeenCalledWith(oldOriginal);
    });

    await waitFor(() => {
      const orders = screen.getAllByTestId("songs-list-order");
      expect(orders[0]).toHaveTextContent("Old Original|New Original");
      expect(
        screen.getAllByRole("button", { name: "sortAscending" }).length,
      ).toBeGreaterThan(0);
    });

    rerender(
      <SearchAndSongList
        {...baseProps}
        songs={[oldCover, newCover]}
        searchTerm="cover-songs"
      />,
    );

    await waitFor(() => {
      expect(baseProps.setSongs).toHaveBeenCalledWith([newCover, oldCover]);
      expect(baseProps.changeCurrentSong).toHaveBeenCalledWith(newCover);

      const orders = screen.getAllByTestId("songs-list-order");
      expect(orders[0]).toHaveTextContent("New Cover|Old Cover");
      expect(
        screen.getAllByRole("button", { name: "sortDescending" }).length,
      ).toBeGreaterThan(0);
    });

    rerender(
      <SearchAndSongList
        {...baseProps}
        songs={[newOriginal, newCover, oldOriginal, oldCover]}
        searchTerm=""
      />,
    );

    await waitFor(() => {
      expect(baseProps.changeCurrentSong).toHaveBeenCalledTimes(2);
      expect(
        screen.getAllByRole("button", { name: "sortDescending" }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("プレイリスト再生中は受け取ったプレイリスト順を表示する", async () => {
    window.history.replaceState({}, "", "/watch?playlist=encoded-playlist");

    render(
      <SearchAndSongList
        {...baseProps}
        songs={[oldCover, newCover]}
        searchTerm=""
      />,
    );

    await waitFor(() => {
      const orders = screen.getAllByTestId("songs-list-order");
      expect(orders[0]).toHaveTextContent("Old Cover|New Cover");
      expect(
        screen.getAllByRole("button", { name: "sortDescending" })[0],
      ).toBeDisabled();
    });
  });

  it("共有プレイリスト再生中は保存済みプレイリストがなくても解除できる", async () => {
    playlistActionsMock.decodePlaylistFromUrl.mockReturnValue({
      id: "shared-playlist",
      name: "Shared Playlist",
      songs: [
        { videoId: oldCover.video_id, start: oldCover.start },
        { videoId: newCover.video_id, start: newCover.start },
      ],
    });
    window.history.replaceState({}, "", "/watch?playlist=encoded-playlist");

    render(
      <SearchAndSongList
        {...baseProps}
        songs={[oldCover, newCover]}
        searchTerm=""
        showPlaylistSelector={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("nowPlayingPlaylist")).toBeInTheDocument();
    });

    const disableButton = screen.getByRole("button", {
      name: "disablePlaylistMode",
    });

    expect(disableButton).toBeInTheDocument();
    fireEvent.click(disableButton);

    expect(playlistActionsMock.disablePlaylistMode).toHaveBeenCalledTimes(1);
    expect(baseProps.setShowPlaylistSelector).toHaveBeenCalledWith(false);
  });

  it("共有プレイリストを自分のプレイリストにコピー保存できる", async () => {
    playlistActionsMock.decodePlaylistFromUrl.mockReturnValue({
      id: "shared-playlist",
      name: "Shared Playlist",
      songs: [
        { videoId: oldCover.video_id, start: oldCover.start },
        { videoId: newCover.video_id, start: newCover.start },
      ],
      author: "someone",
    });
    window.history.replaceState({}, "", "/watch?playlist=encoded-playlist");

    render(
      <SearchAndSongList
        {...baseProps}
        songs={[oldCover, newCover]}
        searchTerm=""
        showPlaylistSelector={true}
      />,
    );

    const saveCopyButton = await screen.findByRole("button", {
      name: "savePlaylistCopy",
    });

    fireEvent.click(saveCopyButton);

    expect(playlistsMock.savePlaylist).toHaveBeenCalledWith({
      name: "Shared Playlist",
      songs: [
        { videoId: oldCover.video_id, start: oldCover.start },
        { videoId: newCover.video_id, start: newCover.start },
      ],
      author: "someone",
    });
  });
});
