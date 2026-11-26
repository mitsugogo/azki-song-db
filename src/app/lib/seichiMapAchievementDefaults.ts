import type {
  SeichiMapAchievementDefinition,
  SeichiMapAchievementRarityName,
  SeichiMapAchievementRule,
  SeichiMapAchievementTierDefinition,
} from "../types/seichiMapAchievements";

/**
 * 聖地マップのバッジの初期マスタ。
 * 本番のマスタは TiDB の SeichiMapAchievement にあり、この定義は初回投入用の
 * migration SQL（toSeichiMapAchievementSeedSql）とテストの基準として使う。
 * migration SQL の文字列リテラルでバックスラッシュを扱わずに済むよう、
 * 正規表現は \d や \( を使わず [0-9] や [(] で書く。
 */

export const SEICHI_MAP_LAYERS = {
  holomenMap: "ホロメンマップ",
  azLocation: "AZロケ、オリ曲MV、お出かけエピソード",
  collabStream: "コラボ配信、ジモゲッサー",
  traffic: "鉄道・青看板・道路",
  guess100: "2026年100Guess耐久",
  azkiNavi: "AZKiナビ 推しドラご当地ボイス地点",
  liveArchive: "LiVE開催・出演会場、過去のコラボ情報アーカイブ",
  upcomingEvents: "開催中・予定のイベント",
} as const;

const RARITY_ORDER: SeichiMapAchievementRarityName[] = [
  "N",
  "R",
  "SR",
  "SSR",
  "UR",
];

const count = (
  ...values: [number, SeichiMapAchievementRarityName][]
): SeichiMapAchievementTierDefinition[] =>
  values.map(([thresholdValue, rarity], index) => ({
    level: index + 1,
    thresholdType: "COUNT",
    thresholdValue,
    rarity,
  }));

/** 「10% / 25% / 50% / 75% / 全制覇」のレア度。UR は全国・海外系の全制覇だけにする。 */
const PERCENT_TIER_RARITIES: Record<
  "regional" | "nationwide",
  readonly SeichiMapAchievementRarityName[]
> = {
  regional: ["R", "R", "SR", "SSR", "SSR"],
  nationwide: ["SR", "SR", "SSR", "SSR", "UR"],
};

/**
 * 「1箇所 / 10% / 25% / 50% / 75% / 全制覇」。
 * 全国・海外に散らばる地点のバッジは nationwide で2段階目以降のレア度を上げる。
 */
const progressTiers = ({
  withFirst = true,
  nationwide = false,
}: {
  withFirst?: boolean;
  nationwide?: boolean;
} = {}): SeichiMapAchievementTierDefinition[] => {
  const rarities =
    PERCENT_TIER_RARITIES[nationwide ? "nationwide" : "regional"];
  const tiers: Omit<SeichiMapAchievementTierDefinition, "level">[] = [
    ...(withFirst
      ? [
          {
            thresholdType: "COUNT" as const,
            thresholdValue: 1,
            rarity: "N" as const,
          },
        ]
      : []),
    ...[10, 25, 50, 75, 100].map((thresholdValue, index) => ({
      thresholdType: "PERCENT" as const,
      thresholdValue,
      rarity: rarities[index],
    })),
  ];
  return tiers.map((tier, index) => ({ ...tier, level: index + 1 }));
};

const azLocationLabel = (pattern: string): SeichiMapAchievementRule => ({
  layers: [SEICHI_MAP_LAYERS.azLocation],
  label: pattern,
});

const azLocationEpisode = (episode: number) =>
  azLocationLabel(`^#AZロケ *第${episode}弾(?![0-9])`);

type DefinitionInput = Omit<SeichiMapAchievementDefinition, "sortOrder">;

