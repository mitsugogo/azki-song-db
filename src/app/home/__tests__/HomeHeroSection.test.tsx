import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { YouTubeEvent, YouTubeProps } from "react-youtube";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import { HomeHeroSection } from "../HomeHeroSection";

const video = vi.hoisted(() => ({ props: {} as YouTubeProps }));

vi.mock("react-youtube", () => ({
  default: (props: YouTubeProps) => {
    video.props = props;
    return <div data-testid="hero-video" />;
  },
}));
vi.mock("next/font/google", () => ({
  Zen_Maru_Gothic: () => ({ className: "test-font" }),
}));
vi.mock("../HomeSearchPanel", () => ({ HomeSearchPanel: () => null }));
vi.mock("../homeData", () => ({
  pickHeroBackgroundSong: (songs: Song[]) => songs[0] ?? null,
  buildHeroBackgroundVideoUrl: (song: Song) =>
    `https://www.youtube.com/watch?v=${song.video_id}`,
}));

const song = {
  video_id: "hero-video-id",
  video_title: "Hero video",
  title: "Hero song",
} as Song;

function renderHero() {
  return render(
    <MantineProvider>
      <HomeHeroSection songs={[song]} />
    </MantineProvider>,
  );
}

function readyPlayer() {
  let muted = false;
  const player = {
    mute: vi.fn(() => {
      muted = true;
    }),
    unMute: vi.fn(() => {
      muted = false;
    }),
    isMuted: vi.fn(() => muted),
    playVideo: vi.fn(),
  };
  act(() => {
    video.props.onReady?.({ target: player } as unknown as YouTubeEvent);
    video.props.onStateChange?.({
      data: 1,
      target: player,
    } as unknown as YouTubeEvent<number>);
  });
  return player;
}

describe("HomeHeroSection playback controls", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("再生リンクをミュートの左に置き、背景動画を再読み込みせずミュートを切り替える", () => {
    renderHero();
    const muteButton = screen.getByRole("button", { name: "unmute" });
    const playLink = screen.getByRole("link", {
      name: "heroWatchFromBeginning",
    });
    expect(playLink).toHaveAttribute("href", "/watch?v=hero-video-id");
    expect(
      playLink.compareDocumentPosition(muteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(muteButton).toBeDisabled();

    const player = readyPlayer();
    const originalVideo = screen.getByTestId("hero-video");
    const originalOptions = video.props.opts;
    expect(player.mute).toHaveBeenCalledTimes(1);
    expect(muteButton).toBeEnabled();

    fireEvent.click(muteButton);
    expect(player.unMute).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "mute" })).not.toHaveAttribute(
      "href",
    );

    fireEvent.click(screen.getByRole("button", { name: "mute" }));
    expect(player.mute).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "unmute" })).toBeEnabled();
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("hero-video")).toBe(originalVideo);
    expect(video.props.opts).toBe(originalOptions);
  });

  it("動画エラー後はミュートを無効にし、watchへの再生リンクを残す", () => {
    renderHero();
    readyPlayer();
    act(() => video.props.onError?.({ data: 100 } as YouTubeEvent<number>));

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "unmute" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "heroWatchFromBeginning" }),
    ).toHaveAttribute("href", "/watch?v=hero-video-id");
  });
});
