import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import type { Song } from "../../types/song";
import { buildSingerAvatarsByVideoId, groupRecentUpdates } from "../homeData";

function createSong(overrides: Partial<Song>): Song {
  return {
    video_id: "video-1",
    video_title: "配信タイトル",
    broadcast_at: "2026-07-01T12:00:00.000Z",
    sing: "AZKi",
    sings: [],
    hl: {},
    ...overrides,
  } as Song;
}

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
