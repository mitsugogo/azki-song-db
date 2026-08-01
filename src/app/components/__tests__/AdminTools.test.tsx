import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { YouTubeApiVideoResult } from "../../types/api/yt/video";
import type { Song } from "../../types/song";

const { channelsMock, useAdminModeMock } = vi.hoisted(() => ({
  channelsMock: vi.fn(),
  useAdminModeMock: vi.fn(),
}));

vi.mock("../../context/AdminModeContext", () => ({
  useAdminMode: useAdminModeMock,
}));

vi.mock("../../hook/useChannels", () => ({
  default: channelsMock,
}));

import AdminTools from "../AdminTools";

const song: Song = {
  title: "Song A",
  artist: "Artist",
  artists: ["Artist"],
  album: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "",
  sings: [],
  video_title: "Video A",
  video_uri: "https://www.youtube.com/watch?v=abcdefghijk",
  video_id: "abcdefghijk",
  start: 0,
  end: 0,
  broadcast_at: "2024-01-01",
  year: 2024,
  tags: [],
  extra: "",
  milestones: [],
  lyricist: "",
  composer: "",
  arranger: "",
  hl: {
    ja: {
      title: "Song A",
      artist: "Artist",
      artists: ["Artist"],
      album: "",
      sing: "",
      sings: [],
    },
  },
};

const videoInfo = (channelId: string, channelTitle: string) =>
  ({
    snippet: {
      channelId,
      channelTitle,
      title: "Video",
    },
  }) as YouTubeApiVideoResult;

describe("AdminTools", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    useAdminModeMock.mockReturnValue({
      isAdmin: true,
      enabled: true,
      setEnabled: vi.fn(),
    });
    channelsMock.mockReturnValue({ channels: [], isLoading: false });
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ channelName: "日本語チャンネル" }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("楽曲変更後に前のチャンネル追加成功状態を引き継がない", async () => {
    const { rerender } = render(
      <MantineProvider>
        <AdminTools
          currentSong={song}
          videoInfo={videoInfo("UC1111111111", "Channel A")}
        />
      </MantineProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "addChannel" }));
    await waitFor(() => {
      expect(screen.getByText("channelAdded")).toBeInTheDocument();
    });

    rerender(
      <MantineProvider>
        <AdminTools
          currentSong={{
            ...song,
            title: "Song B",
            video_id: "lmnopqrstuv",
            video_uri: "https://www.youtube.com/watch?v=lmnopqrstuv",
          }}
          videoInfo={videoInfo("UC2222222222", "Channel B")}
        />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("channelMissing")).toBeInTheDocument();
    });
    expect(screen.queryByText("channelListed")).not.toBeInTheDocument();
  });
});
