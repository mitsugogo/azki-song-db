import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock react-youtube to inspect props
vi.mock("react-youtube", () => ({
  __esModule: true,
  default: (props: any) => {
    // render a div exposing opts for assertions
    return (
      <div
        data-videoid={props.videoId}
        data-opts={JSON.stringify(props.opts)}
      />
    );
  },
}));

import YouTubePlayer from "../YouTubePlayer";

const baseSong = {
  video_id: "vid1",
  start: "10",
  end: "120",
  title: "T",
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
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
};

describe("YouTubePlayer", () => {
  it("uses explicit video_id and startTime when provided", () => {
    const { container } = render(
      <YouTubePlayer
        video_id="explicitVid"
        startTime={5}
        onReady={() => {}}
        onStateChange={() => {}}
      />,
    );

    const div = container.querySelector("div[data-videoid]")!;
    expect(div.getAttribute("data-videoid")).toBe("explicitVid");
    const opts = JSON.parse(div.getAttribute("data-opts") || "{}");
    expect(opts.playerVars.start).toBe(5);
  });
});
