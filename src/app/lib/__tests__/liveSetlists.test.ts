import { describe, expect, it } from "vitest";
import {
  buildLiveTitleGroups,
  filterLiveTitleGroups,
  findLiveTitleGroup,
  groupLiveTitleGroupsByYear,
  isAzkiSungOfficialFesEntry,
} from "../liveSetlists";

const liveRows = [
  [
    "場所",
    "ライブタイトル",
    "ライブID",
    "カテゴリ",
    "開催日",
    "公演",
    "出演者",
    "開場",
    "開演",
    "URL",
    "チケット",
    "備考",
  ],
  [
    "CLUB CITTA’",
    "First Gravity",
    "LIVE-018",
    "ユニットライブ",
    "2024-01-27",
    "昼公演",
    "AZKi、ときのそら",
    "11:00",
    "12:00",
    "https://example.com/live",
    "7,500円",
    "昼の備考",
  ],
  [
    "CLUB CITTA’",
    "First Gravity",
    "LIVE-019",
    "ユニットライブ",
    "2024-01-27",
    "夜公演",
    "AZKi、ときのそら",
    "15:00",
    "16:00",
    "https://example.com/live",
    "7,500円",
    "",
  ],
  [
    "幕張メッセ",
    "Official Stage",
    "LIVE-029",
    "新カテゴリ",
    "2026-03-07",
    "STAGE3",
    "AZKiほか",
    "17:00",
    "18:30",
    "",
    "",
    "",
  ],
  ["", "日付なし", "LIVE-999", "ソロライブ", "", "", "", "", ""],
];

const setlistRows = [
  ["備考", "歌った人", "ライブID", "楽曲タイトル", "曲順", "アーティスト名"],
  ["", "AZKi", "LIVE-018", "昼の曲", "EN", "AZKi"],
  ["分割メドレー", "AZKi", "LIVE-019", "夜の曲A", "02a", "AZKi"],
  ["", "", "LIVE-019", "Overture", "01-1", "AZKi"],
  ["", "AZKi", "LIVE-404", "孤立した曲", "01", "AZKi"],
  ["", "AZKi", "LIVE-019", "", "99", "AZKi"],
];

