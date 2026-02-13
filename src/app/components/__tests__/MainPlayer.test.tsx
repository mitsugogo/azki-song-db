import React, { use } from "react";
import { render, screen } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

// Prepare a mutable mock that the mocked PlayerSection will use
let mockSetVolume: ReturnType<typeof vi.fn> = vi.fn();

vi.mock("../PlayerSection", () => {
  const React = require("react");
  return {
    default: (props: any) => {
      React.useEffect(() => {
        // Provide a fake player object to simulate YouTube onReady
        const player = {
          setVolume: (...args: any[]) => new mockSetVolume(...args),
          getCurrentTime: () => 0,
          seekTo: () => {},
        };
        if (props && typeof props.handlePlayerOnReady === "function") {
          props.handlePlayerOnReady({ target: player });
        }
      }, []);
      return null;
    },
  };
});

vi.mock("../../hook/useSongs", () => {
  return {
    default: () => ({
      allSongs: [],
      isLoading: false,
      availableTags: [],
      availableArtists: [],
      availableSingers: [],
      availableSongTitles: [],
      availableMilestones: [],
      availableTitleAndArtists: [],
    }),
  };
});

vi.mock("../../hook/useSearch", () => {
  return {
    default: (allSongs: any) => ({
      songs: [],
      setSongs: () => {},
      searchTerm: "",
      setSearchTerm: () => {},
      searchSongs: () => {},
    }),
  };
});

vi.mock("../../hook/usePlayerControls", () => {
  return {
    default: (songs: any, allSongs: any) => ({
      currentSong: null,
      currentSongRef: {},
      previousSong: null,
      nextSong: null,
      isPlaying: false,
      playerKey: "",
      hideFutureSongs: false,
      videoId: null,
      startTime: 0,
      timedLiveCallText: null,
      setHideFutureSongs: () => {},
      changeCurrentSong: () => {},
      playRandomSong: () => {},
      handlePlayerOnReady: () => {},
      handleStateChange: () => {},
      setPreviousAndNextSongs: () => {},
    }),
  };
});

vi.mock("../../hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => ({
    currentTime: 0,
    setCurrentSong: () => {},
    setCurrentTime: () => {},
    setIsPlaying: () => {},
    setIsMinimized: () => {},
    maximizePlayer: () => {},
    setIsMinimizedForced: () => {},
    setSeekTo: () => {},
    seekTo: () => {},
  }),
}));

vi.mock("../SearchAndSongList", () => ({ default: () => null }));
vi.mock("../ShareModal", () => ({ default: () => null }));
vi.mock("../ToastNotification", () => ({ default: () => null }));
vi.mock("../../loading", () => ({ default: () => null }));

// Mock Mantine Spotlight used in the component to avoid rendering complexities
vi.mock("@mantine/spotlight", () => ({
  Spotlight: (props: any) => null,
  createSpotlight: () => [null, {}],
  spotlight: { close: () => {}, open: () => {} },
}));

// Import under test (after mocks)
import { MainPlayer } from "../../../app/MainPlayer";

beforeEach(() => {
  localStorage.clear();
  mockSetVolume = vi.fn();
});

describe("MainPlayer", () => {
  it.skip("renders MainPlayer without crashing", () => {
    render(<MainPlayer />);
    expect(screen.getByTestId("main-player")).toBeInTheDocument();
  });
});
