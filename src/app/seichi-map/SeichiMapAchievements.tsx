"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Progress,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useLocale, useTranslations } from "next-intl";
import { FiAward, FiMapPin } from "react-icons/fi";
import type {
  SeichiMapAchievementRarityName,
  SeichiMapAchievementsResponse,
  SeichiMapAchievementTierView,
  SeichiMapAchievementTitle,
  SeichiMapAchievementView,
  SeichiMapTitleSelection,
  SeichiMapUnlockedAchievement,
} from "../types/seichiMapAchievements";
import {
  formatSeichiMapAchievementTier,
  formatSeichiMapHolderRate,
  pickSeichiMapLocalizedText,
} from "./achievementText";
import {
  SeichiMapProfileSummary,
  SeichiMapRarityTag,
} from "./SeichiMapPlayerCard";
import classes from "./SeichiMapRarity.module.css";
import {
  filterSeichiMapAchievements,
  pickNextSeichiMapTargets,
  type SeichiMapAchievementFilter,
  type SeichiMapNextTarget,
} from "./achievementTargets";

export {
  formatSeichiMapAchievementTier,
  pickSeichiMapLocalizedText,
} from "./achievementText";

const MAX_INDIVIDUAL_TOASTS = 3;

const RARITY_TOAST_COLORS: Record<SeichiMapAchievementRarityName, string> = {
  N: "gray",
  R: "blue",
  SR: "grape",
  SSR: "yellow",
  UR: "pink",
};

type Translate = ReturnType<typeof useTranslations>;

const markSeen = () =>
  fetch("/api/seichi-map/achievements/seen", { method: "POST" }).catch(
    (error) => console.error(error),
  );

/** 新しく獲得したバッジをトーストで知らせる。多い場合はまとめて表示する。 */
export function notifySeichiMapAchievementsUnlocked(
  unlocked: readonly SeichiMapUnlockedAchievement[],
  t: Translate,
  locale: string,
) {
  if (unlocked.length === 0) return;
  const toLabel = (item: SeichiMapUnlockedAchievement) =>
    t("toast.item", {
      rarity: item.rarity,
      name: pickSeichiMapLocalizedText(item.name, locale),
      tier: formatSeichiMapAchievementTier(t, item, item.metric),
    });
  // レアなものから知らせる
  const ordered = [...unlocked].sort(
    (a, b) =>
      ["N", "R", "SR", "SSR", "UR"].indexOf(b.rarity) -
      ["N", "R", "SR", "SSR", "UR"].indexOf(a.rarity),
  );
  const individual =
    ordered.length <= MAX_INDIVIDUAL_TOASTS
      ? ordered
      : ordered.slice(0, MAX_INDIVIDUAL_TOASTS - 1);
  for (const item of individual) {
    notifications.show({
      title: t("toast.unlockedTitle"),
      message: toLabel(item),
      color: RARITY_TOAST_COLORS[item.rarity],
      icon: <FiAward size={18} />,
      autoClose: item.rarity === "UR" || item.rarity === "SSR" ? 9000 : 6000,
    });
  }
  if (individual.length < ordered.length) {
    notifications.show({
      title: t("toast.unlockedTitle"),
      message: t("toast.more", { count: ordered.length - individual.length }),
      color: "pink",
      icon: <FiAward size={18} />,
      autoClose: 6000,
    });
  }
}

/**
 * バッジ状況を取得する。shareId があれば共有マップの持ち主（閲覧専用）、
 * 無ければログイン中の本人。本人の初回取得で未通知の獲得分があれば
 * まとめて1回だけ知らせ、通知済みにする。
 */
