"use client";

import { useMemo } from "react";
import { BarChart, PieChart, Treemap } from "@mantine/charts";
import {
  getThemeColor,
  getContrastColor,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import type { TreemapNode } from "recharts";
import type { BestNineResults } from "@/app/lib/bestNineTopics";
import {
  buildBestNineChartData,
  BEST_NINE_CHART_LIMIT,
  type BestNineChartType,
} from "@/app/lib/bestNineChartData";
import styles from "./topics.module.css";

const shorten = (value: string, length: number) => {
  const characters = Array.from(value);
  return characters.length > length
    ? `${characters.slice(0, Math.max(1, length - 1)).join("")}…`
    : value;
};

export default function BestNineResultsChart({
  rankings,
  type,
  label,
}: {
  rankings: BestNineResults["slots"][number]["rankings"];
  type: BestNineChartType;
  label: string;
}) {
  const t = useTranslations("Share.myBest9.topics");
  const locale = useLocale();
  const theme = useMantineTheme();
  const otherLabel = t("otherSongs");
  const data = useMemo(
    () => buildBestNineChartData(rankings, otherLabel),
    [rankings, otherLabel],
  );
  const formatValue = (value: number) => value.toLocaleString(locale);
  if (!data.length) return null;
  return (
    <figure
      className={styles.chartFigure}
      aria-label={t("chartLabel", {
        topic: label,
        type: t(`chartTypes.${type}`),
      })}
    >
      <div className={styles.chartCanvas}>
        {type === "pie" ? (
          <PieChart
            data={data}
            size={360}
            withTooltip
            tooltipDataSource="segment"
            valueFormatter={formatValue}
            pieProps={{ isAnimationActive: false }}
          />
        ) : type === "bar" ? (
          <BarChart
            h={Math.max(260, data.length * 32 + 40)}
            data={data}
            dataKey="name"
            orientation="vertical"
            series={[{ name: "value", label: t("votes"), color: "pink.6" }]}
            yAxisProps={{
              width: 130,
              interval: 0,
              tickFormatter: (value: string) =>
                shorten(
                  data.find((item) => item.name === value)?.label ?? value,
                  10,
                ),
            }}
            xAxisProps={{ allowDecimals: false, domain: [0, "auto"] }}
            withBarValueLabel
            valueFormatter={formatValue}
            gridAxis="y"
            tickLine="none"
            barProps={{ isAnimationActive: false }}
            barChartProps={{ margin: { right: 40 } }}
          />
        ) : (
          <Treemap
            data={data}
            height={360}
            valueFormatter={formatValue}
            autoContrast
            treemapProps={{
              content: (node: TreemapNode) => {
                if (node.depth < 1) return <g />;
                const item = data.find((item) => item.name === node.name);
                return (
                  <g>
                    <title>
                      {node.name}: {formatValue(node.value)}
                    </title>
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      fill={getThemeColor(item?.color ?? "gray.6", theme)}
                      stroke="var(--mantine-color-body)"
                      strokeWidth={2}
                    />
                    {node.width > 50 && node.height > 34 && (
                      <text
                        x={node.x + 8}
                        y={node.y + 20}
                        fill={getContrastColor({
                          color: item?.color ?? "gray.6",
                          theme,
                          autoContrast: true,
                        })}
                        fontSize={12}
                      >
                        {shorten(
                          item?.label ?? node.name,
                          Math.floor((node.width - 16) / 12),
                        )}
                        {node.height > 52 && (
                          <tspan x={node.x + 8} dy={20}>
                            {formatValue(node.value)}
                          </tspan>
                        )}
                      </text>
                    )}
                  </g>
                );
              },
            }}
          />
        )}
      </div>
      {rankings.filter((rank) => rank.count > 0).length >
        BEST_NINE_CHART_LIMIT && (
        <Text component="figcaption" size="xs" c="dimmed" mt="sm">
          {t("chartGrouping", { count: BEST_NINE_CHART_LIMIT })}
        </Text>
      )}
    </figure>
  );
}
