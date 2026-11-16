import { act, fireEvent, render, screen } from "@testing-library/react";
import type { YouTubeEvent, YouTubeProps } from "react-youtube";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import { HomeHeroBackground } from "../HomeHeroBackground";

const video = vi.hoisted(() => ({ props: {} as YouTubeProps }));
vi.mock("react-youtube", () => ({
  default: (props: YouTubeProps) => {
    video.props = props;
    return (
      <button
        data-testid="hero-video"
        onClick={() => props.onError?.({ data: 100 } as YouTubeEvent<number>)}
      >
        video
      </button>
    );
  },
}));

const song = {
  video_id: "hero-video-id",
  video_title: "Hero video",
} as Song;

describe("HomeHeroBackground", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("再生開始を確認できない場合は15秒後に動画レイヤーを消す", () => {
    vi.useFakeTimers();
    render(<HomeHeroBackground song={song} />);

    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("プレイヤーエラー時は動画レイヤーを消す", () => {
    render(<HomeHeroBackground song={song} />);

    fireEvent.click(screen.getByTestId("hero-video"));
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("準備完了や待機では成功にせず、最初のPLAYINGだけを成功通知する", () => {
    vi.useFakeTimers();
    const success = vi.fn();
    const failure = vi.fn();
    render(
      <HomeHeroBackground
        song={song}
        onPlaybackSuccess={success}
        onPlaybackFailure={failure}
      />,
    );
    const player = { mute: vi.fn(), playVideo: vi.fn() };
    act(() => {
      video.props.onReady?.({ target: player } as unknown as YouTubeEvent);
      for (const data of [-1, 5, 3]) {
        video.props.onStateChange?.({
          data,
          target: player,
        } as unknown as YouTubeEvent<number>);
      }
    });
    expect(success).not.toHaveBeenCalled();

    act(() => {
      for (const data of [1, 2, 1, 0, 1]) {
        video.props.onStateChange?.({
          data,
          target: player,
        } as unknown as YouTubeEvent<number>);
      }
      vi.advanceTimersByTime(15_000);
    });
    expect(success).toHaveBeenCalledExactlyOnceWith(song.video_id);
    expect(failure).not.toHaveBeenCalled();
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
  });

  it("エラー後の重複失敗・成功通知を無視する", () => {
    vi.useFakeTimers();
    const success = vi.fn();
    const failure = vi.fn();
    render(
      <HomeHeroBackground
        song={song}
        onPlaybackSuccess={success}
        onPlaybackFailure={failure}
      />,
    );
    const failedProps = video.props;
    fireEvent.click(screen.getByTestId("hero-video"));
    act(() => {
      failedProps.onError?.({ data: 100 } as YouTubeEvent<number>);
      failedProps.onStateChange?.({ data: 1 } as YouTubeEvent<number>);
      vi.advanceTimersByTime(15_000);
    });
    expect(failure).toHaveBeenCalledExactlyOnceWith(song.video_id);
    expect(success).not.toHaveBeenCalled();
  });

  it("動画切り替えでタイマーとプレイヤーをリセットし、前の通知を無視する", () => {
    vi.useFakeTimers();
    const success = vi.fn();
    const failure = vi.fn();
    const playerChange = vi.fn();
    const { rerender } = render(
      <HomeHeroBackground
        song={song}
        onPlaybackSuccess={success}
        onPlaybackFailure={failure}
        onPlayerChange={playerChange}
      />,
    );
    const previous = video.props;
    const player = { mute: vi.fn(), playVideo: vi.fn() };
    act(() => {
      previous.onReady?.({ target: player } as unknown as YouTubeEvent);
      vi.advanceTimersByTime(10_000);
    });
    rerender(
      <HomeHeroBackground
        song={{ ...song, video_id: "next" }}
        onPlaybackSuccess={success}
        onPlaybackFailure={failure}
        onPlayerChange={playerChange}
      />,
    );
    expect(playerChange).toHaveBeenLastCalledWith(null);
    act(() => {
      previous.onStateChange?.({ data: 1 } as YouTubeEvent<number>);
      previous.onError?.({ data: 100 } as YouTubeEvent<number>);
      previous.onReady?.({ target: player } as unknown as YouTubeEvent);
      vi.advanceTimersByTime(5_000);
    });
    expect(success).not.toHaveBeenCalled();
    expect(failure).not.toHaveBeenCalled();
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10_000));
    expect(failure).toHaveBeenCalledExactlyOnceWith("next");
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });
});
