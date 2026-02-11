import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlayerSection from "../PlayerSection";
import { MantineProvider } from "@mantine/core";
import type { Song } from "../../types/song";

// Polyfill matchMedia for Mantine internals in the test environment
if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Mock OverlayScrollbarsComponent to avoid heavy native behavior
vi.mock("overlayscrollbars-react", () => ({
  OverlayScrollbarsComponent: ({ children }: any) => (
    <div data-testid="os">{children}</div>
  ),
}));

// Mock motion/react to simplify animations
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: { p: (props: any) => <p {...props} /> },
}));

// We'll control the hook's return value per-test by reassigning this variable
let mockControlBar: any = {
  songsInVideo: [],
  canUsePlayerControls: true,
  allSongsHaveEnd: false,
  songCumulativeMap: [],
  totalSongsDuration: 0,
  videoDuration: 0,
  videoStartTime: 0,
  displayDuration: 0,
  tempSeekValue: 0,
  setTempSeekValue: () => {},
  handleSeekChange: () => {},
  handleSeekStart: () => {},
  handleSeekEnd: () => {},
  hoveredChapter: null,
  setHoveredChapter: () => {},
  formattedCurrentTime: "0:00",
  formattedDuration: "0:00",
  displaySongTitle: "",
  displaySongArtist: "",
  handleTogglePlay: () => {},
  isMuted: false,
  tempVolumeValue: 50,
  handleVolumeIconClick: () => {},
  isTouchDevice: false,
  showVolumeSlider: false,
  handleVolumeChange: () => {},
  handleNext: () => {},
  volumeValue: 50,
};

vi.mock("../../hook/useControlBar", () => ({
  __esModule: true,
  default: () => mockControlBar,
}));

// Mock children components used inside PlayerSection
vi.mock("../YouTubePlayer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="youtube"
      data-disable-end={props.disableEnd ? "1" : "0"}
      data-key={props?.key}
    >
      {props.song?.title}
    </div>
  ),
}));

vi.mock("../PlayerControlsBar", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="player-controls" data-props={JSON.stringify(props)} />
  ),
}));

vi.mock("../NowPlayingSongInfo", () => ({
  __esModule: true,
  default: () => <div data-testid="now-playing" />,
}));

const baseSong: Song = {
  title: "S1",
  artist: "A",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "",
  video_title: "",
  video_uri: "",
  video_id: "v1",
  start: "0",
  end: "10",
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
};

