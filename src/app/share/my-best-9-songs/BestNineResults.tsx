"use client";

import { ActionIcon, Button, Group, Table, Text, Tooltip } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BestNineResults as Results } from "@/app/lib/bestNineTopics";
import { formatDate } from "@/app/lib/formatDate";
import { HiArrowLeft, HiRefresh } from "react-icons/hi";
import { pageClasses } from "@/app/theme";
import styles from "./topics.module.css";
import { hasFixedSlots } from "@/app/lib/myBestNineSongs";
import { useState } from "react";
import BestNineResultsChart from "./BestNineResultsChart";
import BestNineResultsNavigation from "./BestNineResultsNavigation";
import {
  bestNineChartColor,
  type BestNineChartType,
} from "@/app/lib/bestNineChartData";

const formatStart = (start: string) => {
  const seconds = Math.max(0, Math.floor(Number(start) || 0));
  const parts = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  return parts
    .slice(parts[0] ? 0 : 1)
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

export function BestNineResultsHeader({
  data,
  onRefresh,
}: {
  data: Results | null;
  onRefresh?: () => void;
}) {
  const t = useTranslations("Share.myBest9.topics");
  const locale = useLocale();
  return (
    <div className={`${styles.header} ${styles.resultsWidth}`}>
      <div className={styles.heading}>
        <h1 className={pageClasses.heading}>
          {data ? data.topic.title : t("results")}
        </h1>
        <p className={styles.description}>
          {t(
            data && !hasFixedSlots(data.topic)
              ? "combinedResultsHelp"
              : "resultsHelp",
          )}
        </p>
        {data && (
          <Text className={styles.counts}>
            {t("responseCounts", {
              total: data.responseCount.toLocaleString(locale),
            })}
          </Text>
        )}
      </div>
      <Group gap="xs">
        <Button
          component={Link}
          href="/share/my-best-9-songs/topics"
          variant="subtle"
          color="gray"
          size="sm"
          leftSection={<HiArrowLeft size={16} />}
        >
          {t("backToTopics")}
        </Button>
        {data && (
          <>
            <Button
              component={Link}
              href={`/share/my-best-9-songs?topic=${data.topic.id}`}
              variant="default"
              size="sm"
            >
              {t("open")}
            </Button>
            {onRefresh && (
              <Tooltip label={t("refresh")}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  aria-label={t("refresh")}
                  onClick={onRefresh}
                >
                  <HiRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </>
        )}
      </Group>
    </div>
  );
}

export default function BestNineResults({ data }: { data: Results }) {
  const t = useTranslations("Share.myBest9.topics");
  const locale = useLocale();
  const fixedSlots = hasFixedSlots(data.topic);
  const [chartType, setChartType] = useState<BestNineChartType>("bar");
  const hasChart = data.slots.some((slot) =>
    slot.rankings.some((rank) => rank.count > 0),
  );
  const hasNavigation = data.slots.length > 1;
  return (
    <div
      className={`${styles.resultsWidth} ${styles.resultsLayout}`}
      data-chart={hasChart || undefined}
      data-navigation={hasNavigation || undefined}
    >
      {(hasNavigation || hasChart) && (
        <BestNineResultsNavigation
          slots={data.slots}
          fixedSlots={fixedSlots}
          hasChart={hasChart}
          chartType={chartType}
          onChartTypeChange={setChartType}
        />
      )}
      <div className={styles.resultsMain}>
        {data.responseCount === 0 && (
          <Text size="sm" c="dimmed" mb="lg">
            {t("noResponses")}
          </Text>
        )}
        {data.slots.map((slot) => {
          const maxVotes = Math.max(
            0,
            ...slot.rankings.map((rank) => rank.count),
          );
          return (
            <section
              key={slot.slot}
              id={`best-nine-section-${slot.slot}`}
              data-best-nine-section
              tabIndex={-1}
              className={styles.slot}
              aria-labelledby={`best-nine-slot-${slot.slot}`}
            >
              <div
                className={`${styles.slotBody} ${slot.rankings.some((rank) => rank.count > 0) ? "" : styles.noChart}`}
              >
                <div className={styles.chartColumn}>
                  <div className={styles.slotHeader}>
                    <h2
                      id={`best-nine-slot-${slot.slot}`}
                      data-best-nine-result-heading
                      className={styles.slotTitle}
                    >
                      {fixedSlots
                        ? `${slot.slot + 1}. ${slot.theme || t("freeSlot")}`
                        : t("combinedRanking")}
                    </h2>
                    <Text size="xs" c="dimmed">
                      {t(fixedSlots ? "slotCount" : "selectionCount", {
                        count: slot.answerCount,
                      })}
                    </Text>
                  </div>
                  <BestNineResultsChart
                    rankings={slot.rankings}
                    type={chartType}
                    label={
                      fixedSlots
                        ? `${slot.slot + 1}. ${slot.theme || t("freeSlot")}`
                        : t("combinedRanking")
                    }
                  />
                </div>
                <div className={styles.rankingColumn}>
                  {slot.rankings.length === 0 ? (
                    data.responseCount > 0 && (
                      <Text size="sm" c="dimmed">
                        {t("noResponses")}
                      </Text>
                    )
                  ) : (
                    <Table
                      className={styles.rankTable}
                      stickyHeader
                      stickyHeaderOffset="var(--best-nine-navigation-height, 0px)"
                      classNames={{ th: "table-header" }}
                      aria-label={
                        fixedSlots
                          ? t("slotRanking", { number: slot.slot + 1 })
                          : t("combinedRanking")
                      }
                    >
                      <colgroup>
                        <col style={{ width: 44 }} />
                        <col />
                        <col style={{ width: 80 }} />
                      </colgroup>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t("rank")}</Table.Th>
                          <Table.Th>{t("song")}</Table.Th>
                          <Table.Th className={styles.votes}>
                            {t("votes")}
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {slot.rankings.map((rank, index) => (
                          <Table.Tr key={rank.songKey}>
                            <Table.Td className={styles.rank}>
                              {index + 1}
                            </Table.Td>
                            <Table.Td>
                              <div className={styles.rankSummary}>
                                <span
                                  aria-hidden="true"
                                  className={styles.rankBar}
                                  style={{
                                    width: `${maxVotes > 0 ? Math.max(0, Math.min(100, (rank.count / maxVotes) * 100)) : 0}%`,
                                  }}
                                />
                                <div className={styles.rankIdentity}>
                                  {chartType !== "bar" && (
                                    <span
                                      className={styles.chartSwatch}
                                      aria-hidden="true"
                                      style={{
                                        backgroundColor: `var(--mantine-color-${bestNineChartColor(index).replace(".", "-")})`,
                                      }}
                                    />
                                  )}
                                  <Text
                                    component="span"
                                    size="sm"
                                    fw={600}
                                    className="break-words"
                                  >
                                    {rank.title}
                                  </Text>
                                  <Text
                                    component="span"
                                    size="xs"
                                    c="dimmed"
                                    className="break-words"
                                  >
                                    {rank.artist}
                                  </Text>
                                </div>
                              </div>
                              {rank.performances.length > 0 && (
                                <details className={styles.details}>
                                  <summary>
                                    {t("performanceDetails", {
                                      count: rank.performances.length,
                                    })}
                                  </summary>
                                  <ul className={styles.performances}>
                                    {rank.performances.map((performance) => (
                                      <li
                                        key={`${performance.videoId}:${performance.start}`}
                                        className={styles.performance}
                                      >
                                        <Link
                                          href={`/watch?v=${encodeURIComponent(performance.videoId)}&t=${encodeURIComponent(performance.start)}`}
                                          className={styles.performanceLink}
                                        >
                                          {performance.videoTitle ||
                                            t("openVideo")}{" "}
                                          <span
                                            className={styles.performanceMeta}
                                          >
                                            {performance.broadcastAt && (
                                              <>
                                                {formatDate(
                                                  performance.broadcastAt,
                                                  locale,
                                                  { timeZone: "Asia/Tokyo" },
                                                )}{" "}
                                                /{" "}
                                              </>
                                            )}
                                            {formatStart(performance.start)}
                                          </span>
                                        </Link>
                                        <span
                                          className={styles.performanceCount}
                                        >
                                          {t("performanceVotes", {
                                            count: performance.count,
                                          })}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </Table.Td>
                            <Table.Td className={styles.votes}>
                              {rank.count.toLocaleString(locale)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