const definitions: DefinitionInput[] = [
  {
    id: "real-guess-first",
    nameJa: "初めてのリアルGuess",
    nameEn: "First Real Guess",
    descriptionJa: "聖地を1か所訪問する",
    descriptionEn: "Visit your first location",
    metric: "LOCATION_COUNT",
    criteria: [],
    denominatorOverride: null,
    tiers: count([1, "N"]),
  },
  {
    id: "real-guess-beginner",
    nameJa: "リアルGuessビギナー",
    nameEn: "Real Guess Beginner",
    descriptionJa: "訪問した聖地の数",
    descriptionEn: "Number of locations visited",
    metric: "LOCATION_COUNT",
    criteria: [],
    denominatorOverride: null,
    tiers: count([5, "N"], [10, "N"], [30, "R"]),
  },
  {
    id: "real-guess-veteran",
    nameJa: "ベテランGuessr",
    nameEn: "Veteran Guessr",
    descriptionJa: "訪問した聖地の数",
    descriptionEn: "Number of locations visited",
    metric: "LOCATION_COUNT",
    criteria: [],
    denominatorOverride: null,
    tiers: count([50, "R"], [70, "R"], [90, "R"]),
  },
  {
    id: "real-guess-pioneer",
    nameJa: "旅路の開拓者",
    nameEn: "Pioneer of the Journey",
    descriptionJa: "訪問した聖地の数",
    descriptionEn: "Number of locations visited",
    metric: "LOCATION_COUNT",
    criteria: [],
    denominatorOverride: null,
    tiers: count(
      [100, "R"],
      [150, "SR"],
      [200, "SR"],
      [300, "SSR"],
      [500, "SSR"],
      [1000, "UR"],
    ),
  },
  {
    id: "holomen-map-first",
    nameJa: "初めてのホロメンマップ",
    nameEn: "First hololive Member Map",
    descriptionJa: "「ホロメンマップ」の地点を1か所訪問する",
    descriptionEn: 'Visit a location in the "hololive member map" layer',
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.holomenMap] }],
    denominatorOverride: null,
    tiers: count([1, "N"]),
  },
  {
    id: "holomen-map-explorer",
    nameJa: "ホロメンマップの探訪者",
    nameEn: "hololive Member Map Explorer",
    descriptionJa: "「ホロメンマップ」の地点の訪問率",
    descriptionEn: 'Share of "hololive member map" locations visited',
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.holomenMap] }],
    denominatorOverride: null,
    tiers: progressTiers({ withFirst: false, nationwide: true }),
  },
  {
    id: "azloc-first",
    nameJa: "初めてのAZロケ",
    nameEn: "First AZ Location",
    descriptionJa: "#AZロケ・かなけん社員旅行の地点を1か所訪問する",
    descriptionEn: "Visit a #AZロケ or Kanaken trip location",
    metric: "LOCATION_COUNT",
    criteria: [azLocationLabel("^(#AZロケ|かなけん社員旅行)")],
    denominatorOverride: null,
    tiers: count([1, "N"]),
  },
  {
    id: "azloc-all",
    nameJa: "AZKi's location！",
    nameEn: "AZKi's location!",
    descriptionJa: "#AZロケ・かなけん社員旅行の地点の訪問率",
    descriptionEn: "Share of #AZロケ and Kanaken trip locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationLabel("^(#AZロケ|かなけん社員旅行)")],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "azloc-1",
    nameJa: "はじまりのAZロケ",
    nameEn: "Where AZ Location Began",
    descriptionJa: "#AZロケ 第1弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 1 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(1)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-2",
    nameJa: "ハンバーグの匂いに誘われて",
    nameEn: "Lured by the Smell of Hamburg Steak",
    descriptionJa: "#AZロケ 第2弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 2 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(2)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "kanaken-trip",
    nameJa: "かなけん社員No.4",
    nameEn: "Kanaken Employee No.4",
    descriptionJa: "かなけん社員旅行の地点の訪問率",
    descriptionEn: "Share of Kanaken trip locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationLabel("^かなけん社員旅行")],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-3",
    nameJa: "あずいろBESTIE DAYS",
    nameEn: "Azuiro BESTIE DAYS",
    descriptionJa: "#AZロケ 第3弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 3 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(3)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-4",
    nameJa: "北海道食べ尽くし開拓記！",
    nameEn: "Hokkaido Food Frontier!",
    descriptionJa: "#AZロケ 第4弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 4 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(4)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-5",
    nameJa: "かなあずの思い出",
    nameEn: "Memories of Kana-Azu",
    descriptionJa: "#AZロケ 第5弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 5 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(5)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-6",
    nameJa: "生活道路は30キロ！",
    nameEn: "30 km/h on Residential Roads!",
    descriptionJa: "#AZロケ 第6弾・一日小豆警察署長の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 6 and police chief locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(6), azLocationLabel("^一日小豆警察署長")],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azloc-7",
    nameJa: "伊豆の絶景癒やされ旅",
    nameEn: "Healing Trip to Scenic Izu",
    descriptionJa: "#AZロケ 第7弾の地点の訪問率",
    descriptionEn: "Share of #AZロケ part 7 locations visited",
    metric: "LOCATION_COUNT",
    criteria: [azLocationEpisode(7)],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "azki-music",
    nameJa: "AZKiの音楽と共に",
    nameEn: "With AZKi's Music",
    descriptionJa: "「Take me to Heaven」「Midnight Song」の地点の訪問率",
    descriptionEn: 'Share of "Take me to Heaven" and "Midnight Song" locations',
    metric: "LOCATION_COUNT",
    criteria: [azLocationLabel("^(Take me to Heaven|Midnight Song)")],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
  {
    id: "holomen-outing",
    nameJa: "ホロメンとお出かけ",
    nameEn: "Outing with hololive Members",
    descriptionJa: "「コラボ配信、ジモゲッサー」の地点の訪問率",
    descriptionEn: "Share of collab stream and Jimo-Guessr locations",
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.collabStream] }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "traffic-sister",
    nameJa: "交通のお姉さん",
    nameEn: "Traffic Big Sister",
    descriptionJa: "「鉄道・青看板・道路」の地点の訪問率",
    descriptionEn: "Share of railway, road sign and road locations",
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.traffic] }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "blue-sign",
    nameJa: "青看板はすべてを教えてくれる",
    nameEn: "Blue Signs Tell You Everything",
    descriptionJa: "地点名に「青看板」を含む地点の訪問率",
    descriptionEn: "Share of blue road sign locations visited",
    metric: "LOCATION_COUNT",
    criteria: [{ name: "青看板" }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "rail",
    nameJa: "鉄分補給",
    nameEn: "Iron Supplement",
    descriptionJa: "駅・鉄道関連の地点の訪問率",
    descriptionEn: "Share of station and railway locations visited",
    metric: "LOCATION_COUNT",
    criteria: [
      { baseName: "駅", exclude: "道の駅|なぎさの駅|駅前(店|ショップ)" },
      { layers: [SEICHI_MAP_LAYERS.traffic], label: "駅|鉄道" },
    ],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "guess-100",
    nameJa: "100Guess耐久！",
    nameEn: "100 Guess Endurance!",
    descriptionJa: "「2026年100Guess耐久」の地点の訪問率",
    descriptionEn: 'Share of "100 Guess endurance 2026" locations',
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.guess100] }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "oshidora",
    nameJa: "推しドラ収集家",
    nameEn: "Oshi Drive Collector",
    descriptionJa: "「AZKiナビ 推しドラご当地ボイス地点」の訪問率",
    descriptionEn: "Share of AZKi Navi local voice locations",
    metric: "LOCATION_COUNT",
    criteria: [{ layers: [SEICHI_MAP_LAYERS.azkiNavi] }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "prefectures",
    nameJa: "各都道府県Guessr ×47",
    nameEn: "Guessr of All 47 Prefectures",
    descriptionJa: "訪問した都道府県の数",
    descriptionEn: "Number of prefectures visited",
    metric: "PREFECTURE_COUNT",
    criteria: [{ region: "DOMESTIC" }],
    denominatorOverride: 47,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "overseas",
    nameJa: "Frontier Spirits",
    nameEn: "Frontier Spirits",
    descriptionJa: "国外の地点の訪問率",
    descriptionEn: "Share of overseas locations visited",
    metric: "LOCATION_COUNT",
    criteria: [{ region: "OVERSEAS" }],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "real-live",
    nameJa: "リアルLiVE",
    nameEn: "Real LiVE",
    descriptionJa: "ライブ・イベント会場の訪問率",
    descriptionEn: "Share of live and event venues visited",
    metric: "LOCATION_COUNT",
    criteria: [
      {
        layers: [
          SEICHI_MAP_LAYERS.liveArchive,
          SEICHI_MAP_LAYERS.upcomingEvents,
        ],
        exclude: "^[(](終了|掲載終了)[)]|ポスター撮影地",
      },
    ],
    denominatorOverride: null,
    tiers: progressTiers({ nationwide: true }),
  },
  {
    id: "collab-event",
    nameJa: "コラボイベント参加証",
    nameEn: "Collab Event Pass",
    descriptionJa: "終了したコラボ企画の地点の訪問率",
    descriptionEn: "Share of past collaboration event locations visited",
    metric: "LOCATION_COUNT",
    criteria: [
      {
        layers: [SEICHI_MAP_LAYERS.liveArchive],
        name: "^[(](終了|掲載終了)[)]|ポスター撮影地",
      },
    ],
    denominatorOverride: null,
    tiers: progressTiers(),
  },
];

