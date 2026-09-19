"use client";

import { Badge, Skeleton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { FaCrown } from "react-icons/fa6";
import { Link } from "@/i18n/navigation";
import useArchives from "@/app/hook/useArchives";
import useChannels from "@/app/hook/useChannels";
import {
  createChannelsByParticipantName,
  resolveArchiveParticipants,
} from "@/app/lib/archiveParticipants";
import { formatCompactActivityDuration } from "@/app/stream-archives/archiveActivity";
import {
  createArchiveCollaborationCombinationRanking,
  createArchiveCollaborationRanking,
} from "@/app/stream-archives/archiveCollaborationData";
import { isShortsArchive } from "@/app/stream-archives/archiveStats";
import { useUnitArchives } from "./useUnitArchives";

const CARD_CLASS_NAME =
  "card-glassmorphism border border-primary/10 p-4 shadow-none! dark:border-white/25 dark:shadow-none!";

const LINK_CARD_CLASS_NAME = `${CARD_CLASS_NAME} transition-colors hover:border-primary/30 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:border-pink-200/30 dark:hover:bg-pink-950/20`;

const normalizeParticipantName = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

const getRankingBadgeColor = (rank: number) => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#a8a9ad";
  if (rank === 3) return "#cd7f32";
  return "hololive.2";
};

export default function UnitStats({
  participants,
  unitName,
  unitSearchName,
  activityDays,
  legacyActivity,
  uniqueSongCount,
  performanceCount,
}: {
  participants: string[];
  unitName: string;
  unitSearchName: string;
  activityDays: number;
  legacyActivity?: { name: string; days: number };
  uniqueSongCount: number;
  performanceCount: number;
}) {
  const t = useTranslations("Units");
  const locale = useLocale();
  const { items: archives, isLoading } = useUnitArchives(participants);
  const { items: allArchives, isLoading: areAllArchivesLoading } =
    useArchives();
  const { channels, isLoading: areChannelsLoading } = useChannels();
  const format = (value: number) => new Intl.NumberFormat(locale).format(value);
  const collaborationRanking = useMemo(() => {
    const channelsByParticipantName = createChannelsByParticipantName(channels);
    const rankingItems = allArchives
      .filter((archive) => !isShortsArchive(archive))
      .map((archive) => ({
        ...archive,
        participantEntries: resolveArchiveParticipants(
          archive.participants ?? [],
          channelsByParticipantName,
        ),
      }));

    if (participants.length === 1) {
      return createArchiveCollaborationRanking(
        rankingItems,
        null,
        locale,
        Number.MAX_SAFE_INTEGER,
      );
    }

    const azkiParticipant = resolveArchiveParticipants(
      ["AZKi"],
      channelsByParticipantName,
    )[0];
    if (!azkiParticipant) return [];

    return createArchiveCollaborationCombinationRanking(
      rankingItems,
      null,
      locale,
      azkiParticipant,
      Number.MAX_SAFE_INTEGER,
    );
  }, [allArchives, channels, locale, participants]);
  const participantKeys = new Set(participants.map(normalizeParticipantName));
  const collaborationRankIndex = collaborationRanking.findIndex((item) => {
    if (item.castNames.length !== participantKeys.size) return false;
    return item.castNames.every((name) =>
      participantKeys.has(normalizeParticipantName(name)),
    );
  });
  const collaborationRank =
    collaborationRankIndex >= 0 ? collaborationRankIndex + 1 : null;
  const collaboration =
    collaborationRankIndex >= 0
      ? collaborationRanking[collaborationRankIndex]
      : null;
  const isCollaborationRankingLoading =
    areAllArchivesLoading || areChannelsLoading;
  const archiveSearchParams = new URLSearchParams();
  participants.forEach((participant) =>
    archiveSearchParams.append("cast", participant),
  );
  const archiveHref = `/stream-archives/list?${archiveSearchParams.toString()}`;
  const cards = [
    {
      value: t("statsDaysValue", { count: format(activityDays) }),
      sub: legacyActivity
        ? t("statsLegacyDaysSub", {
            name: legacyActivity.name,
            count: format(legacyActivity.days),
          })
        : undefined,
      label: t("statsDays"),
    },
    {
      value: isLoading ? null : format(archives.length),
      label: t("statsStreams"),
      href: archiveHref,
    },
    {
      value: isCollaborationRankingLoading ? null : (
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {formatCompactActivityDuration(
              collaboration?.totalDurationSeconds ?? 0,
            )}
          </span>
          {collaborationRank !== null && collaborationRank <= 10 ? (
            <Badge
              variant="filled"
              color={getRankingBadgeColor(collaborationRank)}
              autoContrast
              size="md"
              aria-label={t("statsStreamDurationRank", {
                rank: collaborationRank,
              })}
            >
              <span className="flex items-center gap-1 tabular-nums">
                {collaborationRank === 1 ? (
                  <FaCrown className="h-3.5 w-3.5" aria-hidden="true" />
                ) : null}
                {collaborationRank}
              </span>
            </Badge>
          ) : null}
        </span>
      ),
      label: t("statsStreamDuration"),
      href: archiveHref,
    },
    {
      value: format(uniqueSongCount),
      sub: t("statsPerformancesSub", { count: format(performanceCount) }),
      label: t("statsSongsTogether"),
      href: `/search?q=${encodeURIComponent(`unit:${unitSearchName}`)}`,
    },
  ];

  return (
    <section aria-labelledby="unit-stats-title" className="mt-8">
      <h2
        id="unit-stats-title"
        className="text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        {t("statsTitle", { name: unitName })}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const content = (
            <>
              {card.value === null ? (
                <Skeleton height={30} width={72} />
              ) : (
                <div className="text-2xl font-extrabold tabular-nums text-primary-700 dark:text-pink-200">
                  {card.value}
                </div>
              )}
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                {card.label}
              </p>
              {card.sub && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {card.sub}
                </p>
              )}
            </>
          );

          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className={LINK_CARD_CLASS_NAME}
            >
              {content}
            </Link>
          ) : (
            <article key={card.label} className={CARD_CLASS_NAME}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}
