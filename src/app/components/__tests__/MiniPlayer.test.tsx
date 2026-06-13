import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { pushMock, sharedPlayerSourceRef } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  sharedPlayerSourceRef: { current: null as any },
}));

// Mocks
vi.mock("../SharedYouTubePlayer", () => ({
  SharedYouTubePlayerSlot: () => <div data-testid="shared-player-slot" />,
  useSharedYouTubePlayerSource: (source: any) => {
    sharedPlayerSourceRef.current = source;
  },
}));
vi.mock("../YoutubeThumbnail", () => ({
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
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathnameValue,
  useRouter: () => ({ push: pushMock }),
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

const laterSampleSong = {
  ...sampleSong,
  start: "120",
  title: "Song2",
};

describe("MiniPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharedPlayerSourceRef.current = null;
    pathnameValue = "/";
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
      currentTime: 42.8,
      setIsPlaying,
      setCurrentTime: vi.fn(),
      maximizePlayer,
      setIsMinimized,
      setCurrentSong,
    };
    pathnameValue = "/some";

    const { getByTitle, getByTestId } = render(<MiniPlayer />);
    act(() => {
      sharedPlayerSourceRef.current.onReady({
        target: {
          getCurrentTime: vi.fn(() => 45.8),
          pauseVideo: vi.fn(),
          playVideo: vi.fn(),
        },
      });
    });

    // Ensure mini player rendered
    expect(getByTestId("mini-player")).toBeTruthy();

    // maximize button
    const maxBtn = getByTitle("プレイヤーを最大化");
    fireEvent.click(maxBtn);
    expect(maximizePlayer).toHaveBeenCalled();
    expect(globalPlayerMockValue.setCurrentTime).toHaveBeenCalledWith(45.8);
    expect(pushMock).toHaveBeenCalledWith("/watch?v=v1&t=45s");

    // close button
    const closeBtn = getByTitle("閉じる");
    fireEvent.click(closeBtn);
    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setIsMinimized).toHaveBeenCalledWith(false);
  });

  it("does not seek the mini player when retained time changes after ready", () => {
    globalPlayerMockValue = {
      currentSong: sampleSong,
      isPlaying: true,
      isMinimized: true,
      currentTime: 5,
      setIsPlaying: vi.fn(),
      setCurrentTime: vi.fn(),
      maximizePlayer: vi.fn(),
      setIsMinimized: vi.fn(),
      setCurrentSong: vi.fn(),
    };
    pathnameValue = "/some";

    const { rerender } = render(<MiniPlayer />);

    const player = {
      seekTo: vi.fn(),
      getCurrentTime: vi.fn(() => 5),
      playVideo: vi.fn(),
    };

    act(() => {
      sharedPlayerSourceRef.current.onReady({ target: player });
    });

    globalPlayerMockValue = {
      ...globalPlayerMockValue,
      currentTime: 42,
    };

    rerender(<MiniPlayer />);

    expect(player.seekTo).not.toHaveBeenCalled();
  });

  it("does not seek back to song start when currentSong advances with playback", async () => {
    const setCurrentTime = vi.fn();
    globalPlayerMockValue = {
      currentSong: sampleSong,
      isPlaying: true,
      isMinimized: true,
      currentTime: 130,
      setIsPlaying: vi.fn(),
      setCurrentTime,
      maximizePlayer: vi.fn(),
      setIsMinimized: vi.fn(),
      setCurrentSong: vi.fn(),
    };
    pathnameValue = "/some";

    const { rerender } = render(<MiniPlayer />);

    const player = {
      seekTo: vi.fn(),
      getCurrentTime: vi.fn(() => 130),
      playVideo: vi.fn(),
    };

    act(() => {
      sharedPlayerSourceRef.current.onReady({ target: player });
    });

    player.seekTo.mockClear();

    globalPlayerMockValue = {
      ...globalPlayerMockValue,
      currentSong: laterSampleSong,
      currentTime: 130,
    };

    rerender(<MiniPlayer />);

    await waitFor(() => {
      expect(sharedPlayerSourceRef.current.startTime).toBe(130);
    });
    expect(player.seekTo).not.toHaveBeenCalledWith(120, true);
    expect(setCurrentTime).not.toHaveBeenCalledWith(120);
  });

  it("initializes YouTube player with retained playback time instead of song start", () => {
    globalPlayerMockValue = {
      currentSong: laterSampleSong,
      isPlaying: true,
      isMinimized: true,
      currentTime: 145,
      setIsPlaying: vi.fn(),
      setCurrentTime: vi.fn(),
      maximizePlayer: vi.fn(),
      setIsMinimized: vi.fn(),
      setCurrentSong: vi.fn(),
    };
    pathnameValue = "/some";

    render(<MiniPlayer />);

    expect(sharedPlayerSourceRef.current.startTime).toBe(145);
  });
});
