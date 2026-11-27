import { describe, expect, it } from "vitest";
import {
  buildSeichiMapAchievementTargets,
  computeSeichiMapEligibleTiers,
  createSeichiMapAchievementEvaluationContext,
  findSeichiMapOverlappingTierLevels,
  getSeichiMapAchievementRequiredCount,
  getSeichiMapActiveTiers,
  parseSeichiMapAchievementCriteria,
  SeichiMapAchievementCriteriaError,
  type SeichiMapAchievementLocation,
  type SeichiMapAchievementMaster,
} from "../seichiMapAchievementRules";
import {
  SEICHI_MAP_ACHIEVEMENT_DEFAULTS,
  SEICHI_MAP_LAYERS,
} from "../seichiMapAchievementDefaults";

let sequence = 0;
const loc = (
  folder: string,
  name: string,
  extra: Partial<SeichiMapAchievementLocation> = {},
): SeichiMapAchievementLocation => {
  sequence += 1;
  return {
    locationId: sequence.toString(16).padStart(16, "0"),
    folder,
    name,
    region: "DOMESTIC",
    prefectureCode: "13",
    ...extra,
  };
};

const defaults = new Map(
  SEICHI_MAP_ACHIEVEMENT_DEFAULTS.map((achievement) => [
    achievement.id,
    achievement,
  ]),
);

const targetNames = (
  achievementId: string,
  locations: SeichiMapAchievementLocation[],
) => {
  const [target] = buildSeichiMapAchievementTargets(
    [defaults.get(achievementId)!],
    locations,
  );
  return locations
    .filter((location) => target.locationIds.has(location.locationId))
    .map((location) => location.name);
};

