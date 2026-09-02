import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import {
  createArchiveCollaborationCombinationRanking,
  createArchiveCollaborationRanking,
} from "../archiveCollaborationData";

const channel = (
  talentName: string,
  branch = "JP",
  youtubeId = `UC-${talentName}`,
): ChannelEntry => ({
  branch,
  generation: "",
  talentName,
  artistName: talentName,
  youtubeId,
  channelName: `${talentName} Channel`,
  handle: "",
  subscriberCount: 0,
  iconUrl: `https://example.com/${talentName}.png`,
});

describe("createArchiveCollaborationRanking", () => {
  it("counts hololive collaborators for the selected JST year", () => {
    const suisei = channel("星街すいせい");
    const iroha = channel("風真いろは", "DEV_IS");

    const ranking = createArchiveCollaborationRanking(
      [
        {
          stream_started_at: "2025-12-31T15:30:00.000Z",
          video_duration: "PT1H",
          participantEntries: [
            { name: "AZKi", channel: channel("AZKi") },
            { name: "星街すいせい", channel: suisei },
            { name: "星街すいせい", channel: suisei },
            { name: "外部ゲスト", channel: channel("外部ゲスト", "guest") },
          ],
        },
        {
          stream_started_at: "2026-02-01T00:00:00.000Z",
          video_duration: "PT30M",
          participantEntries: [
            { name: "星街すいせい", channel: suisei },
            { name: "風真いろは", channel: iroha },
          ],
        },
        {
          stream_started_at: "2025-03-01T00:00:00.000Z",
          video_duration: "invalid",
          participantEntries: [{ name: "風真いろは", channel: iroha }],
        },
      ],
      "2026",
      "ja",
    );

    expect(
      ranking.map(
        ({ name, count, totalDurationSeconds, firstCollaborationDate }) => ({
          name,
          count,
          totalDurationSeconds,
          firstCollaborationDate,
        }),
      ),
    ).toEqual([
      {
        name: "星街すいせい",
        count: 2,
        totalDurationSeconds: 5_400,
        firstCollaborationDate: "2026-01-01",
      },
      {
        name: "風真いろは",
        count: 1,
        totalDurationSeconds: 1_800,
        firstCollaborationDate: "2026-02-01",
      },
    ]);
  });

  it("counts all archives when no year is selected", () => {
    const suisei = channel("星街すいせい");

    const ranking = createArchiveCollaborationRanking(
      [
        {
          stream_started_at: "2025-01-01T00:00:00.000Z",
          video_duration: "PT2H",
          participantEntries: [{ name: "星街すいせい", channel: suisei }],
        },
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          video_duration: "PT1H",
          participantEntries: [{ name: "星街すいせい", channel: suisei }],
        },
      ],
      null,
      "ja",
    );

    expect(ranking[0]).toMatchObject({
      name: "星街すいせい",
      count: 2,
      totalDurationSeconds: 10_800,
      firstCollaborationDate: "2025-01-01",
    });
  });

  it("counts exact hololive combinations and uses official unit names", () => {
    const azki = channel("AZKi");
    const lamy = channel("雪花ラミィ");
    const koyori = channel("博衣こより");
    const iroha = channel("風真いろは");

    const ranking = createArchiveCollaborationCombinationRanking(
      [
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          video_duration: "PT1H",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "雪花ラミィ", channel: lamy },
            { name: "博衣こより", channel: koyori },
          ],
        },
        {
          stream_started_at: "2026-02-01T00:00:00.000Z",
          video_duration: "PT2H",
          participantEntries: [
            { name: "雪花ラミィ", channel: lamy },
            { name: "博衣こより", channel: koyori },
            { name: "博衣こより", channel: koyori },
          ],
        },
        {
          stream_started_at: "2026-03-01T00:00:00.000Z",
          video_duration: "PT30M",
          participantEntries: [{ name: "風真いろは", channel: iroha }],
        },
        {
          stream_started_at: "2026-04-01T00:00:00.000Z",
          video_duration: "PT4H",
          participantEntries: [
            { name: "外部ゲスト", channel: channel("外部ゲスト", "guest") },
          ],
        },
      ],
      null,
      "ja",
      { name: "AZKi", channel: azki },
    );

    expect(
      ranking.map(
        ({
          name,
          count,
          castNames,
          totalDurationSeconds,
          firstCollaborationDate,
        }) => ({
          name,
          count,
          castNames,
          totalDurationSeconds,
          firstCollaborationDate,
        }),
      ),
    ).toEqual([
      {
        name: "KoZMy",
        count: 2,
        castNames: ["雪花ラミィ", "博衣こより"],
        totalDurationSeconds: 10_800,
        firstCollaborationDate: "2026-01-01",
      },
      {
        name: "あずいろ",
        count: 1,
        castNames: ["風真いろは"],
        totalDurationSeconds: 1_800,
        firstCollaborationDate: "2026-03-01",
      },
    ]);
  });
});
