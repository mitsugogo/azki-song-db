import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import SearchInput from "../SearchInput";
import type { Song } from "../../types/song";

const createSong = (overrides: Partial<Song>): Song =>
  ({
    video_id: "video1",
    title: "afterglow",
    title_aliases: [],
    artist: "AZKi",
    artist_aliases: [],
    album: "",
    sing: "AZKi",
    sing_aliases: [],
    sings: ["AZKi"],
    tags: [],
    video_title: "",
    broadcast_at: "2025-01-01",
    start: 0,
    end: 100,
    year: 2025,
    extra: "",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
    milestones: [],
    hl: {
      ja: {
        title: overrides.title ?? "afterglow",
        artist: overrides.artist ?? "AZKi",
        artists: [overrides.artist ?? "AZKi"],
        sing: overrides.sing ?? "AZKi",
        sings: overrides.sings ?? ["AZKi"],
      },
    },
    ...overrides,
  }) as Song;

const renderSearchInput = (allSongs: Song[], onSearchChange = vi.fn()) => {
  render(
    <MantineProvider>
      <SearchInput
        allSongs={allSongs}
        searchValue={[]}
        onSearchChange={onSearchChange}
        placeholder="search"
      />
    </MantineProvider>,
  );

  return { onSearchChange };
};

describe("SearchInput", () => {
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

  it("アーティスト別名で候補を出し、選択値は登録名に寄せる", async () => {
    const { onSearchChange } = renderSearchInput([
      createSong({
        artist_aliases: ["あずき"],
        sing: "Someone",
        sings: ["Someone"],
      }),
    ]);

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "あずき" },
    });

    const option = await screen.findByText("AZKi");
    fireEvent.click(option);

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith(["artist:AZKi"]);
    });
  });

  it("歌唱者別名で候補を出し、選択値は登録名に寄せる", async () => {
    const { onSearchChange } = renderSearchInput([
      createSong({
        artist: "Original Artist",
        sing: "星街すいせい",
        sings: ["星街すいせい"],
        sing_aliases: ["ほしまち"],
      }),
    ]);

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "ほしまち" },
    });

    const option = await screen.findByText("星街すいせい");
    fireEvent.click(option);

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith(["sing:星街すいせい"]);
    });
  });

  it("曲名別名で候補を出し、選択値は登録曲名に寄せる", async () => {
    const { onSearchChange } = renderSearchInput([
      createSong({
        title: "♡桃色片思い♡",
        artist: "松浦亜弥",
        title_aliases: ["ももいろ"],
      }),
    ]);

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "ももいろ" },
    });

    const option = await screen.findByText("♡桃色片思い♡");
    fireEvent.click(option);

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith(["title:♡桃色片思い♡"]);
    });
  });
});
