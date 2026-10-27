import type { BestNineResults } from "./bestNineTopics";

export type BestNineChartType = "pie" | "bar" | "treemap";
export const BEST_NINE_CHART_LIMIT = 10;
const colors = [
  "pink.6",
  "cyan.7",
  "grape.6",
  "teal.7",
  "orange.7",
  "blue.6",
  "violet.6",
  "lime.8",
  "indigo.6",
  "red.7",
];
export const bestNineChartColor = (index: number) => colors[index] ?? "gray.6";

/** グラフを読み取れる項目数にまとめ、除外した曲の票も「その他」に含める。 */
export function buildBestNineChartData(
  rankings: BestNineResults["slots"][number]["rankings"],
  otherLabel: string,
) {
  const positive = rankings.filter((rank) => rank.count > 0);
  const data = positive.slice(0, BEST_NINE_CHART_LIMIT).map((rank, index) => ({
    key: rank.songKey,
    name: `${index + 1}. ${rank.title} / ${rank.artist}`,
    label: `${index + 1}. ${rank.title}`,
    value: rank.count,
    color: bestNineChartColor(index),
  }));
  const other = positive
    .slice(BEST_NINE_CHART_LIMIT)
    .reduce((sum, rank) => sum + rank.count, 0);
  if (other > 0)
    data.push({
      key: "other",
      name: otherLabel,
      label: otherLabel,
      value: other,
      color: "gray.6",
    });
  return data;
}
