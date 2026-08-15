import React from "react";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    prefetch,
    ...props
  }: React.ComponentProps<"a"> & {
    prefetch?: boolean;
  }) => <a {...props} data-prefetch={String(prefetch)} />,
}));

vi.mock("@/app/context/LoadingContext", () => ({
  useLoading: () => ({ setLoading: vi.fn() }),
}));

import YearsTile from "../yearsTile";

const song: Song = {
  title: "Song",
  artist: "AZKi",
  hl: { ja: { title: "Song", artist: "AZKi", artists: ["AZKi"] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "Video",
  video_uri: "https://youtu.be/video-id",
  video_id: "video-id",
  start: 0,
  end: 0,
  broadcast_at: "2019-01-01T00:00:00.000Z",
  year: 2019,
  tags: [],
  milestones: [],
};

describe("YearsTile", () => {
  it("月リンクをゼロ埋めし、自動prefetchを無効にする", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MantineProvider>
        <YearsTile songs={[song]} />
      </MantineProvider>,
    );

    const januaryLink = screen.getByText("1月").closest("a");
    const decemberLink = screen.getByText("12月").closest("a");

    expect(januaryLink).toHaveAttribute("href", "/activity/2019/01");
    expect(januaryLink).toHaveAttribute("data-prefetch", "false");
    expect(decemberLink).toHaveAttribute("href", "/activity/2019/12");
    expect(decemberLink).toHaveAttribute("data-prefetch", "false");

    expect(screen.getByLabelText("2019yearSuffix")).toHaveAttribute(
      "data-prefetch",
      "undefined",
    );
  });
});