export function useSeichiMapAchievements({
  enabled,
  shareId = null,
}: {
  enabled: boolean;
  shareId?: string | null;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  const [data, setData] = useState<SeichiMapAchievementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [titleUpdating, setTitleUpdating] = useState(false);
  const announcedRef = useRef(false);
  // 翻訳関数が描画ごとに変わっても一覧を取り直さないよう、参照経由で使う。
  const textRef = useRef({ t, locale });
  useEffect(() => {
    textRef.current = { t, locale };
  });
  const isOwn = !shareId;

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        shareId
          ? `/api/seichi-map/share/${encodeURIComponent(shareId)}/achievements`
          : "/api/seichi-map/achievements",
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(`status ${response.status}`);
      const payload = (await response.json()) as SeichiMapAchievementsResponse;
      setData(payload);
      return payload;
    } catch (fetchError) {
      console.error(fetchError);
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, shareId]);

  useEffect(() => {
    setData(null);
    if (!enabled) return;
    void refresh().then((payload) => {
      if (
        !isOwn ||
        !payload ||
        announcedRef.current ||
        payload.unseen.length === 0
      ) {
        return;
      }
      announcedRef.current = true;
      const { t, locale } = textRef.current;
      const backfill = payload.unseen.filter(
        (item) => item.source === "BACKFILL",
      );
      if (backfill.length > 0) {
        notifications.show({
          title: t("toast.summaryTitle"),
          message: t("toast.summary", { count: payload.unseen.length }),
          color: "pink",
          icon: <FiAward size={18} />,
          autoClose: 10000,
        });
      } else {
        notifySeichiMapAchievementsUnlocked(payload.unseen, t, locale);
      }
      void markSeen();
    });
  }, [enabled, isOwn, refresh]);

  /** 訪問の保存結果に含まれる獲得分を知らせ、一覧を取り直す。 */
  const handleUnlocked = useCallback(
    (unlocked: readonly SeichiMapUnlockedAchievement[] | undefined) => {
      if (!isOwn || !unlocked || unlocked.length === 0) return;
      const { t, locale } = textRef.current;
      notifySeichiMapAchievementsUnlocked(unlocked, t, locale);
      void markSeen();
      void refresh();
    },
    [isOwn, refresh],
  );

  /** 表示する称号を変える。null で自動選択に戻す。 */
  const updateTitle = useCallback(
    async (selection: SeichiMapTitleSelection) => {
      if (!isOwn) return false;
      setTitleUpdating(true);
      try {
        const response = await fetch("/api/seichi-map/achievements/title", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selection ?? { achievementId: null }),
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        await refresh();
        return true;
      } catch (updateError) {
        console.error(updateError);
        notifications.show({
          color: "red",
          message: textRef.current.t("errors.titleFailed"),
        });
        return false;
      } finally {
        setTitleUpdating(false);
      }
    },
    [isOwn, refresh],
  );

  return {
    data,
    loading,
    error,
    refresh,
    handleUnlocked,
    updateTitle,
    titleUpdating,
  };
}

const getNextRequiredCount = (achievement: SeichiMapAchievementView) =>
  achievement.tiers.find(
    (tier) =>
      tier.requiredCount !== null &&
      !tier.achievedAt &&
      tier.requiredCount > achievement.progressCount,
  )?.requiredCount ?? null;

const isEquipped = (
  title: SeichiMapAchievementTitle | null | undefined,
  achievementId: string,
  level: number,
) => title?.achievementId === achievementId && title.level === level;

