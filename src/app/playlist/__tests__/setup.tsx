import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { vi } from "vitest";
import type { Playlist, PlaylistEntry } from "../../lib/playlistUrl";
import type { Song } from "../../types/song";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import { theme } from "../../theme";

const testState = vi.hoisted(() => ({
  locale: "ja",
  ready: true,
  isLoading: false,
  playlists: [] as Playlist[],
  favorites: [] as PlaylistEntry[],
  songs: [] as Song[],
  savePlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  clearAllSongs: vi.fn(),
  reorderFavorites: vi.fn(),
  clearAllFavorites: vi.fn(),
  removeMultipleFavorites: vi.fn(),
  isDuplicate: vi.fn(() => false),
  setCurrentSong: vi.fn(),
  setCurrentTime: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsMinimized: vi.fn(),
}));

export const state = testState;

vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
  useTranslations:
    (namespace: string) =>
    (key: string, values: Record<string, unknown> = {}) => {
      const messages = state.locale === "en" ? en : ja;
      const value = `${namespace}.${key}`
        .split(".")
        .reduce<any>((item, part) => item?.[part], messages);
      if (typeof value !== "string")
        throw new Error(`Missing translation: ${namespace}.${key}`);
      return value.replace(/\{(\w+)\}/g, (_, name) =>
        String(values[name] ?? `{${name}}`),
      );
    },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: any) => (
    <a
      href={
        typeof href === "string"
          ? href
          : `${href.pathname}?${new URLSearchParams(href.query)}`
      }
      {...props}
    />
  ),
}));
vi.mock("../../hook/usePlaylists", () => ({
  default: () => ({ ...state, getMaxLimit: () => 300 }),
}));
vi.mock("../../hook/useFavorites", () => ({ default: () => state }));
vi.mock("../../hook/useSongs", () => ({
  default: () => ({ allSongs: state.songs, isLoading: state.isLoading }),
}));
vi.mock("../../hook/useGlobalPlayer", () => ({ useGlobalPlayer: () => state }));
vi.mock("../../components/SignedInOnly", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => (
    <span data-testid="thumbnail">{alt}</span>
  ),
}));
vi.mock("../../loading", () => ({
  default: () => <div role="status">読み込み中</div>,
}));

export const song: Song = {
  title: "テスト曲",
  artist: "AZKi",
  video_id: "video-1",
  video_title: "テスト動画",
  hl: { ja: { title: "テスト曲", artist: "AZKi", artists: ["AZKi"] } },
  album: "Album",
  lyricist: "Lyricist",
  composer: "Composer",
  arranger: "Arranger",
  album_list_uri: "",
  album_release_at: "2024-01-01",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_uri: "https://youtu.be/video-1",
  start: 15,
  end: 30,
  year: 2024,
  broadcast_at: "2024-01-01",
  tags: [],
  milestones: [],
};

export function resetState(desktop = false) {
  vi.clearAllMocks();
  state.locale = "ja";
  state.ready = true;
  state.isLoading = false;
  state.songs = [
    song,
    { ...song, title: "二曲目", video_id: "video-2", start: 20 },
  ];
  state.playlists = [
    {
      id: "playlist-1",
      name: "プレイリスト1",
      songs: [
        { videoId: "video-1", start: "15" },
        { videoId: "video-2", start: "20" },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
    { id: "playlist-2", name: "空のリスト", songs: [], visibility: "PRIVATE" },
  ];
  state.favorites = [];
  state.isDuplicate.mockReturnValue(false);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: desktop && query === "(min-width: 64em)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
}

export function renderUI(children: ReactNode) {
  const wrap = (content: ReactNode) => (
    <MantineProvider env="test" theme={theme}>
      {content}
    </MantineProvider>
  );
  const result = render(wrap(children));
  return {
    ...result,
    rerenderUI: (content: ReactNode) => result.rerender(wrap(content)),
  };
}
