import type { LivePerformance, LiveSetlistEntry } from "@/app/types/live";

export type LiveComparisonRow = {
  entries: (LiveSetlistEntry | null)[];
  kind: "same" | "variant" | "addition";
};

export type LiveSongFrequency = {
  title: string;
  count: number;
};

const songKey = (title: string) =>
  title.normalize("NFKC").trim().toLocaleLowerCase("ja");

const alignmentScore = (
  row: (LiveSetlistEntry | null)[],
  entry: LiveSetlistEntry,
) =>
  row.some(
    (previous) => previous && songKey(previous.title) === songKey(entry.title),
  )
    ? 4
    : -1;

const appendPerformance = (
  rows: (LiveSetlistEntry | null)[][],
  setlist: LiveSetlistEntry[],
  previousCount: number,
) => {
  const scores = Array.from({ length: rows.length + 1 }, () =>
    Array<number>(setlist.length + 1).fill(0),
  );
  const directions = Array.from({ length: rows.length + 1 }, () =>
    Array<"diagonal" | "up" | "left">(setlist.length + 1).fill("diagonal"),
  );

  for (let i = 1; i <= rows.length; i++) {
    scores[i][0] = scores[i - 1][0] - 2;
    directions[i][0] = "up";
  }
  for (let j = 1; j <= setlist.length; j++) {
    scores[0][j] = scores[0][j - 1] - 2;
    directions[0][j] = "left";
  }
  for (let i = 1; i <= rows.length; i++) {
    for (let j = 1; j <= setlist.length; j++) {
      const diagonal =
        scores[i - 1][j - 1] + alignmentScore(rows[i - 1], setlist[j - 1]);
      const up = scores[i - 1][j] - 2;
      const left = scores[i][j - 1] - 2;
      scores[i][j] = Math.max(diagonal, up, left);
      directions[i][j] =
        diagonal >= up && diagonal >= left
          ? "diagonal"
          : up >= left
            ? "up"
            : "left";
    }
  }

  const aligned: (LiveSetlistEntry | null)[][] = [];
  let i = rows.length;
  let j = setlist.length;
  while (i > 0 || j > 0) {
    const direction = directions[i][j];
    if (i > 0 && j > 0 && direction === "diagonal") {
      aligned.push([...rows[i - 1], setlist[j - 1]]);
      i--;
      j--;
    } else if (i > 0 && (j === 0 || direction === "up")) {
      aligned.push([...rows[i - 1], null]);
      i--;
    } else {
      aligned.push([...Array<null>(previousCount).fill(null), setlist[j - 1]]);
      j--;
    }
  }
  return aligned.reverse();
};

export const buildLiveComparisonRows = (
  performances: LivePerformance[],
): LiveComparisonRow[] => {
  if (performances.length === 0) return [];
  let rows: (LiveSetlistEntry | null)[][] = performances[0].setlist.map(
    (entry) => [entry],
  );
  performances.slice(1).forEach((performance, index) => {
    rows = appendPerformance(rows, performance.setlist, index + 1);
  });

  return rows.map((entries) => {
    const present = entries.filter((entry) => entry !== null);
    const distinctSongs = new Set(present.map((entry) => songKey(entry.title)));
    return {
      entries,
      kind:
        distinctSongs.size > 1
          ? "variant"
          : present.length < performances.length
            ? "addition"
            : "same",
    };
  });
};

export const countLiveSongsByPerformance = (
  performances: LivePerformance[],
): LiveSongFrequency[] => {
  const songs = new Map<string, LiveSongFrequency>();
  performances.forEach((performance) => {
    const seen = new Set<string>();
    performance.setlist.forEach((entry) => {
      const key = songKey(entry.title);
      if (seen.has(key)) return;
      seen.add(key);
      const existing = songs.get(key);
      songs.set(key, {
        title: existing?.title ?? entry.title,
        count: (existing?.count ?? 0) + 1,
      });
    });
  });
  return [...songs.values()].sort(
    (a, b) => b.count - a.count || a.title.localeCompare(b.title, "ja"),
  );
};
