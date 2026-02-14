import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlayerControlsBar from "../PlayerControlsBar";
import { MantineProvider } from "@mantine/core";
import type { Song } from "../../types/song";

// Mock Mantine hooks and components used
vi.mock("@mantine/hooks", () => ({
  useClickOutside: (fn: any) => ({ current: null }),
  useMediaQuery: () => true, // force PC layout
}));

// Mock CreatePlaylistModal to avoid internal dependencies
vi.mock("../CreatePlaylistModal", () => ({ default: () => null }));

// モック関数は参照できるように外部に保持する
const addToPlaylistMock = vi.fn();
const removeFromPlaylistMock = vi.fn();
const isInPlaylistMock = vi.fn(() => false);
const isInAnyPlaylistMock = vi.fn(() => false);
const toggleFavoriteMock = vi.fn();
const isInFavoritesMock = vi.fn(() => false);

// Mock playlists and favorites hooks
vi.mock("../../hook/usePlaylists", () => ({
  __esModule: true,
  default: () => ({
    playlists: [{ name: "MyList", id: "1" }],
    addToPlaylist: addToPlaylistMock,
    isInPlaylist: isInPlaylistMock,
    removeFromPlaylist: removeFromPlaylistMock,
    isInAnyPlaylist: isInAnyPlaylistMock,
  }),
}));

vi.mock("../../hook/useFavorites", () => ({
  __esModule: true,
  default: () => ({
    isInFavorites: isInFavoritesMock,
    toggleFavorite: toggleFavoriteMock,
  }),
}));

const baseSong: Song = {
  title: "Test",
  artist: "Artist",
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
  video_id: "vid1",
  start: "0",
  end: "",
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
};

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

