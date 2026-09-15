import { describe, expect, it } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import {
  createArchiveCollaborationCombinationRanking,
  createArchiveCollaborationRanking,
  createArchiveMembersWithoutCollaboration,
  createArchiveMembersWithoutKaraokeCollaboration,
  type ArchiveSongCollaborationSource,
  getArchiveHololiveMemberMetadata,
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

const song = (
  videoId: string,
  singers: string[],
  tags = ["歌枠"],
): ArchiveSongCollaborationSource => ({
  video_id: videoId,
  sing: singers.join("、"),
  sings: singers,
  hl: {
    ja: {
      title: "",
      artist: "",
      artists: [],
      sings: singers,
    },
  },
  tags,
});

describe("createArchiveCollaborationRanking", () => {
  it("separates generation labels from inactive status", () => {
    const graduate = channel("夜空メル");
    graduate.generation = "1期生、卒業生";
    const endedActivity = channel("沙花叉クロヱ");
    endedActivity.generation = "6期生、holoX、活動終了";
    const promise = channel("オーロ・クロニー", "hololive");
    promise.generation = "Council、Promise";

    expect(
      getArchiveHololiveMemberMetadata({ name: "夜空メル", channel: graduate }),
    ).toEqual({ generation: "1期生", status: "卒業生" });
    expect(
      getArchiveHololiveMemberMetadata({
        name: "沙花叉クロヱ",
        channel: endedActivity,
      }),
    ).toEqual({ generation: "秘密結社holoX", status: "活動終了" });
    expect(
      getArchiveHololiveMemberMetadata({
        name: "オーロ・クロニー",
        channel: promise,
      }),
    ).toEqual({ generation: "Council・Promise", status: null });
  });

  it("ranks hololive collaborators by total duration for the selected JST year", () => {
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
          participantEntries: [{ name: "星街すいせい", channel: suisei }],
        },
        {
          stream_started_at: "2026-03-01T00:00:00.000Z",
          video_duration: "PT2H",
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
        name: "風真いろは",
        count: 1,
        totalDurationSeconds: 7_200,
        firstCollaborationDate: "2026-03-01",
      },
      {
        name: "星街すいせい",
        count: 2,
        totalDurationSeconds: 5_400,
        firstCollaborationDate: "2026-01-01",
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

  it("finds hololive members with no collaboration across all archives", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    const iroha = channel("風真いろは", "DEV_IS");
    const duplicateIroha = channel("風真いろは", "DEV_IS", "UC-iroha-2");
    const guest = channel("外部ゲスト", "guest");
    const graduate = channel("夜空メル");
    graduate.generation = "1期生、卒業生";
    const endedActivity = channel("沙花叉クロヱ");
    endedActivity.generation = "6期生、holoX、活動終了";

    const members = createArchiveMembersWithoutCollaboration(
      [
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "すいちゃん", channel: suisei },
          ],
        },
      ],
      [azki, suisei, iroha, duplicateIroha, guest, graduate, endedActivity],
      "ja",
    );

    expect(members.map(({ name }) => name)).toEqual(["風真いろは"]);
  });

  it("orders members without collaboration like the archive cast filter", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    suisei.generation = "0期生";
    const fubuki = channel("白上フブキ");
    fubuki.generation = "1期生、ゲーマーズ";
    const iroha = channel("風真いろは", "DEV_IS");
    iroha.generation = "秘密結社holoX";

    const members = createArchiveMembersWithoutCollaboration(
      [],
      [azki, iroha, fubuki, suisei],
      "ja",
    );

    expect(members.map(({ name }) => name)).toEqual([
      "星街すいせい",
      "白上フブキ",
      "風真いろは",
    ]);
  });

  it("does not count streams with more than four collaborator groups", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    const iroha = channel("風真いろは", "DEV_IS");
    const guests = [1, 2, 3].map((index) =>
      channel(`外部ゲスト${index}`, "guest"),
    );

    const members = createArchiveMembersWithoutCollaboration(
      [
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "星街すいせい", channel: suisei },
            { name: "風真いろは", channel: iroha },
            ...guests.map((guest) => ({
              name: guest.talentName,
              channel: guest,
            })),
          ],
        },
      ],
      [azki, suisei, iroha, ...guests],
      "ja",
    );

    expect(members.map(({ name }) => name)).toEqual([
      "星街すいせい",
      "風真いろは",
    ]);
  });

  it("counts up to four collaborator groups, including Roboco", () => {
    const azki = channel("AZKi");
    const roboco = channel("ロボ子さん");
    const sora = channel("ときのそら");
    const miko = channel("さくらみこ");
    const suisei = channel("星街すいせい");

    const members = createArchiveMembersWithoutCollaboration(
      [
        {
          stream_started_at: "2024-05-20T12:00:00.000Z",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "ロボ子さん", channel: roboco },
            { name: "ときのそら", channel: sora },
            { name: "さくらみこ", channel: miko },
            { name: "星街すいせい", channel: suisei },
          ],
        },
      ],
      [azki, roboco, sora, miko, suisei],
      "ja",
    );

    expect(members).toEqual([]);
  });

  it("treats FUWAMOCO as one collaborator set", () => {
    const azki = channel("AZKi");
    const fuwawa = channel("フワワアビスガード", "EN", "UC-fuwawa");
    const mococo = channel("モココアビスガード", "EN", "UC-mococo");
    fuwawa.channelName = "FUWAMOCO Ch. hololive-EN";
    mococo.channelName = "FUWAMOCO Ch. hololive-EN";

    const members = createArchiveMembersWithoutCollaboration(
      [
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "フワワ", channel: fuwawa },
            { name: "モココ", channel: mococo },
          ],
        },
      ],
      [azki, fuwawa, mococo],
      "ja",
    );

    expect(members).toEqual([]);

    const membersFromSingleTwin = createArchiveMembersWithoutCollaboration(
      [
        {
          stream_started_at: "2026-01-01T00:00:00.000Z",
          participantEntries: [
            { name: "AZKi", channel: azki },
            { name: "フワワ", channel: fuwawa },
          ],
        },
      ],
      [azki, fuwawa, mococo],
      "ja",
    );

    expect(membersFromSingleTwin).toEqual([]);
  });

  it("finds members without a one-on-one singing-stream collaboration", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    const iroha = channel("風真いろは", "DEV_IS");
    const items = [
      {
        topic: "雑談",
        stream_started_at: "2026-01-01T00:00:00.000Z",
        participantEntries: [{ name: "星街すいせい", channel: suisei }],
      },
      {
        video_id: "iroha-karaoke",
        topic: "歌枠",
        stream_started_at: "2026-02-01T00:00:00.000Z",
        participantEntries: [{ name: "風真いろは", channel: iroha }],
      },
    ];

    expect(
      createArchiveMembersWithoutCollaboration(
        items,
        [azki, suisei, iroha],
        "ja",
      ),
    ).toEqual([]);
    expect(
      createArchiveMembersWithoutKaraokeCollaboration(
        [azki, suisei, iroha],
        "ja",
        [song("iroha-karaoke", ["AZKi", "風真いろは"])],
      ).map(({ name }) => name),
    ).toEqual(["星街すいせい"]);
  });

  it("uses songs API singers even when the video is missing from archives", () => {
    const azki = channel("AZKi");
    const suisei = channel("星街すいせい");
    const sora = channel("ときのそら");
    const aki = channel("アキ・ローゼンタール");
    const videoId = "jRX_EeOZc-I";

    const members = createArchiveMembersWithoutKaraokeCollaboration(
      [azki, suisei, sora, aki],
      "ja",
      [
        song(videoId, ["AZKi", "アキ・ローゼンタール"]),
        song(videoId, ["AZKi", "大神ミオ"]),
        song(videoId, ["AZKi", "アキ・ローゼンタール", "大神ミオ"]),
      ],
    );

    expect(members.map(({ name }) => name)).toEqual([
      "ときのそら",
      "星街すいせい",
    ]);
  });

  it("does not treat 3D LIVE guests as singing-stream collaborators", () => {
    const azki = channel("AZKi");
    const botan = channel("獅白ぼたん");
    const videoId = "3d-live-guest";

    const members = createArchiveMembersWithoutKaraokeCollaboration(
      [azki, botan],
      "ja",
      [song(videoId, ["AZKi", "獅白ぼたん"], ["記念ライブ"])],
    );

    expect(members.map(({ name }) => name)).toEqual(["獅白ぼたん"]);
  });

  it("counts unique karaoke singers per video, up to four people including AZKi", () => {
    const azki = channel("AZKi");
    const roboco = channel("ロボ子さん");
    const su = channel("水宮枢", "DEV_IS");
    const riona = channel("響咲リオナ", "DEV_IS");
    const suisei = channel("星街すいせい");
    const miko = channel("さくらみこ");

    const fourPersonKaraoke = createArchiveMembersWithoutKaraokeCollaboration(
      [azki, roboco, su, riona, suisei],
      "ja",
      [
        song("four-person-karaoke", [
          "AZKi",
          "ロボ子さん",
          "水宮枢",
          "響咲リオナ",
        ]),
      ],
    );

    expect(fourPersonKaraoke.map(({ name }) => name)).toEqual(["星街すいせい"]);

    const fivePersonKaraoke = createArchiveMembersWithoutKaraokeCollaboration(
      [azki, roboco, su, riona, suisei, miko],
      "ja",
      [
        song("five-person-karaoke", [
          "AZKi",
          "ロボ子さん",
          "水宮枢",
          "響咲リオナ",
          "さくらみこ",
        ]),
      ],
    );

    expect(fivePersonKaraoke.map(({ name }) => name)).toEqual([
      "さくらみこ",
      "ロボ子さん",
      "響咲リオナ",
      "水宮枢",
      "星街すいせい",
    ]);
  });

  it("does not count karaoke videos that do not include AZKi", () => {
    const azki = channel("AZKi");
    const iroha = channel("風真いろは", "DEV_IS");

    const members = createArchiveMembersWithoutKaraokeCollaboration(
      [azki, iroha],
      "ja",
      [song("iroha-solo-karaoke", ["風真いろは"])],
    );

    expect(members.map(({ name }) => name)).toEqual(["風真いろは"]);
  });

  it("ranks exact hololive combinations by duration and uses official unit names", () => {
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
          video_duration: "PT4H",
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
        name: "あずいろ",
        count: 1,
        castNames: ["風真いろは"],
        totalDurationSeconds: 14_400,
        firstCollaborationDate: "2026-03-01",
      },
      {
        name: "KoZMy",
        count: 2,
        castNames: ["雪花ラミィ", "博衣こより"],
        totalDurationSeconds: 10_800,
        firstCollaborationDate: "2026-01-01",
      },
    ]);
  });
});
