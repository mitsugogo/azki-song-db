import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    prefetch,
    ...props
  }: React.ComponentProps<"a"> & {
    prefetch?: boolean;
  }) => <a {...props} data-prefetch={String(prefetch)} />,
}));

vi.mock("@mantine/core", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Indicator: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));
vi.mock("../MilestoneBadge", () => ({ default: () => null }));

import SongListItem from "../SongListItem";

const song: Song = {
  title: "Song",
  artist: "AZKi",
  hl: {
    ja: { title: "Song", artist: "AZKi", artists: ["AZKi"] },
  },
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
  start: 10,
  end: 0,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
};

describe("SongListItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Linkのprefetchを止めつつ既存の選曲処理を維持する", () => {
    const changeCurrentSong = vi.fn();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    render(
      <SongListItem
        song={song}
        isSelected={false}
        isHide={false}
        changeCurrentSong={changeCurrentSong}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-prefetch", "false");
    expect(link).toHaveAttribute("href", "/watch?v=video-id&t=10");
    expect(fireEvent.click(link)).toBe(false);
    expect(changeCurrentSong).toHaveBeenCalledWith(song);
  });
});
