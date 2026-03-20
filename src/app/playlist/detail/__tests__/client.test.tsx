import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

vi.mock("@mantine/core", () => {
  const createComponent =
    (tag: keyof JSX.IntrinsicElements) =>
    ({ children, ...props }: any) =>
      React.createElement(tag, props, children);

  const TableRoot = ({ children, ...props }: any) => <table>{children}</table>;

  return {
    createTheme: (value: any) => value,
    Badge: createComponent("span"),
    Breadcrumbs: createComponent("nav"),
    Button: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Checkbox: ({ checked, indeterminate, onChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        aria-checked={indeterminate ? "mixed" : checked}
        onChange={onChange}
        {...props}
      />
    ),
    ScrollArea: createComponent("div"),
    Table: Object.assign(TableRoot, {
      Thead: createComponent("thead"),
      Tbody: createComponent("tbody"),
      Tr: createComponent("tr"),
      Th: createComponent("th"),
      Td: createComponent("td"),
    }),
  };
});

vi.mock("flowbite-react", () => ({
  createTheme: (value: any) => value,
}));

vi.mock("@mantine/hooks", () => ({
  useSelection: () => [
    [],
    {
      isSomeSelected: () => false,
      isAllSelected: () => false,
      resetSelection: vi.fn(),
      setSelection: vi.fn(),
      select: vi.fn(),
      deselect: vi.fn(),
    },
  ],
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/loading", () => ({
  default: () => <div>loading</div>,
}));

vi.mock("react-icons/fa6", () => ({
  FaRegTrashCan: () => <span>trash</span>,
  FaBars: () => <span>bars</span>,
  FaYoutube: () => <span aria-hidden="true" />,
}));

vi.mock("react-icons/lu", () => ({
  LuPlay: () => <span aria-hidden="true" />,
}));

vi.mock("react-icons/hi", () => ({
  HiHome: () => <span>home</span>,
  HiChevronRight: () => <span>chevron</span>,
}));

vi.mock("../../../theme", () => ({
  breadcrumbClasses: {
    root: "root",
    separator: "separator",
    link: "link",
  },
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  useSensors: vi.fn(() => []),
  useSensor: vi.fn(() => ({})),
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  })),
  arrayMove: vi.fn((items) => items),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

const useSongsMock = vi.fn();
vi.mock("../../../hook/useSongs", () => ({
  default: () => useSongsMock(),
}));

const usePlaylistsMock = vi.fn();
vi.mock("../../../hook/usePlaylists", () => ({
  default: () => usePlaylistsMock(),
}));

const useFavoritesMock = vi.fn();
vi.mock("../../../hook/useFavorites", () => ({
  default: () => useFavoritesMock(),
}));

const globalPlayerMock = {
  setCurrentSong: vi.fn(),
  setCurrentTime: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsMinimized: vi.fn(),
};

vi.mock("../../../hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => globalPlayerMock,
}));

vi.mock("../../../components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => (
    <div data-testid="yt-thumb" data-alt={alt} />
  ),
}));

import PlaylistDetailPage from "../client";

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

describe("PlaylistDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.history.pushState({}, "", "/playlist/detail?id=playlist-1");

    useSongsMock.mockReturnValue({
      allSongs: [sampleSong],
      isLoading: false,
    });

    usePlaylistsMock.mockReturnValue({
      playlists: [
        {
          id: "playlist-1",
          name: "プレイリスト1",
          songs: [{ videoId: "video-1", start: "15" }],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updatePlaylist: vi.fn(),
      encodePlaylistUrlParam: vi.fn(),
      clearAllSongs: vi.fn(),
    });

    useFavoritesMock.mockReturnValue({
      favorites: [],
      reorderFavorites: vi.fn(),
      clearAllFavorites: vi.fn(),
      removeMultipleFavorites: vi.fn(),
    });
  });

  it("再生ボタンでMiniPlayerのプレビュー再生を開始する", async () => {
    render(<PlaylistDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("テスト曲")).toBeInTheDocument();
    });

    expect(screen.getByText("テスト動画")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /youtube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=video-1&t=15s",
    );

    fireEvent.click(screen.getByRole("button", { name: "プレビュー" }));

    expect(globalPlayerMock.setCurrentSong).toHaveBeenCalledWith(sampleSong);
    expect(globalPlayerMock.setCurrentTime).toHaveBeenCalledWith(15);
    expect(globalPlayerMock.setIsMinimized).toHaveBeenCalledWith(true);
    expect(globalPlayerMock.setIsPlaying).toHaveBeenCalledWith(true);
  });
});