function TierChip({
  achievement,
  tier,
  equipped,
  selectable,
  disabled,
  onSelect,
}: {
  achievement: SeichiMapAchievementView;
  tier: SeichiMapAchievementTierView;
  equipped: boolean;
  selectable: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  const label = formatSeichiMapAchievementTier(t, tier, achievement.metric);
  const details = [
    tier.achievedAt
      ? t("achievedAt", {
          date: new Date(tier.achievedAt).toLocaleDateString(locale),
        })
      : tier.requiredCount !== null
        ? t("requiredCount", { count: tier.requiredCount })
        : null,
    tier.holderRate !== null
      ? t("holderRate", { rate: formatSeichiMapHolderRate(tier.holderRate) })
      : null,
    selectable ? (equipped ? t("equipped") : t("equipHint")) : null,
  ].filter(Boolean);
  const content = (
    <>
      <SeichiMapRarityTag rarity={tier.rarity} />
      {label}
      {equipped ? <span aria-hidden="true">★</span> : null}
    </>
  );
  const common = {
    className: classes.tierChip,
    "data-rarity": tier.rarity,
    "data-achieved": String(Boolean(tier.achievedAt)),
    "data-equipped": String(equipped),
    title: details.join(" / "),
  };
  return selectable ? (
    <button
      type="button"
      {...common}
      data-selectable="true"
      disabled={disabled}
      aria-pressed={equipped}
      aria-label={`${pickSeichiMapLocalizedText(achievement.name, locale)} ${label} (${tier.rarity})`}
      onClick={onSelect}
    >
      {content}
    </button>
  ) : (
    <span {...common}>{content}</span>
  );
}

function AchievementCard({
  achievement,
  equippedTitle,
  titleSelected,
  editable,
  titleUpdating,
  onSelectTitle,
  onFilterMap,
}: {
  achievement: SeichiMapAchievementView;
  equippedTitle: SeichiMapAchievementTitle | null | undefined;
  titleSelected: boolean;
  editable: boolean;
  titleUpdating: boolean;
  onSelectTitle?: (selection: SeichiMapTitleSelection) => void;
  /** 達成条件の対象地点で地図・一覧を絞り込む */
  onFilterMap?: (achievement: SeichiMapAchievementView) => void;
}) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  const preparing = achievement.denominator === 0;
  const nextRequired = getNextRequiredCount(achievement);
  const achievedCount = achievement.tiers.filter(
    (tier) => tier.achievedAt,
  ).length;
  const progressValue = nextRequired
    ? Math.min(100, (achievement.progressCount / nextRequired) * 100)
    : 100;

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={6} wrap="nowrap">
            <FiAward
              size={18}
              aria-hidden="true"
              color={
                achievedCount > 0
                  ? "var(--mantine-color-pink-6)"
                  : "var(--mantine-color-gray-5)"
              }
            />
            <Text fw={700} size="sm">
              {pickSeichiMapLocalizedText(achievement.name, locale)}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            {preparing
              ? t("preparing")
              : achievement.metric === "PREFECTURE_COUNT"
                ? t("progress.prefectures", {
                    count: achievement.progressCount,
                    total: achievement.denominator,
                  })
                : t("progress.locations", {
                    count: achievement.progressCount,
                    total: achievement.denominator,
                  })}
          </Text>
        </Group>
        {achievement.description ? (
          <Text size="xs" c="dimmed">
            {pickSeichiMapLocalizedText(achievement.description, locale)}
          </Text>
        ) : null}
        {!preparing ? (
          <Progress
            value={progressValue}
            size="sm"
            color="pink"
            aria-label={t("progressLabel")}
          />
        ) : null}
        {!preparing && !achievement.targetsAll && onFilterMap ? (
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            w="fit-content"
            leftSection={<FiMapPin size={12} />}
            aria-label={t("filterMapLabel", {
              name: pickSeichiMapLocalizedText(achievement.name, locale),
            })}
            onClick={() => onFilterMap(achievement)}
          >
            {t("filterMap")}
          </Button>
        ) : null}
        <Group gap={6}>
          {achievement.tiers.map((tier) => {
            const equipped = isEquipped(
              equippedTitle,
              achievement.id,
              tier.level,
            );
            return (
              <TierChip
                key={tier.level}
                achievement={achievement}
                tier={tier}
                equipped={equipped}
                selectable={editable && Boolean(tier.achievedAt)}
                disabled={titleUpdating}
                onSelect={() =>
                  onSelectTitle?.(
                    // 自分で選んだ称号をもう一度押すと自動選択に戻す
                    equipped && titleSelected
                      ? null
                      : { achievementId: achievement.id, level: tier.level },
                  )
                }
              />
            );
          })}
        </Group>
      </Stack>
    </Paper>
  );
}

