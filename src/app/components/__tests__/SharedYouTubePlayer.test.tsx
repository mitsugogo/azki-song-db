import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SharedYouTubePlayerProvider,
  SharedYouTubePlayerSlot,
  useSharedYouTubePlayerSource,
} from "../SharedYouTubePlayer";

const { youtubePlayerPropsRef, youtubePlayerUnmounts } = vi.hoisted(() => ({
  youtubePlayerPropsRef: { current: null as any },
  youtubePlayerUnmounts: { current: 0 },
}));

const originalMoveBefore = HTMLElement.prototype.moveBefore;
let moveBeforeMock: ReturnType<typeof vi.fn>;

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
}: {
  sourceId: string;
  active: boolean;
  startTime: number;
  playerKey?: number;
}) {
  useSharedYouTubePlayerSource({
    sourceId,
    active,
    videoId: active ? "same-video" : undefined,
    startTime,
    playerKey,
    onReady: vi.fn(),
    onStateChange: vi.fn(),
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
    moveBeforeMock = vi.fn(function (
      this: HTMLElement,
      node: Node,
      child: Node | null,
    ) {
      this.insertBefore(node, child);
    });
    Object.defineProperty(HTMLElement.prototype, "moveBefore", {
      configurable: true,
      writable: true,
      value: moveBeforeMock,
    });
  });

  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, "moveBefore", {
      configurable: true,
      writable: true,
      value: originalMoveBefore,
    });
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
    expect(mainSlot).toContainElement(host);
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
    expect(getByTestId("shared-youtube-player-slot-mini")).toContainElement(
      host,
    );
    expect(moveBeforeMock).toHaveBeenCalled();
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
});
