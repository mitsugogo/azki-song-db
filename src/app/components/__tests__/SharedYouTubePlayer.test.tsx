import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SharedYouTubePlayerProvider,
  SharedYouTubePlayerSlot,
  useSharedYouTubePlayerSource,
} from "../SharedYouTubePlayer";

const { youtubePlayerPropsRef, youtubePlayerUnmounts } = vi.hoisted(() => ({
  youtubePlayerPropsRef: { current: null as any },
  youtubePlayerUnmounts: { current: 0 },
}));

vi.mock("../YouTubePlayer", async () => {
  const React = await import("react");

  return {
    default: (props: any) => {
      youtubePlayerPropsRef.current = props;
      React.useEffect(() => {
        return () => {
          youtubePlayerUnmounts.current += 1;
        };
      }, []);
      return <div data-testid="youtube-player" />;
    },
  };
});

function Source({
  sourceId,
  active,
  startTime,
  playerKey,
  onReady = vi.fn(),
  onStateChange = vi.fn(),
}: {
  sourceId: string;
  active: boolean;
  startTime: number;
  playerKey?: number;
  onReady?: (event: any) => boolean | void;
  onStateChange?: (event: any) => void;
}) {
  useSharedYouTubePlayerSource({
    sourceId,
    active,
    videoId: active ? "same-video" : undefined,
    startTime,
    playerKey,
    onReady,
    onStateChange,
  });

  return (
    <SharedYouTubePlayerSlot
      sourceId={sourceId}
      active={active}
      className="h-full w-full"
    />
  );
}

describe("SharedYouTubePlayer", () => {
  beforeEach(() => {
    youtubePlayerPropsRef.current = null;
    youtubePlayerUnmounts.current = 0;
  });

  it("playerKeyが異なっても同一動画のスロット移譲ではiframeを維持する", async () => {
    const { getByTestId, rerender } = render(
      <SharedYouTubePlayerProvider>
        <Source
          key="main"
          sourceId="main"
          active
          startTime={30}
          playerKey={1}
        />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    expect(youtubePlayerPropsRef.current).toMatchObject({
      video_id: "same-video",
      startTime: 30,
    });

    const player = getByTestId("youtube-player");
    const host = getByTestId("shared-youtube-player-host");
    const mainSlot = getByTestId("shared-youtube-player-slot-main");
    const surface = getByTestId("shared-youtube-player-surface");
    expect(mainSlot).not.toContainElement(host);
    expect(surface).toContainElement(host);
    expect(host).toHaveStyle({ position: "absolute", inset: "0" });

    rerender(
      <SharedYouTubePlayerProvider>
        <Source key="mini" sourceId="mini" active startTime={95} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    expect(youtubePlayerPropsRef.current).toMatchObject({
      video_id: "same-video",
      startTime: 30,
    });
    expect(youtubePlayerUnmounts.current).toBe(0);
    expect(getByTestId("youtube-player")).toBe(player);
    expect(getByTestId("shared-youtube-player-host")).toBe(host);
    expect(getByTestId("shared-youtube-player-slot-mini")).not.toContainElement(
      host,
    );
    expect(getByTestId("shared-youtube-player-surface")).toContainElement(host);
  });

  it("同一動画でも再作成キーが変われば iframe を再マウントする", async () => {
    const { rerender } = render(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} playerKey={1} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    rerender(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} playerKey={2} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    expect(youtubePlayerUnmounts.current).toBe(1);
  });

  it("遷移中に拒否された ready を次の source 更新で再配送する", async () => {
    const rejectedReady = vi.fn(() => false);
    const acceptedReady = vi.fn(() => true);
    const player = { getVideoData: () => ({ video_id: "same-video" }) };
    const { rerender } = render(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} onReady={rejectedReady} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});
    act(() => {
      youtubePlayerPropsRef.current.onReady({ target: player });
    });
    expect(rejectedReady).toHaveBeenCalledWith({ target: player });

    rerender(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} onReady={acceptedReady} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});
    expect(acceptedReady).toHaveBeenCalledWith({
      target: player,
      isSharedPlayerHandoff: false,
    });
  });

  it("スロット移譲時はhandoffとしてreadyを配送しstatechangeを再発火しない", async () => {
    const miniReady = vi.fn();
    const miniStateChange = vi.fn();
    const player = {
      getVideoData: () => ({ video_id: "same-video" }),
      getPlayerState: () => 1,
    };
    const { rerender } = render(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});
    act(() => {
      youtubePlayerPropsRef.current.onReady({ target: player });
    });

    rerender(
      <SharedYouTubePlayerProvider>
        <Source
          key="mini"
          sourceId="mini"
          active
          startTime={95}
          onReady={miniReady}
          onStateChange={miniStateChange}
        />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});
    expect(miniReady).toHaveBeenCalledWith({
      target: player,
      isSharedPlayerHandoff: true,
    });
    expect(miniStateChange).not.toHaveBeenCalled();
  });
});