describe("seichi map achievement rules", () => {
  it("#AZロケの回はラベルで判定し、ロケ外・こぼれ話を含めて第10弾には一致しない", () => {
    const locations = [
      loc(SEICHI_MAP_LAYERS.azLocation, "鳥取砂丘（#AZロケ 第1弾）"),
      loc(SEICHI_MAP_LAYERS.azLocation, "高松駅前（#AZロケ 第3弾）"),
      loc(SEICHI_MAP_LAYERS.azLocation, "寄り道（#AZロケ 第3弾ロケ外）"),
      loc(SEICHI_MAP_LAYERS.azLocation, "将来の地点（#AZロケ 第10弾）"),
      loc(SEICHI_MAP_LAYERS.azLocation, "三島駅南口（かなけん社員旅行）"),
      loc(
        SEICHI_MAP_LAYERS.azLocation,
        "交差点（一日小豆警察署長&香川県警察 交通規制アンバサダー）",
      ),
      loc(
        SEICHI_MAP_LAYERS.collabStream,
        "うどん屋出たら即終了ジオゲッサーで引き当てたAZロケ聖地ご近所",
      ),
    ];

    expect(targetNames("azloc-1", locations)).toEqual([
      "鳥取砂丘（#AZロケ 第1弾）",
    ]);
    expect(targetNames("azloc-3", locations)).toEqual([
      "高松駅前（#AZロケ 第3弾）",
      "寄り道（#AZロケ 第3弾ロケ外）",
    ]);
    expect(targetNames("azloc-6", locations)).toEqual([
      "交差点（一日小豆警察署長&香川県警察 交通規制アンバサダー）",
    ]);
    expect(targetNames("azloc-all", locations)).toHaveLength(5);
  });

  it("鉄分補給は駅名と鉄道ラベルを対象にし、道の駅や駅前店は除く", () => {
    const locations = [
      loc(SEICHI_MAP_LAYERS.holomenMap, "湊駅（ホロメンマップ／湊あくあ）"),
      loc(SEICHI_MAP_LAYERS.azLocation, "JR大阪駅デッキ(Midnight Song)"),
      loc(
        SEICHI_MAP_LAYERS.holomenMap,
        "道の駅 とわだ(ホロメンマップ/常闇トワ)",
      ),
      loc(
        SEICHI_MAP_LAYERS.guess100,
        "マクドナルド 小倉駅前店(100Guess耐久2026)",
      ),
      loc(SEICHI_MAP_LAYERS.traffic, "長岡車両センター(鉄道・駅・鉄道博物館)"),
      loc(SEICHI_MAP_LAYERS.traffic, "能勢電鉄 平野車庫(鉄道車両基地)"),
      loc(SEICHI_MAP_LAYERS.traffic, "伊賀SA(高速道路SA・PA)"),
    ];

    expect(targetNames("rail", locations)).toEqual([
      "湊駅（ホロメンマップ／湊あくあ）",
      "JR大阪駅デッキ(Midnight Song)",
      "長岡車両センター(鉄道・駅・鉄道博物館)",
      "能勢電鉄 平野車庫(鉄道車両基地)",
    ]);
  });

  it("青看板は地点名から判定する", () => {
    const locations = [
      loc(
        SEICHI_MAP_LAYERS.azLocation,
        "さわやか付近の青看板（#AZロケ 第2弾）",
      ),
      loc(SEICHI_MAP_LAYERS.traffic, "国道の看板(面白い・珍しい青看板)"),
      loc(SEICHI_MAP_LAYERS.traffic, "緑看板"),
    ];
    expect(targetNames("blue-sign", locations)).toEqual([
      "さわやか付近の青看板（#AZロケ 第2弾）",
      "国道の看板(面白い・珍しい青看板)",
    ]);
  });

  it("リアルLiVEとコラボイベントを地点名の接頭辞で振り分ける", () => {
    const locations = [
      loc(SEICHI_MAP_LAYERS.liveArchive, "ぴあアリーナMM（Departure）"),
      loc(SEICHI_MAP_LAYERS.upcomingEvents, "KINTEX 第1展示場"),
      loc(SEICHI_MAP_LAYERS.liveArchive, "（終了）桜上水駅（京王電鉄 コラボ）"),
      loc(
        SEICHI_MAP_LAYERS.liveArchive,
        "（掲載終了）香川県警コラボ交通情報板1(香川県警察交通規制アンバサダー)",
      ),
      loc(
        SEICHI_MAP_LAYERS.liveArchive,
        "AZKi × 香川県警察 交通規制アンバサダーポスター撮影地",
      ),
      loc(SEICHI_MAP_LAYERS.upcomingEvents, "（終了）予定だったイベント"),
    ];

    expect(targetNames("real-live", locations)).toEqual([
      "ぴあアリーナMM（Departure）",
      "KINTEX 第1展示場",
    ]);
    expect(targetNames("collab-event", locations)).toEqual([
      "（終了）桜上水駅（京王電鉄 コラボ）",
      "（掲載終了）香川県警コラボ交通情報板1(香川県警察交通規制アンバサダー)",
      "AZKi × 香川県警察 交通規制アンバサダーポスター撮影地",
    ]);
  });

  it("国外と都道府県は座標の判定結果を使い、未判定の地点は数えない", () => {
    const locations = [
      loc("x", "東京", { prefectureCode: "13" }),
      loc("x", "東京2", { prefectureCode: "13" }),
      loc("x", "大阪", { prefectureCode: "27" }),
      loc("x", "Javits Center", { region: "OVERSEAS", prefectureCode: null }),
      loc("x", "海上", { region: "UNKNOWN", prefectureCode: null }),
    ];
    const context = createSeichiMapAchievementEvaluationContext(
      [defaults.get("prefectures")!, defaults.get("overseas")!],
      locations,
    );
    expect(context.targets.map((target) => target.denominator)).toEqual([
      47, 1,
    ]);

    const visited = new Set(locations.map((location) => location.locationId));
    const eligible = computeSeichiMapEligibleTiers(context, visited);
    // 都道府県は2種類なので「1箇所」だけ、国外は1/1なので全グレードが全制覇にまとまる
    expect(
      eligible.filter((tier) => tier.achievementId === "prefectures"),
    ).toEqual([
      {
        achievementId: "prefectures",
        level: 1,
        progressCount: 2,
        denominatorAtAward: null,
      },
    ]);
    expect(
      eligible
        .filter((tier) => tier.achievementId === "overseas")
        .map((tier) => tier.level),
    ).toEqual([6]);
  });

  it("同じ件数のグレードは1つにまとめ、全制覇があれば全制覇を残す", () => {
    const tiers = defaults.get("azloc-5")!.tiers; // 1箇所,10,25,50,75,100%
    const levels = (denominator: number) =>
      getSeichiMapActiveTiers(tiers, denominator).map(({ level }) => level);

    // 7地点: 1,1,2,4,6,7 → 10%は1箇所にまとめる
    expect(levels(7)).toEqual([1, 3, 4, 5, 6]);
    // 3地点: 1,1,1,2,3,3 → 75%は全制覇にまとめる
    expect(levels(3)).toEqual([1, 4, 6]);
    // 地点が増えれば復活する
    expect(levels(20)).toEqual([1, 2, 3, 4, 5, 6]);
    // 分母0では達成できない段階もそのまま残す
    expect(levels(0)).toEqual([1, 2, 3, 4, 5, 6]);

    const locations = Array.from({ length: 3 }, (_, index) =>
      loc(SEICHI_MAP_LAYERS.azLocation, `地点${index}（#AZロケ 第5弾）`),
    );
    const context = createSeichiMapAchievementEvaluationContext(
      [defaults.get("azloc-5")!],
      locations,
    );
    expect(
      computeSeichiMapEligibleTiers(
        context,
        new Set(locations.map(({ locationId }) => locationId)),
      ).map(({ level }) => level),
    ).toEqual([1, 4, 6]);
  });

  it("%段階は切り上げ、全制覇は分母に到達したときだけ達成する", () => {
    const master: SeichiMapAchievementMaster = {
      id: "layer",
      metric: "LOCATION_COUNT",
      criteria: [{ layers: ["A"] }],
      denominatorOverride: null,
      tiers: [
        { level: 1, thresholdType: "PERCENT", thresholdValue: 10 },
        { level: 2, thresholdType: "PERCENT", thresholdValue: 50 },
        { level: 3, thresholdType: "PERCENT", thresholdValue: 100 },
      ],
    };
    const locations = Array.from({ length: 7 }, (_, index) =>
      loc("A", `地点${index}`),
    );
    const context = createSeichiMapAchievementEvaluationContext(
      [master],
      locations,
    );
    const visit = (count: number) =>
      computeSeichiMapEligibleTiers(
        context,
        new Set(locations.slice(0, count).map(({ locationId }) => locationId)),
      ).map((tier) => tier.level);

    expect(visit(0)).toEqual([]);
    expect(visit(1)).toEqual([1]);
    expect(visit(3)).toEqual([1]);
    expect(visit(4)).toEqual([1, 2]);
    expect(visit(6)).toEqual([1, 2]);
    expect(visit(7)).toEqual([1, 2, 3]);
  });

  it("分母0の%段階は達成不可、COUNTはそのまま件数を使う", () => {
    expect(
      getSeichiMapAchievementRequiredCount(
        { thresholdType: "PERCENT", thresholdValue: 10 },
        0,
      ),
    ).toBe(Number.POSITIVE_INFINITY);
    expect(
      getSeichiMapAchievementRequiredCount(
        { thresholdType: "COUNT", thresholdValue: 5 },
        0,
      ),
    ).toBe(5);
  });

  it("訪問済みでも対象外の地点は数えない", () => {
    const locations = [loc("A", "a"), loc("B", "b")];
    const context = createSeichiMapAchievementEvaluationContext(
      [defaults.get("real-guess-first")!, defaults.get("holomen-map-first")!],
      locations,
    );
    const eligible = computeSeichiMapEligibleTiers(
      context,
      new Set([locations[1].locationId, "ffffffffffffffff"]),
    );
    expect(eligible).toEqual([
      {
        achievementId: "real-guess-first",
        level: 1,
        progressCount: 1,
        denominatorAtAward: null,
      },
    ]);
  });

  it("例外指定は自動判定より優先する", () => {
    const included = loc("other", "対象外の地点");
    const excluded = loc(SEICHI_MAP_LAYERS.holomenMap, "除外する地点");
    const [target] = buildSeichiMapAchievementTargets(
      [
        {
          ...defaults.get("holomen-map-explorer")!,
          overrides: new Map([
            [included.locationId, true],
            [excluded.locationId, false],
          ]),
        },
      ],
      [included, excluded],
    );
    expect([...target.locationIds]).toEqual([included.locationId]);
  });

  it("同じ件数で達成になるグレードを検出する", () => {
    const tiers = defaults.get("azloc-5")!.tiers;
    expect(findSeichiMapOverlappingTierLevels(tiers, 7)).toEqual([[1, 2]]);
    expect(findSeichiMapOverlappingTierLevels(tiers, 0)).toEqual([]);
  });

  it("criteria の不正な形式を拒否する", () => {
    expect(() => parseSeichiMapAchievementCriteria({})).toThrow(
      SeichiMapAchievementCriteriaError,
    );
    expect(() => parseSeichiMapAchievementCriteria([{}])).toThrow(
      SeichiMapAchievementCriteriaError,
    );
    expect(() => parseSeichiMapAchievementCriteria([{ unknown: "x" }])).toThrow(
      SeichiMapAchievementCriteriaError,
    );
    expect(() => parseSeichiMapAchievementCriteria([{ name: "(" }])).toThrow(
      SeichiMapAchievementCriteriaError,
    );
    expect(() => parseSeichiMapAchievementCriteria([{ exclude: "x" }])).toThrow(
      SeichiMapAchievementCriteriaError,
    );
    expect(() =>
      parseSeichiMapAchievementCriteria([{ region: "MARS" }]),
    ).toThrow(SeichiMapAchievementCriteriaError);
    expect(
      parseSeichiMapAchievementCriteria([
        { layers: ["A"], label: "^x", region: "OVERSEAS" },
      ]),
    ).toEqual([{ layers: ["A"], label: "^x", region: "OVERSEAS" }]);
  });
});
