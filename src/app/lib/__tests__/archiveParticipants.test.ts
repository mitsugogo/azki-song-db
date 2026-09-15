import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import {
  createChannelsByParticipantName,
  isAzkiArchiveParticipant,
  matchesSelectedArchiveParticipantEntries,
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

  it("identifies AZKi through either the participant name or resolved channel", () => {
    expect(isAzkiArchiveParticipant({ name: "ＡＺＫｉ", channel: null })).toBe(
      true,
    );
    expect(
      isAzkiArchiveParticipant({ name: "別名", channel: channel({}) }),
    ).toBe(true);
    expect(isAzkiArchiveParticipant({ name: "鷹嶺ルイ", channel: null })).toBe(
      false,
    );
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

  it("matches a canonical channel name against a participant alias", () => {
    const lui = channel({
      talentName: "鷹嶺ルイ",
      artistName: "Takane Lui",
      youtubeId: "UC-lui",
      channelName: "Lui ch. 鷹嶺ルイ - holoX -",
    });

    expect(
      matchesSelectedArchiveParticipantEntries(
        [{ name: "Takane Lui", channel: lui }],
        ["鷹嶺ルイ"],
      ),
    ).toBe(true);
    expect(
      matchesSelectedArchiveParticipantEntries(
        [{ name: "Takane Lui", channel: lui }],
        ["星街すいせい"],
      ),
    ).toBe(false);
  });
});
