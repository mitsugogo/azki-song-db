import type { useTranslations } from "next-intl";
import type {
  SeichiMapAchievementMetricName,
  SeichiMapAchievementTierDefinition,
  SeichiMapLocalizedText,
} from "../types/seichiMapAchievements";

type Translate = ReturnType<typeof useTranslations>;

export const pickSeichiMapLocalizedText = (
  value: SeichiMapLocalizedText,
  locale: string,
) => (locale === "en" && value.en ? value.en : value.ja);

/** グレードの表記（「10箇所」「25%」「全制覇」など）。SeichiMapAchievements 名前空間の t を渡す。 */
export const formatSeichiMapAchievementTier = (
  t: Translate,
  tier: Pick<
    SeichiMapAchievementTierDefinition,
    "thresholdType" | "thresholdValue"
  >,
  metric: SeichiMapAchievementMetricName = "LOCATION_COUNT",
) => {
  if (tier.thresholdType === "PERCENT") {
    return tier.thresholdValue >= 100
      ? t("tier.complete")
      : t("tier.percent", { value: tier.thresholdValue });
  }
  return metric === "PREFECTURE_COUNT"
    ? t("tier.prefectures", { count: tier.thresholdValue })
    : t("tier.locations", { count: tier.thresholdValue });
};

/** 取得率を「12.3%」の形にする。0.1%未満は「<0.1%」。 */
export const formatSeichiMapHolderRate = (rate: number) => {
  const percent = rate * 100;
  if (percent > 0 && percent < 0.1) return "<0.1%";
  return `${percent >= 10 ? Math.round(percent) : percent.toFixed(1)}%`;
};
