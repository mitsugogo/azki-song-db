import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";

const coverSong: Song = {
  video_id: "cover-1",
  start: "0",
  end: "60",
  title: "Cover Song",
  artist: "AZKi",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  video_title: "cover-video",
  video_uri: "",
  broadcast_at: "2025-01-01",
  year: 2025,
  tags: ["カバー曲"],
  milestones: [],
};

const originalSong: Song = {
  video_id: "orig-1",
  start: "30",
  end: "120",
  title: "Original Song",
  artist: "AZKi",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  video_title: "orig-video",
  video_uri: "",
  broadcast_at: "2025-02-01",
  year: 2025,
  tags: ["オリ曲"],
  milestones: [],
};

const allSongs: Song[] = [coverSong, originalSong];

const searchState = {
  songs: allSongs,
  setSongs: vi.fn<(songs: Song[]) => void>(),
  searchTerm: "",
  setSearchTerm: vi.fn<(term: string) => void>(),
  searchSongs: vi.fn(() => allSongs),
};

const controlsState = {
  currentSong: originalSong as Song | null,
  previousSong: null as Song | null,
  nextSong: null as Song | null,
  isPlaying: false,
  playerKey: 1,
  hideFutureSongs: false,
  videoId: "orig-1",
  videoTitle: "orig-video",
  videoData: null,
  videoInfo: null,
  startTime: 30,
  timedLiveCallText: null as string | null,
  setHideFutureSongs: vi.fn(),
  changeCurrentSong: vi.fn(),
  playRandomSong: vi.fn(),
  handlePlayerOnReady: vi.fn(),
  handlePlayerStateChange: vi.fn(),
  setPreviousAndNextSongs: vi.fn(),
  setHasRestoredPosition: vi.fn(),
  setPreviousVideoId: vi.fn(),
  playerControls: {
    isReady: true,
    play: vi.fn(),
    pause: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    mute: vi.fn(),
    unMute: vi.fn(),
    currentTime: 0,
    seekInFlight: null,
    volume: 50,
    isMuted: false,
    duration: 300,
  },
};

const globalPlayerMockValue = {
  currentSong: null as Song | null,
  isPlaying: false,
  isMinimized: false,
  currentTime: 0,
  setCurrentSong: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsMinimized: vi.fn(),
  setCurrentTime: vi.fn(),
  minimizePlayer: vi.fn(),
  maximizePlayer: vi.fn(),
  seekTo: vi.fn(),
  setSeekTo: vi.fn(),
};

vi.mock("../PlayerSection", () => ({
  __esModule: true,
  default: () => <div data-testid="player-section" />,
}));

vi.mock("../SearchAndSongList", () => ({
  __esModule: true,
  default: () => <div data-testid="search-and-song-list" />,
}));

vi.mock("../NowPlayingSongInfo", () => ({
  __esModule: true,
  default: () => <div data-testid="now-playing" />,
}));

vi.mock("../ShareModal", () => ({
  __esModule: true,
  default: () => <div data-testid="share-modal" />,
}));

vi.mock("../ToastNotification", () => ({
  __esModule: true,
  default: () => <div data-testid="toast" />,
}));

vi.mock("../../loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  },
}));

vi.mock("../../hook/useSongs", () => ({
  __esModule: true,
  default: () => ({ allSongs, isLoading: false }),
}));

vi.mock("../../hook/useSearch", () => ({
  __esModule: true,
  default: () => searchState,
}));

vi.mock("../../hook/useMainPlayerControls", () => ({
  __esModule: true,
  default: () => controlsState,
}));

vi.mock("../../hook/useGlobalPlayer", () => ({
  __esModule: true,
  useGlobalPlayer: () => globalPlayerMockValue,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@mantine/hooks", () => ({
  useMediaQuery: () => true,
  useLocalStorage: (options: { key: string; defaultValue: unknown }) => {
    if (options.key === "foldable-mode") {
      return ["default", vi.fn()] as const;
    }
    return [options.defaultValue, vi.fn()] as const;
  },
}));

import MainPlayer from "../MainPlayer";

describe("MainPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    searchState.songs = allSongs;
    searchState.searchTerm = "";

    controlsState.currentSong = originalSong;
    controlsState.videoId = originalSong.video_id;
    controlsState.startTime = Number(originalSong.start);
  });

  it("モード切替で現在曲が一覧外になっても、曲が変わっていなければ全曲へ戻さない", async () => {
    const { rerender } = render(<MainPlayer />);

    searchState.searchTerm = "cover-songs";
    searchState.songs = [coverSong];

    rerender(<MainPlayer />);

    await waitFor(() => {
      expect(searchState.setSearchTerm).not.toHaveBeenCalledWith("");
      expect(searchState.setSongs).not.toHaveBeenCalledWith(allSongs);
    });
  });

  it("絞り込み中に現在曲が一覧外の曲へ切り替わったときは全曲へ戻す", async () => {
    searchState.searchTerm = "cover-songs";
    searchState.songs = [coverSong];
    controlsState.currentSong = coverSong;
    controlsState.videoId = coverSong.video_id;
    controlsState.startTime = Number(coverSong.start);

    const { rerender } = render(<MainPlayer />);

    controlsState.currentSong = originalSong;
    controlsState.videoId = originalSong.video_id;
    controlsState.startTime = Number(originalSong.start);

    rerender(<MainPlayer />);

    await waitFor(() => {
      expect(searchState.setSearchTerm).toHaveBeenCalledWith("");
      expect(searchState.setSongs).toHaveBeenCalledWith(allSongs);
    });
  });
});
