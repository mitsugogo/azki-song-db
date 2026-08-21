import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import CreatePlaylistModal from "../CreatePlaylistModal";

const playlistsMock = vi.hoisted(() => ({
  savePlaylist: vi.fn(),
  isDuplicate: vi.fn(() => false),
}));

vi.mock("../../hook/usePlaylists", () => ({
  default: () => playlistsMock,
}));

describe("CreatePlaylistModal", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
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
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("既存呼び出しでは空のプレイリストを作成する", () => {
    render(
      <MantineProvider>
        <CreatePlaylistModal onenModal setOpenModal={vi.fn()} />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("placeholder"), {
      target: { value: "新しいリスト" },
    });
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    expect(playlistsMock.savePlaylist).toHaveBeenCalledWith({
      name: "新しいリスト",
      songs: [],
    });
  });

  it("任意の初期名と初期曲を使って作成する", () => {
    render(
      <MantineProvider>
        <CreatePlaylistModal
          onenModal
          setOpenModal={vi.fn()}
          initialName={"縦読み「あずき」"}
          initialSongs={[
            { videoId: "video-a", start: "10" },
            { videoId: "video-b", start: "20" },
          ]}
        />
      </MantineProvider>,
    );

    expect(screen.getByDisplayValue("縦読み「あずき」")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    expect(playlistsMock.savePlaylist).toHaveBeenCalledWith({
      name: "縦読み「あずき」",
      songs: [
        { videoId: "video-a", start: "10" },
        { videoId: "video-b", start: "20" },
      ],
    });
  });

  it("サインイン再開イベントで作成モーダルを開く", () => {
    const setOpenModal = vi.fn();
    render(
      <MantineProvider>
        <CreatePlaylistModal
          onenModal={false}
          setOpenModal={setOpenModal}
          initialName={"縦読み「あずき」"}
          initialSongs={[{ videoId: "video-a", start: "10" }]}
        />
      </MantineProvider>,
    );

    window.dispatchEvent(
      new CustomEvent("azki-library-action", {
        detail: { type: "create-playlist" },
      }),
    );

    expect(setOpenModal).toHaveBeenCalledWith(true);
  });
});