describe("PlayerControlsBar", () => {
  let onTogglePlay: () => void;
  let onNext: () => void;
  let onVolumeIconClick: () => void;
  let onOpenShareModal: () => void;
  let setHideFutureSongs: (value: boolean) => void;
  let onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  beforeEach(() => {
    onTogglePlay = vi.fn() as unknown as () => void;
    onNext = vi.fn() as unknown as () => void;
    onVolumeIconClick = vi.fn() as unknown as () => void;
    onOpenShareModal = vi.fn() as unknown as () => void;
    setHideFutureSongs = vi.fn() as unknown as (value: boolean) => void;
    onVolumeChange = vi.fn() as unknown as (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;
    vi.clearAllMocks();
  });

  const renderComponent = (overrides = {}) =>
    render(
      <PlayerControlsBar
        songsInVideo={[]}
        allSongsHaveEnd={false}
        songCumulativeMap={[]}
        totalSongsDuration={0}
        videoDuration={100}
        videoStartTime={0}
        displayDuration={100}
        tempSeekValue={0}
        handleSeekChange={() => {}}
        hoveredChapter={null}
        setHoveredChapter={() => {}}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        disabled={false}
        isMuted={false}
        onNext={onNext}
        nextDisabled={false}
        formattedCurrentTime="0:00"
        formattedDuration="1:40"
        displaySongTitle="Title"
        displaySongArtist="Artist"
        onOpenShareModal={onOpenShareModal}
        volumeValue={50}
        tempVolumeValue={50}
        onVolumeIconClick={onVolumeIconClick}
        isTouchDevice={false}
        showVolumeSlider={false}
        onVolumeChange={onVolumeChange}
        currentSong={baseSong}
        hideFutureSongs={false}
        setHideFutureSongs={setHideFutureSongs}
        {...overrides}
      />,
      {
        wrapper: ({ children }) => (
          <MantineProvider>{children}</MantineProvider>
        ),
      },
    );

  it("再生ボタンをクリックすると onTogglePlay が呼ばれる", () => {
    const { getByLabelText } = renderComponent();
    const btn = getByLabelText("再生");
    fireEvent.click(btn);
    expect(onTogglePlay).toHaveBeenCalled();
  });

  it("次へボタンが無効の時は disabled 属性を付与する", () => {
    const { getByLabelText } = renderComponent({ nextDisabled: true });
    const nextBtn = getByLabelText("次の曲へ");
    expect(nextBtn).toBeDisabled();
  });

  it("次へボタンをクリックすると onNext が呼ばれる", () => {
    const { getByLabelText } = renderComponent();
    const nextBtn = getByLabelText("次の曲へ");
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });

  it("再生ボタンは disabled=true で無効になる", () => {
    const { getByLabelText } = renderComponent({ disabled: true });
    const btn = getByLabelText("再生");
    expect(btn).toBeDisabled();
  });

  it("音量アイコンをクリックすると onVolumeIconClick が呼ばれる", () => {
    const { getByLabelText } = renderComponent();
    const volBtn = getByLabelText("ミュート");
    fireEvent.click(volBtn);
    expect(onVolumeIconClick).toHaveBeenCalled();
  });

  it("音量スライダーを変更すると onVolumeChange が呼ばれる", () => {
    const { getAllByRole } = renderComponent({ showVolumeSlider: true });
    const sliders = getAllByRole("slider");
    const volumeSlider = sliders[1];
    fireEvent.change(volumeSlider, { target: { value: "25" } });
    expect(onVolumeChange).toHaveBeenCalled();
  });

  it("お気に入りボタンをクリックすると toggleFavorite が呼ばれる", () => {
    const { getByLabelText } = renderComponent();
    const favBtn = getByLabelText("お気に入りに追加");
    fireEvent.click(favBtn);
    expect(toggleFavoriteMock).toHaveBeenCalledWith(baseSong);
  });

  it("シェアボタンをクリックすると onOpenShareModal が呼ばれる", () => {
    const { getByLabelText } = renderComponent();
    const shareBtn = getByLabelText("現在の楽曲をシェア");
    fireEvent.click(shareBtn);
    expect(onOpenShareModal).toHaveBeenCalled();
  });

  it("セトリネタバレ防止スイッチを操作すると setHideFutureSongs が呼ばれる", () => {
    const { getByRole } = renderComponent();
    const settingsButton = getByRole("button", { name: "設定" });
    fireEvent.click(settingsButton);
    const switchInput = getByRole("switch", {
      name: "セトリネタバレ防止モード",
    });
    fireEvent.click(switchInput);
    expect(setHideFutureSongs).toHaveBeenCalledWith(true);
  });

  it("progress bar が存在する", () => {
    const { container } = renderComponent();
    const slider = container.querySelector(
      "[data-seek-slider] [role='slider']",
    );
    expect(slider).toBeTruthy();
  });

  it("pointerdown should call onSeekStart", () => {
    const onSeekStart = vi.fn();
    const { container } = renderComponent({
      onSeekStart,
    });
    const sliderRoot = container.querySelector(
      "[data-seek-slider]",
    )! as HTMLElement;

    fireEvent.pointerDown(sliderRoot);

    expect(onSeekStart).toHaveBeenCalled();
  });

  it("hover tooltip and highlight align (absolute time mode)", () => {
    const songsInVideo = [
      { ...baseSong, start: "10", title: "Song A" },
      { ...baseSong, start: "40", title: "Song B" },
    ];

    // mount a small wrapper to let setHoveredChapter update hoveredChapter prop
    const Wrapper = () => {
      const [hovered, setHovered] = React.useState<null | any>(null);
      return (
        <PlayerControlsBar
          songsInVideo={songsInVideo}
          allSongsHaveEnd={false}
          songCumulativeMap={[]}
          totalSongsDuration={0}
          videoDuration={100}
          videoStartTime={0}
          displayDuration={100}
          tempSeekValue={0}
          handleSeekChange={() => {}}
          onSeekStart={() => {}}
          onSeekEnd={() => {}}
          hoveredChapter={hovered}
          setHoveredChapter={setHovered}
          isPlaying={false}
          onTogglePlay={() => {}}
          disabled={false}
          isMuted={false}
          onNext={() => {}}
          nextDisabled={false}
          formattedCurrentTime="0:00"
          formattedDuration="1:40"
          displaySongTitle="Title"
          displaySongArtist="Artist"
          onOpenShareModal={() => {}}
          volumeValue={50}
          tempVolumeValue={50}
          onVolumeIconClick={() => {}}
          isTouchDevice={false}
          showVolumeSlider={false}
          onVolumeChange={() => {}}
          currentSong={baseSong}
          hideFutureSongs={false}
          setHideFutureSongs={() => {}}
        />
      );
    };

    const { container } = render(<Wrapper />, {
      wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    });

    const sliderRoot = container.querySelector(
      "[data-seek-slider]",
    )! as HTMLElement;
    const track = container.querySelector(
      ".youtube-progress-track",
    )! as HTMLElement;
    const wrapper = sliderRoot.parentElement! as HTMLElement; // div ref={sliderRootRef}
    const parent = wrapper.parentElement! as HTMLElement; // relative flex-1 container

    // mock sliderRoot and track rects so px 計算が確定する
    Object.defineProperty(sliderRoot, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 20,
        right: 200,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });
    Object.defineProperty(track, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 10,
        top: 0,
        width: 180,
        height: 8,
        right: 190,
        bottom: 8,
        x: 10,
        y: 0,
        toJSON: () => {},
      }),
    });

    // mock thumb size (used to compute visual bar-start)
    const thumb = container.querySelector(
      ".youtube-progress-thumb",
    ) as HTMLElement | null;
    if (thumb) {
      Object.defineProperty(thumb, "offsetWidth", {
        configurable: true,
        value: 8,
      });
    }

    // mock parent (tooltip/overlay container) width so percentage -> px conversion is deterministic
    Object.defineProperty(parent, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 20,
        right: 200,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });

    // hover roughly at the center of the first song (start=10 end=40)
    const centerPct = (10 + (40 - 10) / 2) / 100; // 0.25
    const clientX = Math.round(centerPct * 200);

    fireEvent.mouseMove(track, { clientX });

    // tooltip should show Song A
    const tooltip = container.querySelector(
      "#youtube-progress-bar-chapter-tooltip",
    );
    expect(tooltip).toBeTruthy();
    expect(tooltip!.textContent).toContain("Song A");

    // the hovered translucent overlay should exist and match expected percent
    const overlay = Array.from(container.querySelectorAll("div")).find((el) =>
      el.className.includes("bg-white/30"),
    );
    expect(overlay).toBeTruthy();
    // overlay left/width should match visual px values (visualTrackLeft + fraction*trackWidth)
    expect(overlay!.getAttribute("style")).toContain("left: 24px");
    expect(overlay!.getAttribute("style")).toContain("width: 54px");

    // Slider の marks として統一されていることを確認
    const marks = Array.from(
      container.querySelectorAll(".youtube-progress-mark"),
    ) as HTMLElement[];
    expect(marks.length).toBeGreaterThanOrEqual(1);

    // first mark should be positioned in px (visual alignment)
    expect(marks[0].style.left).toContain("0px");
  });
});