export const SEICHI_MAP_ACHIEVEMENT_DEFAULTS: SeichiMapAchievementDefinition[] =
  definitions.map((definition, index) => ({
    ...definition,
    sortOrder: (index + 1) * 10,
  }));

const sqlString = (value: string | null) =>
  value === null ? "NULL" : `'${value.replace(/'/g, "''")}'`;

/**
 * 最初の migration（20261126000000）で投入した INSERT 文を作る。
 * 適用済みの migration と一致させるため、後から追加した rarity は含めない。
 * テストで migration.sql と一致することを確認する。
 */
export function toSeichiMapAchievementSeedSql(
  achievements: readonly SeichiMapAchievementDefinition[] = SEICHI_MAP_ACHIEVEMENT_DEFAULTS,
) {
  for (const achievement of achievements) {
    const json = JSON.stringify(achievement.criteria);
    if (json.includes("\\")) {
      throw new Error(
        `criteria must not contain backslashes: ${achievement.id}`,
      );
    }
  }
  const achievementRows = achievements.map((achievement) =>
    [
      sqlString(achievement.id),
      achievement.sortOrder,
      sqlString(achievement.nameJa),
      sqlString(achievement.nameEn),
      sqlString(achievement.descriptionJa),
      sqlString(achievement.descriptionEn),
      sqlString(achievement.metric),
      sqlString(JSON.stringify(achievement.criteria)),
      achievement.denominatorOverride ?? "NULL",
      "true",
      "CURRENT_TIMESTAMP(3)",
    ].join(", "),
  );
  const tierRows = achievements.flatMap((achievement) =>
    achievement.tiers.map((tier) =>
      [
        sqlString(achievement.id),
        tier.level,
        sqlString(tier.thresholdType),
        tier.thresholdValue,
      ].join(", "),
    ),
  );
  return [
    "-- SeedData",
    "INSERT INTO `SeichiMapAchievement` (`id`, `sortOrder`, `nameJa`, `nameEn`, `descriptionJa`, `descriptionEn`, `metric`, `criteria`, `denominatorOverride`, `isActive`, `updatedAt`) VALUES",
    achievementRows.map((row) => `  (${row})`).join(",\n") + ";",
    "",
    "INSERT INTO `SeichiMapAchievementTier` (`achievementId`, `level`, `thresholdType`, `thresholdValue`) VALUES",
    tierRows.map((row) => `  (${row})`).join(",\n") + ";",
    "",
  ].join("\n");
}

/**
 * 全グレードのレア度を現在の定義にそろえる UPDATE 文を作る。レア度ごとに1文にまとめる。
 * レア度を見直したときは、この出力で新しい migration を作る（適用済みの migration は書き換えない）。
 */
export function toSeichiMapAchievementRaritySeedSql(
  achievements: readonly SeichiMapAchievementDefinition[] = SEICHI_MAP_ACHIEVEMENT_DEFAULTS,
) {
  const statements = RARITY_ORDER.flatMap((rarity) => {
    const targets = achievements.flatMap((achievement) =>
      achievement.tiers
        .filter((tier) => tier.rarity === rarity)
        .map((tier) => `  (${sqlString(achievement.id)}, ${tier.level})`),
    );
    if (targets.length === 0) return [];
    return [
      [
        `UPDATE \`SeichiMapAchievementTier\` SET \`rarity\` = ${sqlString(rarity)}`,
        "WHERE (`achievementId`, `level`) IN (",
        targets.join(",\n"),
        ");",
      ].join("\n"),
    ];
  });
  return ["-- SeedData", ...statements, ""].join("\n\n");
}
