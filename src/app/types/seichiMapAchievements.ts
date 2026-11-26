export type SeichiMapAchievementMetricName =
  "LOCATION_COUNT" | "PREFECTURE_COUNT";
export type SeichiMapAchievementThresholdTypeName = "COUNT" | "PERCENT";
export type SeichiMapLocationRegionName = "DOMESTIC" | "OVERSEAS" | "UNKNOWN";
/** レア度。N < R < SR < SSR < UR の順に珍しい。 */
export type SeichiMapAchievementRarityName = "N" | "R" | "SR" | "SSR" | "UR";

/**
 * 対象地点を選ぶルール。文字列の条件は NFKC 正規化した値に対する正規表現。
 * - layers: レイヤー名（完全一致のいずれか）
 * - name: 地点名全体
 * - baseName: 末尾の（…）ラベルを除いた地点名
 * - label: 末尾の（…）ラベル
 * - exclude: 地点名全体に一致したら対象外
 * - region: 座標から判定した国内・国外
 */
export type SeichiMapAchievementRule = {
  layers?: string[];
  name?: string;
  baseName?: string;
  label?: string;
  exclude?: string;
  region?: "DOMESTIC" | "OVERSEAS";
};

export type SeichiMapAchievementTierDefinition = {
  level: number;
  thresholdType: SeichiMapAchievementThresholdTypeName;
  thresholdValue: number;
  rarity: SeichiMapAchievementRarityName;
};

export type SeichiMapAchievementDefinition = {
  id: string;
  sortOrder: number;
  nameJa: string;
  nameEn: string | null;
  descriptionJa: string | null;
  descriptionEn: string | null;
  metric: SeichiMapAchievementMetricName;
  criteria: SeichiMapAchievementRule[];
  denominatorOverride: number | null;
  tiers: SeichiMapAchievementTierDefinition[];
};

export type SeichiMapLocalizedText = { ja: string; en: string | null };

export type SeichiMapAchievementTierView =
  SeichiMapAchievementTierDefinition & {
    /** 現在の分母で必要な件数。分母が0で達成できない場合は null */
    requiredCount: number | null;
    achievedAt: string | null;
    /** バッジ判定の対象ユーザーのうち、このグレードを持つ人の割合（0〜1） */
    holderRate: number | null;
  };

export type SeichiMapAchievementView = {
  id: string;
  name: SeichiMapLocalizedText;
  description: SeichiMapLocalizedText | null;
  metric: SeichiMapAchievementMetricName;
  progressCount: number;
  denominator: number;
  tiers: SeichiMapAchievementTierView[];
};

export type SeichiMapUnlockedAchievement = {
  achievementId: string;
  name: SeichiMapLocalizedText;
  metric: SeichiMapAchievementMetricName;
  level: number;
  thresholdType: SeichiMapAchievementThresholdTypeName;
  thresholdValue: number;
  rarity: SeichiMapAchievementRarityName;
  source: "LIVE" | "BACKFILL";
};

/** 称号として表示するグレード */
export type SeichiMapAchievementTitle = {
  achievementId: string;
  name: SeichiMapLocalizedText;
  metric: SeichiMapAchievementMetricName;
  level: number;
  thresholdType: SeichiMapAchievementThresholdTypeName;
  thresholdValue: number;
  rarity: SeichiMapAchievementRarityName;
  holderRate: number | null;
};

/** プレイヤーカードに表示する集計 */
export type SeichiMapAchievementProfile = {
  points: number;
  level: number;
  currentLevelPoints: number;
  levelSpan: number;
  earnedCount: number;
  totalCount: number;
  rarityCounts: Record<SeichiMapAchievementRarityName, number>;
  title: SeichiMapAchievementTitle | null;
  /** 本人が称号を選んだか（false なら自動で選ばれた称号） */
  titleSelected: boolean;
};

/** ランキングに並べるレベルと称号 */
export type SeichiMapRankingBadge = {
  level: number;
  points: number;
  title: SeichiMapAchievementTitle | null;
};

export type SeichiMapAchievementsResponse = {
  ready: boolean;
  profile: SeichiMapAchievementProfile | null;
  items: SeichiMapAchievementView[];
  unseen: SeichiMapUnlockedAchievement[];
};

export type SeichiMapTitleSelection = {
  achievementId: string;
  level: number;
} | null;

export type SeichiMapAchievementSyncPreview = {
  locationCount: number;
  geocodePendingCount: number;
  syncedAt: string | null;
  kmlChanged: boolean;
  achievements: {
    id: string;
    name: string;
    denominator: number;
    /** 同じ件数で同時に達成になるグレードの組 */
    overlappingLevels: number[][];
  }[];
};

export type SeichiMapAchievementErrorCode =
  | "forbidden"
  | "invalid_request"
  | "conflict"
  | "kml_unavailable"
  | "invalid_kml"
  | "invalid_master"
  | "storage_failed";
