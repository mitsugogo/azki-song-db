import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import {
  createChannelsByParticipantName,
  matchesSelectedArchiveParticipants,
  parseArchiveParticipants,
  resolveArchiveParticipants,
} from "../archiveParticipants";

const channel = (overrides: Partial<ChannelEntry>): ChannelEntry => ({
  branch: "JP",
  generation: "0期生",
  talentName: "AZKi",
  artistName: "AZKi",
  youtubeId: "UC-azki",
  channelName: "AZKi Channel",
  handle: "@azki",
  subscriberCount: 0,
  iconUrl: "https://example.com/azki.png",
  ...overrides,
});

describe("archive participants", () => {
  it("parses Japanese comma-separated participant names", () => {
    expect(parseArchiveParticipants("AZKi、 鷹嶺ルイ、AZKi")).toEqual([
      "AZKi",
      "鷹嶺ルイ",
    ]);
  });

  it("resolves participants by talent, artist, or channel name", () => {
    const channels = [
      channel({}),
      channel({
        talentName: "鷹嶺ルイ",
        artistName: "Takane Lui",
        youtubeId: "UC-lui",
        channelName: "Lui ch. 鷹嶺ルイ - holoX -",
      }),
    ];
    const channelsByName = createChannelsByParticipantName(channels);

    expect(
      resolveArchiveParticipants(
        ["AZKi", "Takane Lui", "Lui ch. 鷹嶺ルイ - holoX -", "ゲスト"],
        channelsByName,
      ).map(({ name, channel: resolvedChannel }) => ({
        name,
        youtubeId: resolvedChannel?.youtubeId ?? null,
      })),
    ).toEqual([
      { name: "AZKi", youtubeId: "UC-azki" },
      { name: "Takane Lui", youtubeId: "UC-lui" },
      { name: "Lui ch. 鷹嶺ルイ - holoX -", youtubeId: "UC-lui" },
      { name: "ゲスト", youtubeId: null },
    ]);
  });

  it("matches every selected cast member", () => {
    const participants = ["AZKi", "鷹嶺ルイ", "ゲスト"];

    expect(
      matchesSelectedArchiveParticipants(participants, ["AZKi", "鷹嶺ルイ"]),
    ).toBe(true);
    expect(
      matchesSelectedArchiveParticipants(participants, [
        "AZKi",
        "星街すいせい",
      ]),
    ).toBe(false);
    expect(matchesSelectedArchiveParticipants(participants, [])).toBe(true);
  });
});
