import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { Song } from "../../types/song";
import SongsList, { getGridCols, areSongsEqual } from "../SongList";

// Mock Mantine's ScrollArea to a basic div that forwards the viewportRef
vi.mock("@mantine/core", () => {
  return {
    ScrollArea: ({ children, viewportRef, ...rest }: any) => (
      <div
        {...rest}
        ref={(node) => {
          if (typeof viewportRef === "function") {
            viewportRef(node);
          } else if (viewportRef && "current" in viewportRef) {
            viewportRef.current = node;
          }
        }}
      >
        {children}
      </div>
    ),
  };
});

const mockVirtualizer = {
  getVirtualItems: vi.fn(
    () =>
      [] as Array<{
        index: number;
        start: number;
        end: number;
        key: string;
      }>,
  ),
  scrollToIndex: vi.fn(),
  getTotalSize: vi.fn(() => 0),
  measureElement: vi.fn(),
};

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => mockVirtualizer,
}));

vi.mock("../SongListItem", () => {
  return {
    default: React.forwardRef<HTMLLIElement, any>(
      ({ song, isHide, ...rest }, ref) => (
        <li
          ref={ref}
          data-testid="song-list-item"
          data-is-hide={isHide}
          {...rest}
        >
          {song?.title}
        </li>
      ),
    ),
  };
});

vi.mock("../YearPager", () => ({
  default: (props: any) => (
    <div
      data-testid="year-pager"
      data-current-count={props.currentSongIds?.length ?? 0}
    >
      YearPager
    </div>
  ),
}));

type VirtualRow = {
  index: number;
  start: number;
  end: number;
  key: string;
};

const createVirtualItems = (count: number): VirtualRow[] =>
  Array.from({ length: count }, (_, index) => ({
    index,
    start: index * 100,
    end: (index + 1) * 100,
    key: `row-${index}`,
  }));

const baseSong: Song = {
  title: "",
  artist: "AZKi",
  album: "",
  album_list_uri: "",
  album_release_at: "2020-01-01",
  album_is_compilation: false,
  sing: "",
  video_title: "",
  video_uri: "https://youtu.be/test",
  video_id: "",
  start: "00:00",
  end: "00:00",
  broadcast_at: "2020-01-01",
  year: 2020,
  tags: [],
  milestones: [],
};

const createSong = (overrides: Partial<Song> = {}): Song => ({
  ...baseSong,
  ...overrides,
  video_id: overrides.video_id ?? overrides.title ?? "video-id",
  title: overrides.title ?? "Song",
});

const renderSongList = (
  songs: Song[],
  options?: Partial<{ currentSong: Song | null; hideFuture: boolean }>,
) => {
  render(
    <SongsList
      songs={songs}
      hideFutureSongs={options?.hideFuture ?? false}
      currentSongInfo={options?.currentSong ?? null}
      changeCurrentSong={vi.fn()}
    />,
  );
};

let virtualItems: VirtualRow[] = [];

beforeEach(() => {
  virtualItems = createVirtualItems(50);
  window.innerWidth = 500;

  mockVirtualizer.getVirtualItems.mockImplementation(() =>
    virtualItems.map((item) => ({ ...item })),
  );
  mockVirtualizer.getTotalSize.mockImplementation(() =>
    virtualItems.length ? virtualItems[virtualItems.length - 1].end + 100 : 0,
  );
  mockVirtualizer.scrollToIndex.mockClear();
  mockVirtualizer.getVirtualItems.mockClear();
  mockVirtualizer.getTotalSize.mockClear();
  mockVirtualizer.measureElement.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("getGridCols", () => {
  it("returns expected column counts for breakpoints", () => {
    expect(getGridCols(500)).toBe(1);
    expect(getGridCols(800)).toBe(2);
    expect(getGridCols(1400)).toBe(3);
    expect(getGridCols(2000)).toBe(4);
    expect(getGridCols(3000)).toBe(5);
  });
});

describe("areSongsEqual", () => {
  it("identifies identical songs", () => {
    const songA = createSong({
      title: "A",
      video_id: "video-A",
      start: "00:10",
    });
    const songB = createSong({
      title: "A",
      video_id: "video-A",
      start: "00:10",
    });
    const songC = createSong({
      title: "B",
      video_id: "video-B",
      start: "00:20",
    });

    expect(areSongsEqual(songA, songB)).toBe(true);
    expect(areSongsEqual(songA, songC)).toBe(false);
    expect(areSongsEqual(songA, null)).toBe(false);
  });
});

describe("SongsList", () => {
  it("shows the YearPager when song count exceeds the threshold", async () => {
    const songs = Array.from({ length: 16 }, (_, index) =>
      createSong({
        title: `Song ${index}`,
        video_id: `video-${index}`,
        start: `00:${index.toString().padStart(2, "0")}`,
      }),
    );

    renderSongList(songs);

    await waitFor(() =>
      expect(screen.getByTestId("year-pager")).toBeInTheDocument(),
    );
    expect(screen.getAllByTestId("song-list-item")).toHaveLength(16);
  });

  it("hides the YearPager when there are not enough songs", async () => {
    const songs = Array.from({ length: 5 }, (_, index) =>
      createSong({
        title: `Song ${index}`,
        video_id: `video-${index}`,
        start: `00:0${index}`,
      }),
    );

    renderSongList(songs);

    await waitFor(() => expect(screen.queryByTestId("year-pager")).toBeNull());
  });

  it("marks songs after the current one as hidden when hideFutureSongs is enabled", async () => {
    const songs = [
      createSong({ title: "First", video_id: "video-1" }),
      createSong({ title: "Second", video_id: "video-2" }),
      createSong({ title: "Third", video_id: "video-3" }),
    ];

    renderSongList(songs, { currentSong: songs[1], hideFuture: true });

    const items = await screen.findAllByTestId("song-list-item");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute("data-is-hide", "false");
    expect(items[1]).toHaveAttribute("data-is-hide", "false");
    expect(items[2]).toHaveAttribute("data-is-hide", "true");
  });
});
