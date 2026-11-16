import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import type { Song } from "../../types/song";
import {
  buildSingerAvatarsByVideoId,
  getLatestHeroBackgroundSong,
  groupRecentUpdates,
  pickHeroBackgroundSong,
} from "../homeData";

function createSong(overrides: Partial<Song>): Song {
  return {
    video_id: "video-1",
    video_title: "配信タイトル",
    broadcast_at: "2026-07-01T12:00:00.000Z",
    sing: "AZKi",
    sings: [],
    title: "オリジナル曲",
    artist: "AZKi",
    tags: ["オリ曲MV"],
    hl: {},
    ...overrides,
  } as Song;
}

describe("hero background selection", () => {
  const now = new Date("2026-11-16T12:00:00Z").getTime();
  afterEach(() => vi.restoreAllMocks());

  it("公開済みの最新MVを選び、同日時なら入力順を保つ", () => {
    const latest = createSong({
      video_id: "latest",
      broadcast_at: "2026-11-15",
    });
    expect(
      getLatestHeroBackgroundSong(
        [
          createSong({}),
          latest,
          createSong({ video_id: "tie", broadcast_at: latest.broadcast_at }),
          createSong({ video_id: "future", broadcast_at: "2026-11-17" }),
          createSong({ video_id: "unknown", broadcast_at: "invalid" }),
          createSong({ video_id: "cover", tags: ["カバー曲MV"] }),
          createSong({ video_id: "audio", tags: ["オリ曲"] }),
          createSong({ video_id: "", broadcast_at: "2026-11-16" }),
        ],
        now,
      ),
    ).toBe(latest);
  });

  it("最新判定は日付不明を除外し、公開日時を迎えた動画を含める", () => {
    const song = createSong({ broadcast_at: new Date(now).toISOString() });
    expect(getLatestHeroBackgroundSong([song], now - 1)).toBeNull();
    expect(getLatestHeroBackgroundSong([song], now)).toBe(song);
    expect(getLatestHeroBackgroundSong([], now)).toBeNull();
    expect(
      getLatestHeroBackgroundSong([createSong({ broadcast_at: "" })], now),
    ).toBeNull();
  });

  it("重複動画は最新の日付の行にまとめ、ランダム選択の重みを増やさない", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.75);
    const duplicate = createSong({ broadcast_at: "2026-11-15" });
    const other = createSong({ video_id: "other", broadcast_at: "2026-11-14" });
    const songs = [
      createSong({ broadcast_at: "" }),
      duplicate,
      duplicate,
      other,
    ];
    expect(getLatestHeroBackgroundSong(songs, now)).toBe(duplicate);
    expect(pickHeroBackgroundSong(songs, now)).toBe(other);
  });

  it("直近30日の重みを維持し、未来の動画をランダム選択からも除外する", () => {
    const older = createSong({ video_id: "older" });
    const recent = createSong({
      video_id: "recent",
      broadcast_at: "2026-11-15",
    });
    const future = createSong({
      video_id: "future",
      broadcast_at: "2026-11-17",
    });
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickHeroBackgroundSong([older, recent, future], now)).toBe(older);
    random.mockReturnValue(0.1);
    expect(pickHeroBackgroundSong([older, recent, future], now)).toBe(recent);
    random.mockReturnValue(0.999);
    expect(pickHeroBackgroundSong([older, recent, future], now)).toBe(recent);
    expect(pickHeroBackgroundSong([future], now)).toBeNull();
  });
});

describe("groupRecentUpdates", () => {
  it("動画単位でまとめ、最新配信日順に返す", () => {
    const updates = groupRecentUpdates([
      createSong({ video_id: "older", broadcast_at: "2026-06-01" }),
      createSong({ video_id: "newer", broadcast_at: "2026-07-01" }),
      createSong({ video_id: "newer", broadcast_at: "2026-07-02" }),
      createSong({ video_id: "", broadcast_at: "2026-07-03" }),
    ]);

    expect(updates.map(({ videoId, count }) => ({ videoId, count }))).toEqual([
      { videoId: "newer", count: 2 },
      { videoId: "older", count: 1 },
    ]);
    expect(updates[0].date).toBe("2026-07-02T00:00:00.000Z");
  });
});

describe("buildSingerAvatarsByVideoId", () => {
  it("歌唱者名からチャンネルを引き、同じチャンネルを重複表示しない", () => {
    const updates = groupRecentUpdates([
      createSong({ sing: "AZKi,ゲスト", sings: ["AZKi", "ゲスト"] }),
      createSong({ sing: "AZKi", sings: ["AZKi"] }),
    ]);
    const channels = [
      {
        branch: "hololive",
        generation: "0期生",
        talentName: "AZKi",
        artistName: "AZKi",
        channelName: "AZKi Channel",
        youtubeId: "azki-channel",
        handle: "@AZKi",
        subscriberCount: 1,
        iconUrl: "https://example.com/azki.png",
      },
      {
        branch: "guest",
        generation: "",
        talentName: "ゲスト",
        artistName: "ゲスト",
        channelName: "Guest Channel",
        youtubeId: "",
        handle: "@guest",
        subscriberCount: 1,
        iconUrl: "https://example.com/guest.png",
      },
    ] satisfies ChannelEntry[];

    expect(
      buildSingerAvatarsByVideoId(updates, channels).get("video-1"),
    ).toEqual([
      {
        name: "AZKi Channel",
        iconUrl: "https://example.com/azki.png",
        channelUrl: "https://www.youtube.com/channel/azki-channel",
      },
      {
        name: "Guest Channel",
        iconUrl: "https://example.com/guest.png",
        channelUrl: "https://www.youtube.com/@guest",
      },
    ]);
  });
});
