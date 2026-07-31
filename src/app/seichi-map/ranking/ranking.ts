export type RankingRow = {
  name: string;
  count: number;
};

export type RankedRow = RankingRow & {
  rank: number;
};

export function addCompetitionRanks<T extends RankingRow>(
  rows: T[],
): Array<T & { rank: number }> {
  let previousCount: number | null = null;
  let previousRank = 0;

  return rows.map((row, index) => {
    const rank =
      previousCount === row.count ? previousRank : Math.max(index + 1, 1);
    previousCount = row.count;
    previousRank = rank;
    return { ...row, rank };
  });
}
