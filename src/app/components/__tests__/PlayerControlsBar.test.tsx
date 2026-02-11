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
  let onTogglePlay: ReturnType<typeof vi.fn>;
  let onNext: ReturnType<typeof vi.fn>;
  let onVolumeIconClick: ReturnType<typeof vi.fn>;
  let onOpenShareModal: ReturnType<typeof vi.fn>;
  let setHideFutureSongs: ReturnType<typeof vi.fn>;
  let onVolumeChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onTogglePlay = vi.fn();
    onNext = vi.fn();
    onVolumeIconClick = vi.fn();
    onOpenShareModal = vi.fn();
    setHideFutureSongs = vi.fn();
    onVolumeChange = vi.fn();
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
        setTempSeekValue={() => {}}
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
          <MantineProvider withGlobalStyles withNormalizeCSS>
            {children}
          </MantineProvider>
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
});
