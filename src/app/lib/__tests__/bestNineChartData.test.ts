import { describe, expect, it } from "vitest";
import { buildBestNineChartData } from "../bestNineChartData";

const rankings = Array.from({ length: 15 }, (_, index) => ({
  songKey: `song-${index}`,
  title: "同じ曲名",
  artist: `歌手${index}`,
  count: 15 - index,
  performances: [],
}));

describe("回答集計のグラフ用データ", () => {
  it("上位10曲とその他にまとめ、票数の合計を変えない", () => {
    const before = JSON.stringify(rankings);
    const data = buildBestNineChartData(rankings, "その他");
    expect(data).toHaveLength(11);
    expect(data.at(-1)).toMatchObject({ name: "その他", value: 15 });
    expect(data.reduce((sum, item) => sum + item.value, 0)).toBe(
      rankings.reduce((sum, rank) => sum + rank.count, 0),
    );
    expect(new Set(data.map((item) => item.name)).size).toBe(data.length);
    expect(data[0].name).toContain("歌手0");
    expect(data[1].name).toContain("歌手1");
    expect(JSON.stringify(rankings)).toBe(before);
  });
  it("少ない曲数は省略せず、0票や空データでは空のグラフになる", () => {
    expect(buildBestNineChartData(rankings.slice(0, 2), "その他")).toHaveLength(
      2,
    );
    expect(buildBestNineChartData([], "その他")).toEqual([]);
    expect(
      buildBestNineChartData([{ ...rankings[0], count: 0 }], "その他"),
    ).toEqual([]);
  });
});
