import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import { HomeHeroBackground } from "../HomeHeroBackground";

vi.mock("react-youtube", () => ({
  default: ({ onError }: { onError: () => void }) => (
    <button data-testid="hero-video" onClick={onError}>
      video
    </button>
  ),
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
});
