"use client";

import useStatViewCount from "@/app/hook/useStatViewCount";
import { buildLatestAchievedViewMilestoneInfo } from "@/app/lib/viewMilestone";
import { AreaChart, getFilteredChartTooltipPayload } from "@mantine/charts";
import { Paper, Skeleton, Text } from "@mantine/core";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../../lib/formatDate";

const DAY_MS = 24 * 60 * 60 * 1000;

const toDisplayedMilestoneDate = (date: string | Date) => {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return parsed;
  }
  // 集計日ベースの達成日は表示時に1日前へ補正する
  return new Date(parsed.getTime() - DAY_MS);
};

const isSameLocalDate = (left: string | Date, right: string | Date) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);
  if (isNaN(leftDate.getTime()) || isNaN(rightDate.getTime())) {
    return false;
  }
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
};

export default function ViewStat({ videoId }: { videoId: string }) {
  const t = useTranslations("Discography");
  const [period, setPeriod] = useState<"7d" | "30d" | "365d" | "all">("30d");
  const { data: viewHistory, loading: viewHistoryLoading } = useStatViewCount(
    videoId,
    period,
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Y軸を0始まりにするかどうか（UIで切替）
  const [startFromZero, setStartFromZero] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncDarkMode = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    syncDarkMode();

    const observer = new MutationObserver(syncDarkMode);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const stats = viewHistory?.statistics ?? [];
  const locale = useLocale();

  // 元の日時 (ISO) を保持してソート／フィルタに使う
  const fullChartData = stats
    .map((s) => ({
      date: s.datetime ? formatDate(s.datetime, locale) : "",
      isoDate: s.datetime ? new Date(s.datetime).toISOString() : null,
      viewCount: s.viewCount ?? 0,
      likeCount: s.likeCount ?? 0,
      commentCount: s.commentCount ?? 0,
    }))
    .sort(
      (a, b) =>
        new Date(a.isoDate ?? a.date).getTime() -
        new Date(b.isoDate ?? b.date).getTime(),
    );

  // 前日比（差分）を追加
  const chartData = fullChartData.map((item, idx) => {
    const prev = fullChartData[idx - 1] ?? null;
    return {
      ...item,
      viewDiff: prev ? item.viewCount - prev.viewCount : null,
      likeDiff: prev ? item.likeCount - prev.likeCount : null,
      commentDiff: prev ? item.commentCount - prev.commentCount : null,
      // 前日比（%）: パーセントで保持（例: 12.34）
      viewPctDiff:
        prev && prev.viewCount > 0
          ? ((item.viewCount - prev.viewCount) / prev.viewCount) * 100
          : null,
      likePctDiff:
        prev && prev.likeCount > 0
          ? ((item.likeCount - prev.likeCount) / prev.likeCount) * 100
          : null,
      commentPctDiff:
        prev && prev.commentCount > 0
          ? ((item.commentCount - prev.commentCount) / prev.commentCount) * 100
          : null,
    };
  });

  const VALID_PERIODS = [
    { key: "7d", label: t("stats.periods.7d") },
    { key: "30d", label: t("stats.periods.30d") },
    { key: "365d", label: t("stats.periods.365d") },
    { key: "all", label: t("stats.periods.all") },
  ] as const;

  const displayedChartData = useMemo(() => {
    if (period === "all") return chartData;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return chartData.filter((d) => {
      if (!d.isoDate) return false;
      return new Date(d.isoDate) >= cutoff;
    });
  }, [chartData, period]);

  const formatMilestoneLabel = (n: number, localeStr: string) => {
    if (!n || n <= 0) return "";
    // Japanese: show in 万 (10k) units -> 7万, 100万
    if (localeStr && localeStr.startsWith("ja")) {
      if (n >= 10000) {
        return `${Math.floor(n / 10000)}万再生達成`;
      }
      return `${n.toLocaleString()}再生達成`;
    }

    // English: use K/M short units: 70K, 1.2M
    if (n >= 1000000) {
      const m = (n / 1000000).toFixed(1).replace(/\.0$/, "");
      return `${m}M views reached`;
    }
    if (n >= 1000) {
      const k = Math.floor(n / 1000);
      return `${k}K views reached`;
    }
    return `${n.toLocaleString()} views reached`;
  };

  const milestoneDisplay = useMemo(() => {
    if (chartData.length === 0) return null;

    const latestViewCount = chartData[chartData.length - 1]?.viewCount ?? 0;
    const milestone = buildLatestAchievedViewMilestoneInfo(
      latestViewCount,
      stats,
    );
    if (
      !milestone ||
      milestone.status !== "achieved" ||
      !milestone.achievedAt
    ) {
      return null;
    }

    const achievedPoint = chartData.find((item) => {
      if (!item.isoDate) return false;
      return isSameLocalDate(item.isoDate, milestone.achievedAt as string);
    });

    if (!achievedPoint?.isoDate) {
      return null;
    }
    const achievedIsoDate = achievedPoint.isoDate;

    const isInCurrentPeriod = displayedChartData.some((item) => {
      if (!item.isoDate) return false;
      return isSameLocalDate(item.isoDate, achievedIsoDate);
    });

    return {
      targetLabel: formatMilestoneLabel(milestone.targetCount ?? 0, locale),
      achievedDateLabel: formatDate(
        toDisplayedMilestoneDate(milestone.achievedAt),
        locale,
      ),
      isoDate: achievedIsoDate,
      date: achievedPoint.date,
      viewCount: achievedPoint.viewCount,
      isInCurrentPeriod,
    };
  }, [chartData, displayedChartData, stats]);

  const formatNumber = (v: number | string | undefined | null) => {
    const n = Number(v ?? 0);
    return new Intl.NumberFormat().format(n);
  };

  const getNiceExtent = (
    vals: number[],
    startZero: boolean,
  ): [number, number] => {
    if (!vals || vals.length === 0) return [0, 1];

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    if (startZero) {
      if (max === 0) return [0, 1];

      const range = max;
      let step = Math.pow(10, Math.floor(Math.log10(range || 1)));
      const candidates = [1, 2, 5, 10];
      let found = false;
      for (let mult = 1; mult <= 1000000 && !found; mult *= 10) {
        for (const c of candidates) {
          const s = step * c * mult;
          const ticks = range / s;
          if (ticks <= 10) {
            step = s;
            found = true;
            break;
          }
        }
      }
      const niceMax = Math.ceil(max / step) * step;
      return [0, niceMax];
    }

    if (min === max) {
      if (min === 0) return [0, 1];
      const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(min))));
      const step = mag;
      return [Math.floor(min - step), Math.ceil(max + step)];
    }

    const range = max - min;
    const step = Math.pow(10, Math.floor(Math.log10(range)));
    const candidates = [1, 2, 5, 10];
    let chosen = step;
    for (let mult = 1; mult <= 1000000; mult *= 10) {
      let done = false;
      for (const c of candidates) {
        const s = step * c * mult;
        const ticks = range / s;
        if (ticks <= 10) {
          chosen = s;
          done = true;
          break;
        }
      }
      if (done) break;
    }
    const niceMin = Math.floor(min / chosen) * chosen;
    const niceMax = Math.ceil(max / chosen) * chosen;
    return [niceMin, niceMax];
  };

  const ChartSkeleton = () => (
    <div className="w-full h-64 rounded-md border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-baseline justify-between mb-3">
        <Skeleton height={14} width={80} radius="sm" />
        <Skeleton height={14} width={90} radius="sm" />
      </div>
      <Skeleton height={220} width="100%" radius="sm" />
    </div>
  );

  const MetricChart = ({
    data,
    dataKey,
    color,
    name,
    containerClassName = "",
    diffKey,
    pctKey,
    startFromZero: sfz = false,
    milestone,
  }: {
    data: typeof chartData;
    dataKey: string;
    color: string;
    name: string;
    containerClassName?: string;
    diffKey?: string;
    pctKey?: string;
    startFromZero?: boolean;
    milestone?: {
      isoDate: string;
      date: string;
      label: string;
      dateLabel: string;
    };
  }) => {
    const values = data.map((d: any) => Number(d[dataKey] ?? 0));
    const [nmin, nmax] = getNiceExtent(values, sfz);
    const xAxisTicks = (() => {
      if (data.length <= 2) {
        return data.map((d: any) => d.date);
      }

      const targetTickCount = 7;
      const tickCount = Math.min(targetTickCount, data.length);
      const indexSet = new Set<number>();

      for (let i = 0; i < tickCount; i += 1) {
        const idx = Math.round((i * (data.length - 1)) / (tickCount - 1));
        indexSet.add(idx);
      }

      return Array.from(indexSet)
        .sort((a, b) => a - b)
        .map((idx) => data[idx]?.date)
        .filter((d): d is string => Boolean(d));
    })();

    const chartStyle = {
      "--chart-text-color": isDarkMode ? "#d1d5db" : "#374151",
      "--chart-grid-color": isDarkMode
        ? "rgba(209, 213, 219, 0.25)"
        : "rgba(55, 65, 81, 0.2)",
    } as CSSProperties;
    const axisTickFill = isDarkMode ? "#d1d5db" : "#374151";

    return (
      <div className={`w-full h-64 ${containerClassName ?? ""}`}>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-sm">{name}</div>
          <div className="text-sm">
            {(() => {
              const latest = data[data.length - 1] ?? null;
              if (!latest) return "";
              const headerDiffKey =
                diffKey ?? dataKey.replace(/Count$/, "Diff");
              const headerPctKey =
                pctKey ?? headerDiffKey.replace(/Diff$/, "PctDiff");
              const diff = (latest as any)[headerDiffKey] as number | 0;
              const pct = (latest as any)[headerPctKey] as number | null;
              if (
                (diff === null || diff === undefined) &&
                (pct === null || pct === undefined)
              )
                return t("stats.yesterdayPctNone");
              const sign =
                diff == null ? "" : diff > 0 ? "+" : diff < 0 ? "-" : "";
              const diffText =
                diff === null || diff === undefined
                  ? (t("stats.yesterdayDiffNone") as string)
                  : `${sign}${formatNumber(Math.abs(diff))}`;
              return `${t("stats.yesterdayDiffLabel")} : ${diffText}`;
            })()}
          </div>
        </div>

        <AreaChart
          style={chartStyle}
          h={220}
          data={data}
          dataKey="date"
          curveType="monotone"
          strokeDasharray="3 3"
          series={[{ name: dataKey, label: name, color }]}
          valueFormatter={(value) => formatNumber(value)}
          fillOpacity={0.2}
          yAxisProps={{
            allowDecimals: false,
            width: 80,
            tick: { fontSize: 12, fill: axisTickFill },
            tickMargin: 8,
            domain: [nmin, nmax],
          }}
          xAxisProps={{
            tick: { fontSize: 12, fill: axisTickFill },
            ticks: xAxisTicks,
            interval: 0,
            padding: { left: 8, right: 24 },
          }}
          areaChartProps={{
            margin: { top: 6, right: 22, left: 2, bottom: 6 },
          }}
          referenceLines={
            milestone
              ? [
                  {
                    x: milestone.date,
                    label: milestone.label,
                    color,
                    strokeDasharray: "4 4",
                  },
                ]
              : undefined
          }
          tooltipProps={{
            content: ({ label, payload }: any) => {
              const filteredPayload = getFilteredChartTooltipPayload(payload);
              if (!filteredPayload || filteredPayload.length === 0) return null;

              const currentValue = Number(filteredPayload[0]?.value ?? 0);
              const idx = data.findIndex((d: any) => d.date === label);
              const diff =
                diffKey && idx >= 0 ? (data[idx] as any)[diffKey] : null;
              const pct =
                pctKey && idx >= 0 ? (data[idx] as any)[pctKey] : null;
              const sign =
                diff == null ? "" : diff > 0 ? "+" : diff < 0 ? "-" : "";
              const diffText =
                diff === null || diff === undefined
                  ? "—"
                  : `${sign}${formatNumber(Math.abs(diff))}`;
              const pctText =
                pct === null || pct === undefined
                  ? "—"
                  : `${sign}${Number(Math.abs(pct)).toFixed(2)}%`;

              return (
                <Paper px="sm" py="xs" withBorder shadow="sm">
                  <Text size="xs" c="dimmed" mb={4}>
                    {String(label ?? "")}
                  </Text>
                  <Text size="sm" fw={700}>
                    {formatNumber(currentValue)}
                  </Text>
                  <Text
                    size="xs"
                    c={
                      diff == null
                        ? "dimmed"
                        : diff > 0
                          ? "green"
                          : diff < 0
                            ? "red"
                            : "dimmed"
                    }
                  >
                    {t("stats.yesterdayDiffLabel")} : {diffText}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("stats.yesterdayPctLabel")} : {pctText}
                  </Text>
                </Paper>
              );
            },
          }}
        />
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 mt-4">{t("stats.title")}</h2>
      <div className="text-sm text-gray-700 dark:text-gray-200 mb-4">
        {t("stats.updatedNote")}
      </div>
      {milestoneDisplay && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-200">
          <ul className="list-disc list-inside">
            <li>
              {milestoneDisplay.targetLabel}（{t("stats.achievedOnLabel")}:{" "}
              {milestoneDisplay.achievedDateLabel}）
            </li>
          </ul>
        </div>
      )}
      {/** 期間切り替え */}
      <div className="mb-4 w-full">
        <div className="flex flex-wrap gap-2 justify-end">
          {VALID_PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as any)}
              aria-pressed={period === (p.key as any)}
              className={
                (period === (p.key as any)
                  ? "bg-primary-600 text-white"
                  : "bg-light-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-light-gray-200") +
                " px-3 py-1 rounded text-sm"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-end mt-2">
          <button
            onClick={() => setStartFromZero((s) => !s)}
            aria-pressed={startFromZero}
            className={
              (startFromZero
                ? "bg-primary-600 text-white"
                : "bg-light-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-light-gray-200") +
              " px-2 py-1 rounded text-sm"
            }
          >
            {t("stats.startFromZeroLabel", {
              state: startFromZero ? t("stats.stateOn") : t("stats.stateOff"),
            })}
          </button>
        </div>
      </div>
      {viewHistoryLoading ? (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <></>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <MetricChart
              data={displayedChartData}
              dataKey="viewCount"
              diffKey="viewDiff"
              pctKey="viewPctDiff"
              startFromZero={startFromZero}
              color="#8884d8"
              name={t("stats.metrics.viewCount")}
              milestone={
                milestoneDisplay && milestoneDisplay.isInCurrentPeriod
                  ? {
                      isoDate: milestoneDisplay.isoDate,
                      date: milestoneDisplay.date,
                      label: milestoneDisplay.targetLabel,
                      dateLabel: milestoneDisplay.achievedDateLabel,
                    }
                  : undefined
              }
            />
            <MetricChart
              data={displayedChartData}
              dataKey="likeCount"
              diffKey="likeDiff"
              pctKey="likePctDiff"
              startFromZero={startFromZero}
              color="#82ca9d"
              name={t("stats.metrics.likeCount")}
            />
            <MetricChart
              data={displayedChartData}
              dataKey="commentCount"
              diffKey="commentDiff"
              pctKey="commentPctDiff"
              startFromZero={startFromZero}
              color="#ff7f50"
              name={t("stats.metrics.commentCount")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
