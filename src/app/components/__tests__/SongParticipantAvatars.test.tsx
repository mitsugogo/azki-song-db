import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import type { Song } from "../../types/song";
import SongListItem from "../SongListItem";
import SongParticipantAvatars from "../SongParticipantAvatars";

const mocks = vi.hoisted(() => ({ channels: [] as ChannelEntry[] }));

vi.mock("@/app/hook/useChannels", () => ({
  default: () => ({ channels: mocks.channels, isLoading: false }),
}));
vi.mock("../YoutubeThumbnail", () => ({ default: () => null }));
vi.mock("../MilestoneBadge", () => ({ default: () => null }));

const createChannel = (name: string): ChannelEntry => ({
  branch: "JP",
  generation: "",
  talentName: name,
  artistName: name,
  youtubeId: `UC-${name}`,
  channelName: `${name} Channel`,
  handle: "",
  subscriberCount: 0,
  iconUrl: `https://example.com/${name}.png`,
});

const createSong = (names: string[]): Song => ({
  title: "Guest Song",
  artist: "Original Artist",
  hl: { ja: { title: "Guest Song", artist: "Original Artist", artists: [] } },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: names.join("、"),
  sings: names,
  video_title: "Video",
  video_uri: "https://youtu.be/video-id",
  video_id: "video-id",
  start: 10,
  end: 0,
  broadcast_at: "2026-04-04T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
});

const renderParticipants = (song: Song) =>
  render(
    <MantineProvider>
      <SongParticipantAvatars song={song} />
    </MantineProvider>,
  );

describe("SongParticipantAvatars", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    mocks.channels = [
      "AZKi",
      "Guest1",
      "Guest2",
      "Guest3",
      "Guest4",
      "Guest5",
    ].map(createChannel);
  });

  it.each([[], ["AZKi"], [" ＡＺＫｉ "]])(
    "AZKi単独または歌唱者不明の場合は表示しない: %j",
    (...names) => {
      renderParticipants(createSong(names));
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    },
  );

  it.each([2, 3, 4, 5, 6])(
    "%i人の歌唱者をPCでは4人、スマホでは2人まで表示する",
    (count) => {
      const names = [
        "AZKi",
        ...Array.from({ length: count - 1 }, (_, i) => `Guest${i + 1}`),
      ];
      renderParticipants(createSong(names));
      const [mobile, desktop] = screen.getAllByRole("group");
      expect(within(mobile).getAllByRole("img")).toHaveLength(
        Math.min(2, count),
      );
      expect(within(desktop).getAllByRole("img")).toHaveLength(
        Math.min(4, count),
      );
      for (const [group, limit] of [
        [mobile, 2],
        [desktop, 4],
      ] as const) {
        if (count > limit) {
          expect(
            within(group).getByTitle(names.slice(limit).join("、")),
          ).toHaveTextContent(`+${count - limit}`);
        } else {
          expect(within(group).queryByText(/^\+/)).not.toBeInTheDocument();
        }
      }
    },
  );

  it("ゲスト単独歌唱を表示し、原曲アーティストを参加者に含めない", () => {
    renderParticipants(createSong(["Guest1"]));
    for (const group of screen.getAllByRole("group")) {
      expect(
        within(group).getByRole("img", { name: "Guest1" }),
      ).toHaveAttribute("src", "https://example.com/Guest1.png");
      expect(group).toHaveAttribute("aria-label", "Guest1");
    }
  });

  it("英語表示でも日本語の歌唱者データから照合する", () => {
    const song = createSong(["English Guest"]);
    song.hl.ja.sings = ["Guest1"];
    renderParticipants(song);
    expect(screen.getAllByRole("img", { name: "Guest1" })).toHaveLength(2);
  });

  it("歌唱者配列が空なら日本語の文字列を使い、重複した名前とチャンネルを除く", () => {
    const song = createSong([]);
    song.hl.ja.sing = "Guest1、Ｇｕｅｓｔ１, Guest1 Channel";
    renderParticipants(song);
    for (const group of screen.getAllByRole("group")) {
      expect(within(group).getAllByRole("img")).toHaveLength(1);
    }
  });

  it("チャンネル情報がないメンバーにも頭文字と名前を残す", () => {
    renderParticipants(createSong(["未登録ゲスト"]));
    for (const group of screen.getAllByRole("group")) {
      expect(within(group).getByText("未")).toBeInTheDocument();
      expect(group).toHaveAttribute("aria-label", "未登録ゲスト");
    }
  });

  it("カードの選曲を維持し、ネタバレ非表示時はアイコンも隠す", () => {
    const song = createSong(["AZKi", "Guest1"]);
    const changeCurrentSong = vi.fn();
    const animationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const view = (isHide: boolean) => (
      <MantineProvider>
        <SongListItem
          song={song}
          isSelected={false}
          isHide={isHide}
          changeCurrentSong={changeCurrentSong}
        />
      </MantineProvider>
    );
    const { rerender } = render(view(false));
    expect(screen.getAllByRole("link")).toHaveLength(1);
    fireEvent.click(screen.getAllByRole("img", { name: "Guest1" })[0]);
    expect(changeCurrentSong).toHaveBeenCalledWith(song);
    rerender(view(true));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    animationFrame.mockRestore();
  });
});
