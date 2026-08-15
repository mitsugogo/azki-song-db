import React, { isValidElement, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import { renderLastVideoCell } from "@/app/lib/statisticsRenderers";
import { getTabsConfig } from "../tabsConfig";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    prefetch,
    ...props
  }: React.ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a {...props} data-prefetch={String(prefetch)} />
  ),
}));

vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => <div>{alt}</div>,
}));

const makeSong = (tags: string[]): Song => ({
  slugv2: "song-slug",
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
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags,
  milestones: [],
});

const getColumnElement = (
  tabKey: "originalSongCountsByReleaseDate" | "coverSongCountsByReleaseDate",
  columnKey: string,
  song: Song,
) => {
  const tab = getTabsConfig((key) => key).find(
    (candidate) => candidate.dataKey === tabKey,
  );
  const column = tab?.columns.find((candidate) => {
    const value = candidate as { id?: string; accessorKey?: string };
    return value.id === columnKey || value.accessorKey === columnKey;
  });

  if (!column || typeof column.cell !== "function") {
    throw new Error(`Missing cell renderer: ${tabKey}/${columnKey}`);
  }

  const element = column.cell({
    getValue: () => (columnKey === "song.artist" ? song.artist : song.title),
    row: { original: { song } },
  } as never);

  if (!isValidElement(element)) {
    throw new Error(`Cell did not return an element: ${tabKey}/${columnKey}`);
  }

  return element as ReactElement<{ prefetch?: boolean }>;
};

describe("statistics list prefetch", () => {
  it.each([
    ["originalSongCountsByReleaseDate", ["オリ曲", "MV"]],
    ["coverSongCountsByReleaseDate", ["カバー曲", "カバー曲MV"]],
  ] as const)("%sの反復行リンクをprefetchしない", (tabKey, tags) => {
    const song = makeSong([...tags]);

    for (const columnKey of ["discographyLink", "song.title", "song.artist"]) {
      expect(getColumnElement(tabKey, columnKey, song).props.prefetch).toBe(
        false,
      );
    }
  });

  it("最新動画のアプリ内再生リンクをprefetchしない", () => {
    render(renderLastVideoCell(makeSong(["オリ曲", "MV"])));

    expect(screen.getByText("play").closest("a")).toHaveAttribute(
      "data-prefetch",
      "false",
    );
  });
});
