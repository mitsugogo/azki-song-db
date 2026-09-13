import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import { createArchiveCastOptions } from "../archiveCastOptions";

const channel = (
  talentName: string,
  overrides: Partial<ChannelEntry> = {},
): ChannelEntry => ({
  branch: "JP",
  generation: "0期生",
  talentName,
  artistName: talentName,
  youtubeId: `UC-${talentName}`,
  channelName: `${talentName} Channel`,
  handle: `@${talentName}`,
  subscriberCount: 0,
  iconUrl: "",
  ...overrides,
});

describe("createArchiveCastOptions", () => {
  it("includes active hololive members with zero videos and counts each video once", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    const miko = channel("さくらみこ");
    const graduate = channel("卒業メンバー", {
      generation: "0期生、卒業生",
    });

    const options = createArchiveCastOptions(
      [
        {
          participantEntries: [
            { name: "星街すいせい", channel: suisei },
            { name: "ゲスト", channel: null },
          ],
        },
        {
          participantEntries: [
            { name: "Hoshimachi Suisei", channel: suisei },
            { name: "星街すいせい", channel: suisei },
          ],
        },
      ],
      [azki, suisei, miko, graduate],
      "ja",
    );

    expect(options.map(({ name, count }) => ({ name, count }))).toEqual([
      { name: "ゲスト", count: 1 },
      { name: "さくらみこ", count: 0 },
      { name: "星街すいせい", count: 2 },
    ]);
  });
});
