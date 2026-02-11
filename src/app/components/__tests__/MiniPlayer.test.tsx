import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
vi.mock("../YouTubePlayer", () => ({
  default: (props: any) => <div data-testid="yt-player" />,
}));
vi.mock("./YoutubeThumbnail", () => ({
  default: () => <div data-testid="yt-thumb" />,
}));
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: { div: (props: any) => <div {...props} /> },
}));

// Mutable mocks for hooks used by MiniPlayer
let globalPlayerMockValue: any = {
  currentSong: null,
  isPlaying: false,
  isMinimized: false,
  currentTime: 0,
  setIsPlaying: vi.fn(),
  setCurrentTime: vi.fn(),
  maximizePlayer: vi.fn(),
  setIsMinimized: vi.fn(),
  setCurrentSong: vi.fn(),
};

vi.mock("../../hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => globalPlayerMockValue,
}));

vi.mock("../../hook/useSongs", () => ({ default: () => ({ allSongs: [] }) }));

let pathnameValue = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameValue,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@mantine/hooks", () => ({ useLocalStorage: () => [null, vi.fn()] }));

import MiniPlayer from "../MiniPlayer";
import { useGlobalPlayer } from "../../hook/useGlobalPlayer";

const sampleSong = {
  video_id: "v1",
  start: "0",
  end: "",
  title: "Song1",
  artist: "Artist",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "",
  video_title: "VT",
  video_uri: "",
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
};

describe("MiniPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null on home page", () => {
    // usePathname mocked to '/' so MiniPlayer should return null
    pathnameValue = "/";
    globalPlayerMockValue = {
      ...globalPlayerMockValue,
      currentSong: null,
      isMinimized: false,
    };
    const { container } = render(<MiniPlayer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when minimized and currentSong exists, and buttons work", () => {
    // override useGlobalPlayer mock to provide song and handlers
    const setIsPlaying = vi.fn();
    const setIsMinimized = vi.fn();
    const maximizePlayer = vi.fn();
    const setCurrentSong = vi.fn();

    globalPlayerMockValue = {
      currentSong: sampleSong,
      isPlaying: false,
      isMinimized: true,
      currentTime: 0,
      setIsPlaying,
      setCurrentTime: vi.fn(),
      maximizePlayer,
      setIsMinimized,
      setCurrentSong,
    };
    pathnameValue = "/some";

    const { getByTitle, getByTestId } = render(<MiniPlayer />);

    // Ensure mini player rendered
    expect(getByTestId("mini-player")).toBeTruthy();

    // maximize button
    const maxBtn = getByTitle("プレイヤーを最大化");
    fireEvent.click(maxBtn);
    expect(maximizePlayer).toHaveBeenCalled();

    // close button
    const closeBtn = getByTitle("閉じる");
    fireEvent.click(closeBtn);
    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setIsMinimized).toHaveBeenCalledWith(false);
  });
});