describe("buildLiveTitleGroups", () => {
  it("列順に依存せずライブを結合し、同名タイトルを代表IDへまとめる", () => {
    const groups = buildLiveTitleGroups(liveRows, setlistRows);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      canonicalId: "LIVE-029",
      title: "Official Stage",
      category: "新カテゴリ",
      latestDate: "2026-03-07",
      totalSongs: 0,
    });
    expect(groups[1]).toMatchObject({
      canonicalId: "LIVE-018",
      title: "First Gravity",
      totalSongs: 3,
    });
    expect(groups[1].performances.map((performance) => performance.id)).toEqual(
      ["LIVE-018", "LIVE-019"],
    );
  });

  it("曲順を再ソートせず、空の歌唱者と備考をそのまま正規化する", () => {
    const group = buildLiveTitleGroups(liveRows, setlistRows)[1];
    const nightSetlist = group.performances[1].setlist;

    expect(nightSetlist.map((entry) => entry.order)).toEqual(["02a", "01-1"]);
    expect(nightSetlist[0].note).toBe("分割メドレー");
    expect(nightSetlist[1].singers).toBe("");
    expect(nightSetlist.some((entry) => entry.title === "孤立した曲")).toBe(
      false,
    );
  });

  it("ライブID検索、カテゴリと表記ゆれを含む検索、年別集約を行う", () => {
    const groups = buildLiveTitleGroups(liveRows, setlistRows);

    expect(findLiveTitleGroup(groups, "LIVE-019")?.canonicalId).toBe(
      "LIVE-018",
    );
    expect(
      filterLiveTitleGroups(groups, {
        category: "ユニットライブ",
        query: "ａｚｋｉ　夜公演",
      }).map((group) => group.canonicalId),
    ).toEqual(["LIVE-018"]);
    expect(Array.from(groupLiveTitleGroupsByYear(groups).keys())).toEqual([
      "2026",
      "2024",
    ]);
  });

  it("同日の公演をIDの文字順ではなく開演時刻順に並べる", () => {
    const rows = [
      ["ライブID", "ライブタイトル", "開催日", "公演", "開場", "開演"],
      [
        "kowairo-entropy-yokohama-night",
        "声音エントロピー",
        "2024-08-03",
        "横浜夜",
        "17:00",
        "18:00",
      ],
      [
        "kowairo-entropy-toyosu-day1",
        "声音エントロピー",
        "2024-09-17",
        "豊洲Day1",
        "18:00",
        "19:00",
      ],
      [
        "kowairo-entropy-yokohama-day",
        "声音エントロピー",
        "2024-08-03",
        "横浜昼",
        "11:30",
        "12:30",
      ],
      [
        "kowairo-entropy-toyosu-day2",
        "声音エントロピー",
        "2024-09-18",
        "豊洲Day2",
        "18:00",
        "19:00",
      ],
    ];
    const [group] = buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]]);

    expect(group.canonicalId).toBe("kowairo-entropy-yokohama-day");
    expect(
      group.performances.map((performance) => performance.performance),
    ).toEqual(["横浜昼", "横浜夜", "豊洲Day1", "豊洲Day2"]);
    expect(findLiveTitleGroup([group], "a98652e")).toBe(group);
  });

  it("シートのページslugと公演slugで階層を構成する", () => {
    const rows = [
      ["ライブID", "ライブタイトル", "開催日", "ページslug", "公演slug"],
      [
        "kowairo-entropy-yokohama-day",
        "声音エントロピー",
        "2024-08-03",
        "kowairo-entropy",
        "yokohama-day",
      ],
      [
        "kowairo-entropy-yokohama-night",
        "声音エントロピー",
        "2024-08-03",
        "kowairo-entropy",
        "yokohama-night",
      ],
      [
        "hololive-6th-fes-color-rise-harmony-stage2",
        "Color Rise Harmony",
        "2025-03-08",
        "hololive-6th-fes-color-rise-harmony",
        "stage2",
      ],
      [
        "hololive-6th-fes-color-rise-harmony-creators",
        "Color Rise Harmony",
        "2025-03-09",
        "hololive-6th-fes-color-rise-harmony",
        "creators-stage",
      ],
    ];
    const groups = buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]]);

    expect(groups.map((group) => [group.title, group.pageSlug])).toEqual([
      ["Color Rise Harmony", "hololive-6th-fes-color-rise-harmony"],
      ["声音エントロピー", "kowairo-entropy"],
    ]);
    expect(groups[0].performances.map((item) => item.performanceSlug)).toEqual([
      "stage2",
      "creators-stage",
    ]);
  });

  it("不完全・重複したslug設定では階層を使わない", () => {
    const rows = [
      ["ライブID", "ライブタイトル", "開催日", "ページslug", "公演slug"],
      ["first", "Test Live", "2024-01-01", "test-live", "day"],
      ["second", "Test Live", "2024-01-01", "test-live", "day"],
    ];
    expect(
      buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]])[0].pageSlug,
    ).toBe("");
    rows[2][4] = "night";
    rows[2][3] = "";
    expect(
      buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]])[0].pageSlug,
    ).toBe("");
  });

  it("比較ページのallを公演slugとして使わない", () => {
    const rows = [
      ["ライブID", "ライブタイトル", "開催日", "ページslug", "公演slug"],
      ["first", "Test Live", "2024-01-01", "test-live", "all"],
      ["second", "Test Live", "2024-01-01", "test-live", "night"],
    ];
    expect(
      buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]])[0].pageSlug,
    ).toBe("");
  });

  it("タイトル間でページslugが重複・IDと衝突した場合も従来URLに戻す", () => {
    const rows = [
      ["ライブID", "ライブタイトル", "開催日", "ページslug", "公演slug"],
      ["first-id", "First Live", "2024-01-01", "shared-slug", "day"],
      ["second-id", "Second Live", "2024-01-02", "shared-slug", "night"],
    ];
    expect(
      buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]]).map(
        (group) => group.pageSlug,
      ),
    ).toEqual(["", ""]);
    rows[2][3] = "first-id";
    expect(
      buildLiveTitleGroups(rows, [["ライブID", "楽曲タイトル"]]).map(
        (group) => group.pageSlug,
      ),
    ).toEqual(["", "shared-slug"]);
  });

  it("公式fesで歌った人にAZKiが含まれる曲だけを強調対象にする", () => {
    const entry = {
      order: "01",
      title: "Song",
      artist: "AZKi",
      singers: "AZKi、星街すいせい",
      note: "",
    };
    expect(isAzkiSungOfficialFesEntry("公式fes", entry)).toBe(true);
    expect(
      isAzkiSungOfficialFesEntry("公式fes", {
        ...entry,
        singers: "星街すいせい / ＡＺＫｉ",
      }),
    ).toBe(true);
    expect(
      isAzkiSungOfficialFesEntry("公式fes", {
        ...entry,
        singers: "NotAZKi",
      }),
    ).toBe(false);
    expect(
      isAzkiSungOfficialFesEntry("公式fes", { ...entry, singers: "" }),
    ).toBe(false);
    expect(isAzkiSungOfficialFesEntry("ソロライブ", entry)).toBe(false);
  });
});
