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

    Element.prototype.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 10,
          top: 20,
          width: 320,
          height: 180,
          right: 330,
          bottom: 200,
          x: 10,
          y: 20,
          toJSON: () => {},
        }) as DOMRect,
    );
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
  });

  it("keeps the same iframe load props when switching slots for the same video", async () => {
    const { rerender } = render(
      <SharedYouTubePlayerProvider>
        <Source sourceId="main" active startTime={30} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    expect(youtubePlayerPropsRef.current).toMatchObject({
      video_id: "same-video",
      startTime: 30,
    });

    rerender(
      <SharedYouTubePlayerProvider>
        <Source sourceId="mini" active startTime={95} />
      </SharedYouTubePlayerProvider>,
    );

    await act(async () => {});

    expect(youtubePlayerPropsRef.current).toMatchObject({
      video_id: "same-video",
      startTime: 30,
    });
    expect(youtubePlayerUnmounts.current).toBe(0);
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
