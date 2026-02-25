"use client";

import useStatViewCount from "@/app/hook/useStatViewCount";
import { buildViewMilestoneInfo } from "@/app/lib/viewMilestone";
import { Skeleton } from "@mantine/core";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

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
  const { data: viewHistory, loading: viewHistoryLoading } =
    useStatViewCount(videoId);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // 元の日時 (ISO) を保持してソート／フィルタに使う
  const fullChartData = stats
    .map((s) => ({
      date: s.datetime ? new Date(s.datetime).toLocaleDateString() : "",
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

  // 期間絞り込み state
  const [period, setPeriod] = useState<"7d" | "30d" | "365d" | "all">("30d");

  // Y軸を0始まりにするかどうか（UIで切替）
  const [startFromZero, setStartFromZero] = useState<boolean>(true);

  const VALID_PERIODS = [
    { key: "7d", label: "7日" },
    { key: "30d", label: "30日" },
    { key: "365d", label: "365日" },
    { key: "all", label: "全期間" },
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

  const milestoneDisplay = useMemo(() => {
    if (chartData.length === 0) return null;

    const latestViewCount = chartData[chartData.length - 1]?.viewCount ?? 0;
    const milestone = buildViewMilestoneInfo(latestViewCount, stats);
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
      targetLabel: `${Math.floor(milestone.targetCount / 10000)}万再生達成`,
      achievedDateLabel: new Date(milestone.achievedAt).toLocaleDateString(),
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
      label: string;
      dateLabel: string;
    };
  }) => (
    <div className={`w-full h-64 ${containerClassName ?? ""}`}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm">{name}</div>
        <div className="text-sm">
          {(() => {
            const latest = data[data.length - 1] ?? null;
            if (!latest) return "";
            const headerDiffKey = diffKey ?? dataKey.replace(/Count$/, "Diff");
            const headerPctKey =
              pctKey ?? headerDiffKey.replace(/Diff$/, "PctDiff");
            const diff = (latest as any)[headerDiffKey] as number | 0;
            const pct = (latest as any)[headerPctKey] as number | null;
            if (
              (diff === null || diff === undefined) &&
              (pct === null || pct === undefined)
            )
              return "前日比: —";
            const sign =
              diff == null ? "" : diff > 0 ? "+" : diff < 0 ? "-" : "";
            const diffText =
              diff === null || diff === undefined
                ? "—"
                : `${sign}${formatNumber(Math.abs(diff))}`;
            return `前日差: ${diffText}`;
          })()}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 6, right: 12, left: 0, bottom: 6 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            allowDecimals={false}
            width={80}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => {
              return formatNumber(Number(v));
            }}
            tickMargin={8}
            // domain はキリの良い数字に丸める
            domain={(() => {
              const values = data.map((d: any) => Number(d[dataKey] ?? 0));
              // helper: compute nice step and extent
              const niceExtent = (vals: number[], startZero: boolean) => {
                if (!vals || vals.length === 0) return [0, 1];
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                if (startZero) {
                  if (max === 0) return [0, 1];
                  // compute step based on max
                  let range = max;
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
                  const mag = Math.pow(
                    10,
                    Math.floor(Math.log10(Math.abs(min))),
                  );
                  const step = mag;
                  return [Math.floor(min - step), Math.ceil(max + step)];
                }
                const range = max - min;
                let step = Math.pow(10, Math.floor(Math.log10(range)));
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

              const [nmin, nmax] = niceExtent(values, sfz);
              return [nmin, nmax];
            })()}
          />
          <Tooltip
            // カスタムツールチップ: 値と前日差分・前日比(%)を表示
            content={({ active, payload, label }: any) => {
              if (!active || !payload || !payload.length) return null;
              const value = payload[0].value as number;
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
                <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {formatNumber(value)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        diff === null
                          ? "#666"
                          : diff > 0
                            ? "#16a34a"
                            : diff < 0
                              ? "#dc2626"
                              : "#666",
                    }}
                  >
                    前日差: {diffText}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    前日比: {pctText}
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            dot={(props: any) => {
              if (!milestone || !props?.payload?.isoDate) {
                return false;
              }

              const isMilestonePoint = isSameLocalDate(
                props.payload.isoDate,
                milestone.isoDate,
              );

              if (!isMilestonePoint) {
                return false;
              }

              const bubbleWidth = 130;
              const bubbleHeight = 40;
              const isNearRightEdge = props.index >= data.length - 2;
              const isNearLeftEdge = props.index <= 1;
              const isNearTopEdge = props.cy <= bubbleHeight + 18;

              const bubbleX = isNearRightEdge
                ? props.cx - bubbleWidth - 12
                : isNearLeftEdge
                  ? props.cx + 12
                  : props.cx - bubbleWidth / 2;
              const bubbleCenterX = bubbleX + bubbleWidth / 2;
              const bubbleY = isNearTopEdge
                ? props.cy + 14
                : props.cy - bubbleHeight - 14;
              const pointerPath = isNearTopEdge
                ? `M ${props.cx - 6} ${bubbleY} L ${props.cx + 6} ${bubbleY} L ${props.cx} ${props.cy + 6} Z`
                : `M ${props.cx - 6} ${bubbleY + bubbleHeight} L ${props.cx + 6} ${bubbleY + bubbleHeight} L ${props.cx} ${props.cy - 6} Z`;
              const bubbleFill = isDarkMode ? "#1f2937" : "#ffffff";
              const bubbleText = isDarkMode ? "#f3f4f6" : "#111827";
              const bubbleSubText = isDarkMode ? "#d1d5db" : "#4b5563";
              const dotStroke = isDarkMode ? "#111827" : "#ffffff";

              return (
                <g>
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill={color}
                    stroke={dotStroke}
                    strokeWidth={2}
                  />
                  <rect
                    x={bubbleX}
                    y={bubbleY}
                    width={bubbleWidth}
                    height={bubbleHeight}
                    rx={8}
                    ry={8}
                    fill={bubbleFill}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <path
                    d={pointerPath}
                    fill={bubbleFill}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <text
                    x={bubbleCenterX}
                    y={bubbleY + 15}
                    textAnchor="middle"
                    fontSize={11}
                    fill={bubbleText}
                  >
                    {milestone.label}
                  </text>
                  <text
                    x={bubbleCenterX}
                    y={bubbleY + 30}
                    textAnchor="middle"
                    fontSize={10}
                    fill={bubbleSubText}
                  >
                    {milestone.dateLabel}
                  </text>
                </g>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 mt-4">統計</h2>
      <div className="text-sm text-gray-700 dark:text-gray-200 mb-4">
        毎日0:00～1:00(JST)ぐらいに更新
      </div>
      {milestoneDisplay && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-200">
          <ul className="list-disc list-inside">
            <li>
              {milestoneDisplay.targetLabel}（達成日:{" "}
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
            0から: {startFromZero ? "ON" : "OFF"}
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
              name="再生数"
              milestone={
                milestoneDisplay && milestoneDisplay.isInCurrentPeriod
                  ? {
                      isoDate: milestoneDisplay.isoDate,
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
              name="高評価数"
            />
            <MetricChart
              data={displayedChartData}
              dataKey="commentCount"
              diffKey="commentDiff"
              pctKey="commentPctDiff"
              startFromZero={startFromZero}
              color="#ff7f50"
              name="コメント"
            />
          </div>
        </div>
      )}
    </div>
  );
}