/** あと少しで獲得できるバッジ。次に何を狙えばよいかを最上部で示す */
function NextTargets({ targets }: { targets: SeichiMapNextTarget[] }) {
  const t = useTranslations("SeichiMapAchievements");
  const locale = useLocale();
  if (targets.length === 0) return null;

  return (
    <Stack gap="xs" aria-label={t("nextTargets.title")} role="region">
      <Text fw={700} size="sm">
        {t("nextTargets.title")}
      </Text>
      {targets.map(({ achievement, tier, remaining, ratio }) => (
        <Paper key={achievement.id} withBorder radius="md" p="xs">
          <Stack gap={4}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                <SeichiMapRarityTag rarity={tier.rarity} />
                <Text size="sm" fw={600} lineClamp={1}>
                  {pickSeichiMapLocalizedText(achievement.name, locale)}
                  {" · "}
                  {formatSeichiMapAchievementTier(t, tier, achievement.metric)}
                </Text>
              </Group>
              <Text
                size="xs"
                c="pink"
                fw={700}
                style={{ whiteSpace: "nowrap" }}
              >
                {achievement.metric === "PREFECTURE_COUNT"
                  ? t("nextTargets.remainingPrefectures", { count: remaining })
                  : t("nextTargets.remainingLocations", { count: remaining })}
              </Text>
            </Group>
            <Progress
              value={ratio * 100}
              size="sm"
              color="pink"
              aria-label={t("progressLabel")}
            />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

type ModalProps = {
  opened: boolean;
  onClose: () => void;
  data: SeichiMapAchievementsResponse | null;
  loading: boolean;
  error: boolean;
  /** 本人のバッジなら称号を選べる */
  editable?: boolean;
  /** 共有マップで表示するときの持ち主の名前 */
  ownerName?: string | null;
  titleUpdating?: boolean;
  onSelectTitle?: (selection: SeichiMapTitleSelection) => void;
  /** 渡すと、各バッジに「地図で絞り込む」を出す */
  onFilterMap?: (achievement: SeichiMapAchievementView) => void;
};

export function SeichiMapAchievementsModal({
  opened,
  onClose,
  data,
  loading,
  error,
  editable = false,
  ownerName = null,
  titleUpdating = false,
  onSelectTitle,
  onFilterMap,
}: ModalProps) {
  const t = useTranslations("SeichiMapAchievements");
  const profile = data?.profile ?? null;
  const isSmallScreen = useMediaQuery("(max-width: 48em)");
  const [filter, setFilter] = useState<SeichiMapAchievementFilter>("all");
  const items = data?.items ?? [];
  // 次に狙えるバッジは自分のマップでだけ出す（共有マップでは持ち主の進捗を見るだけ）
  const nextTargets = editable ? pickNextSeichiMapTargets(items, 3) : [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={ownerName ? t("titleOf", { name: ownerName }) : t("title")}
      size="lg"
      fullScreen={Boolean(isSmallScreen)}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="sm">
        {error ? (
          <Alert color="red" role="alert">
            {t("errors.loadFailed")}
          </Alert>
        ) : null}
        {loading && !data ? (
          <Center py="lg">
            <Loader size="sm" />
          </Center>
        ) : null}
        {data && !data.ready ? (
          <Text size="sm" c="dimmed">
            {t("notReady")}
          </Text>
        ) : null}
        {data?.ready && profile ? (
          <>
            <SeichiMapProfileSummary profile={profile} />
            {editable ? (
              <Group gap="xs" justify="space-between" wrap="wrap">
                <Text size="xs" c="dimmed">
                  {profile.titleSelected
                    ? t("titleSelectedHint")
                    : t("titleAutoHint")}
                </Text>
                {profile.titleSelected ? (
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    disabled={titleUpdating}
                    onClick={() => onSelectTitle?.(null)}
                  >
                    {t("resetTitle")}
                  </Button>
                ) : null}
              </Group>
            ) : null}
            <NextTargets targets={nextTargets} />
            <SegmentedControl
              size="xs"
              fullWidth
              value={filter}
              onChange={(value) =>
                setFilter(value as SeichiMapAchievementFilter)
              }
              aria-label={t("filter.label")}
              data={[
                { label: t("filter.all"), value: "all" },
                { label: t("filter.earned"), value: "earned" },
                { label: t("filter.unearned"), value: "unearned" },
              ]}
            />
            <Divider />
            {filterSeichiMapAchievements(data.items, filter).map(
              (achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  equippedTitle={profile.title}
                  titleSelected={profile.titleSelected}
                  editable={editable}
                  titleUpdating={titleUpdating}
                  onSelectTitle={onSelectTitle}
                  onFilterMap={onFilterMap}
                />
              ),
            )}
          </>
        ) : null}
      </Stack>
    </Modal>
  );
}