describe("PlayerSection", () => {
  beforeEach(() => {
    mockControlBar = {
      ...mockControlBar,
      songsInVideo: [],
      canUsePlayerControls: true,
    };
  });

  const renderWithWrapper = (ui: any) =>
    render(ui, {
      wrapper: ({ children }) => (
        <MantineProvider withGlobalStyles withNormalizeCSS>
          {children}
        </MantineProvider>
      ),
    });

  it("renders YouTubePlayer when currentSong is provided", () => {
    mockControlBar.songsInVideo = [baseSong];
    const { getByTestId } = renderWithWrapper(
      <PlayerSection
        currentSong={baseSong}
        previousSong={null}
        nextSong={null}
        allSongs={[baseSong]}
        songs={[baseSong]}
        searchTerm=""
        isPlaying={false}
        playerKey={1}
        hideFutureSongs={false}
        handlePlayerOnReady={() => {}}
        handleStateChange={() => {}}
        changeCurrentSong={() => {}}
        playRandomSong={() => {}}
        setSongsToCurrentVideo={() => {}}
        setSongs={() => {}}
        searchSongs={() => []}
        setOpenShareModal={() => {}}
        setSearchTerm={() => {}}
        setHideFutureSongs={() => {}}
      />,
    );

    expect(getByTestId("youtube")).toBeTruthy();
  });

  it("does not render YouTubePlayer when currentSong is null", () => {
    const { queryByTestId } = renderWithWrapper(
      <PlayerSection
        currentSong={null}
        previousSong={null}
        nextSong={null}
        allSongs={[]}
        songs={[]}
        searchTerm=""
        isPlaying={false}
        playerKey={1}
        hideFutureSongs={false}
        handlePlayerOnReady={() => {}}
        handleStateChange={() => {}}
        changeCurrentSong={() => {}}
        playRandomSong={() => {}}
        setSongsToCurrentVideo={() => {}}
        setSongs={() => {}}
        searchSongs={() => []}
        setOpenShareModal={() => {}}
        setSearchTerm={() => {}}
        setHideFutureSongs={() => {}}
      />,
    );

    expect(queryByTestId("youtube")).toBeNull();
  });

  it("passes disableEnd=true to YouTubePlayer when hasNextInVideo is true", () => {
    const nextSong: Song = { ...baseSong, title: "S2", start: "11", end: "20" };
    // songsInVideo contains current followed by a different song => hasNextInVideo true
    mockControlBar.songsInVideo = [baseSong, nextSong];

    const { getByTestId } = renderWithWrapper(
      <PlayerSection
        currentSong={baseSong}
        previousSong={null}
        nextSong={nextSong}
        allSongs={[baseSong, nextSong]}
        songs={[baseSong, nextSong]}
        searchTerm=""
        isPlaying={false}
        playerKey={2}
        hideFutureSongs={false}
        videoId={baseSong.video_id}
        startTime={0}
        handlePlayerOnReady={() => {}}
        handleStateChange={() => {}}
        changeCurrentSong={() => {}}
        playRandomSong={() => {}}
        setSongsToCurrentVideo={() => {}}
        setSongs={() => {}}
        searchSongs={() => []}
        setOpenShareModal={() => {}}
        setSearchTerm={() => {}}
        setHideFutureSongs={() => {}}
      />,
    );

    const yt = getByTestId("youtube");
    expect(yt.getAttribute("data-disable-end")).toBe("1");
  });

  it("renders timedLiveCallText and updates when prop changes", () => {
    const songWithLive: Song = { ...baseSong, live_call: true as any };
    mockControlBar.songsInVideo = [songWithLive];

    const { getByText, rerender, container } = renderWithWrapper(
      <PlayerSection
        currentSong={songWithLive}
        previousSong={null}
        nextSong={null}
        allSongs={[songWithLive]}
        songs={[songWithLive]}
        searchTerm=""
        isPlaying={false}
        playerKey={3}
        hideFutureSongs={false}
        timedLiveCallText={"line1\nline2"}
        handlePlayerOnReady={() => {}}
        handleStateChange={() => {}}
        changeCurrentSong={() => {}}
        playRandomSong={() => {}}
        setSongsToCurrentVideo={() => {}}
        setSongs={() => {}}
        searchSongs={() => []}
        setOpenShareModal={() => {}}
        setSearchTerm={() => {}}
        setHideFutureSongs={() => {}}
      />,
    );

    // The timed live call text should be present (rendered as innerHTML or text)
    const p = container.querySelector("p.truncate");
    expect(p).toBeTruthy();
    // Accept either rendered HTML with <br> or plain text with newline
    expect(
      p &&
        (p.innerHTML.includes("<br>") ||
          (p.textContent || "").includes("line2")),
    ).toBeTruthy();

    // Update prop and expect new text to appear
    rerender(
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <PlayerSection
          currentSong={songWithLive}
          previousSong={null}
          nextSong={null}
          allSongs={[songWithLive]}
          songs={[songWithLive]}
          searchTerm=""
          isPlaying={false}
          playerKey={3}
          hideFutureSongs={false}
          timedLiveCallText={"onlyone"}
          handlePlayerOnReady={() => {}}
          handleStateChange={() => {}}
          changeCurrentSong={() => {}}
          playRandomSong={() => {}}
          setSongsToCurrentVideo={() => {}}
          setSongs={() => {}}
          searchSongs={() => []}
          setOpenShareModal={() => {}}
          setSearchTerm={() => {}}
          setHideFutureSongs={() => {}}
        />
      </MantineProvider>,
    );

    expect(container.querySelector("p.truncate")?.textContent).toContain(
      "onlyone",
    );
  });
});
