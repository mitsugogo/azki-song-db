"use client";

import { Group, RingProgress, Stack, Text, Tooltip } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { FiAward, FiChevronRight } from "react-icons/fi";
import { SEICHI_MAP_RARITY_ORDER } from "../lib/seichiMapAchievementLevel";
import type {
  SeichiMapAchievementProfile,
  SeichiMapAchievementRarityName,
  SeichiMapAchievementTitle,
} from "../types/seichiMapAchievements";
import {
  formatSeichiMapAchievementTier,
  formatSeichiMapHolderRate,
  pickSeichiMapLocalizedText,
} from "./achievementText";
import classes from "./SeichiMapRarity.module.css";

export function SeichiMapRarityTag({
  rarity,
}: {
  rarity: SeichiMapAchievementRarityName;
}) {
  return (
    <span className={classes.tag} data-rarity={rarity}>
      {rarity}
    </span>
  );
}

/** 称号プレート。レア度に応じて枠と光り方が変わる。 */
export function SeichiMapTitlePlate({
  title,
}: {
  title: SeichiMapAchievementTitle;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  const name = pickSeichiMapLocalizedText(title.name, locale);
  const tier = formatSeichiMapAchievementTier(t, title, title.metric);
  return (
    <span
      className={classes.plate}
      data-rarity={title.rarity}
      title={
        title.holderRate !== null
          ? t("holderRate", {
              rate: formatSeichiMapHolderRate(title.holderRate),
            })
          : undefined
      }
    >
      <SeichiMapRarityTag rarity={title.rarity} />
      <span className={classes.plateName}>{name}</span>
      <span className={classes.plateTier}>{tier}</span>
    </span>
  );
}

export function SeichiMapLevelRing({
  profile,
  size = 44,
}: {
  profile: Pick<
    SeichiMapAchievementProfile,
    "level" | "currentLevelPoints" | "levelSpan"
  >;
  size?: number;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const percent =
    profile.levelSpan > 0
      ? Math.min(100, (profile.currentLevelPoints / profile.levelSpan) * 100)
      : 100;
  return (
    <RingProgress
      size={size}
      thickness={Math.max(3, Math.round(size / 11))}
      roundCaps
      sections={[{ value: percent, color: "pink.5" }]}
      rootColor="var(--mantine-color-default-border)"
      aria-label={t("levelProgress", {
        level: profile.level,
        current: profile.currentLevelPoints,
        span: profile.levelSpan,
      })}
      label={
        <Text
          ta="center"
          className={classes.levelNumber}
          style={{ fontSize: size >= 64 ? "1.4rem" : undefined }}
        >
          {profile.level}
        </Text>
      }
    />
  );
}

/**
 * ヘッダーに置くプレイヤーカード。レベル・称号・ポイントをひと目で見せ、
 * 押すとバッジ一覧を開く。
 */
export function SeichiMapPlayerCard({
  profile,
  onClick,
  label,
}: {
  profile: SeichiMapAchievementProfile;
  onClick: () => void;
  label: string;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  return (
    <button
      type="button"
      className={classes.card}
      onClick={onClick}
      aria-label={label}
    >
      <SeichiMapLevelRing profile={profile} />
      <span className={classes.cardBody}>
        {profile.title ? (
          <SeichiMapTitlePlate title={profile.title} />
        ) : (
          <Text size="xs" c="dimmed">
            {t("noTitle")}
          </Text>
        )}
        <span className={classes.cardMeta}>
          <FiAward size={12} aria-hidden="true" />
          <span className={classes.points}>
            {t("points", { points: profile.points.toLocaleString(locale) })}
          </span>
          <span>
            {t("earnedCount", {
              earned: profile.earnedCount,
              total: profile.totalCount,
            })}
          </span>
        </span>
      </span>
      <FiChevronRight
        size={16}
        className={classes.chevron}
        aria-hidden="true"
      />
    </button>
  );
}

/** バッジ一覧の上部に出す集計。 */
export function SeichiMapProfileSummary({
  profile,
  ownerName,
}: {
  profile: SeichiMapAchievementProfile;
  ownerName?: string | null;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  return (
    <Group gap="md" wrap="nowrap" align="center">
      <SeichiMapLevelRing profile={profile} size={72} />
      <Stack gap={6} style={{ minWidth: 0 }}>
        {ownerName ? (
          <Text fw={700} size="sm">
            {ownerName}
          </Text>
        ) : null}
        {profile.title ? (
          <SeichiMapTitlePlate title={profile.title} />
        ) : (
          <Text size="sm" c="dimmed">
            {t("noTitle")}
          </Text>
        )}
        <Text size="xs" c="dimmed">
          {t("levelDetail", {
            level: profile.level,
            points: profile.points.toLocaleString(locale),
            remaining: Math.max(
              0,
              profile.levelSpan - profile.currentLevelPoints,
            ).toLocaleString(locale),
          })}
          {" · "}
          {t("earnedCount", {
            earned: profile.earnedCount,
            total: profile.totalCount,
          })}
        </Text>
        <Group gap="sm">
          {[...SEICHI_MAP_RARITY_ORDER].reverse().map((rarity) => (
            <Tooltip key={rarity} label={t("rarityCount", { rarity })}>
              <span className={classes.rarityCount}>
                <SeichiMapRarityTag rarity={rarity} />
                {profile.rarityCounts[rarity]}
              </span>
            </Tooltip>
          ))}
        </Group>
      </Stack>
    </Group>
  );
}
