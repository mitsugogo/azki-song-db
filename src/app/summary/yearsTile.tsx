"use client";

import Link from "next/link";
import { Song } from "../types/song";
import { useLoading } from "../context/LoadingContext";

export default function YearsTile({ songs }: { songs: Song[] }) {
  const { setLoading } = useLoading();
  const counts = songs.reduce<Record<number, number>>((acc, s) => {
    const y = Number(s.year);
    if (!Number.isNaN(y)) acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});

  const years = Object.keys(counts)
    .map((k) => Number(k))
    .sort((a, b) => b - a);
  const milestonesByYear = songs
    .sort(
      (a, b) =>
        new Date(a.broadcast_at).getTime() - new Date(b.broadcast_at).getTime(),
    )
    .reduce<Record<number, { broadcast_at: string; milestones: string[] }[]>>(
      (acc, song) => {
        const year = Number(song.year);
        if (Number.isNaN(year)) return acc;
        if (!acc[year]) acc[year] = [];
        if (!song.milestones || song.milestones.length === 0) return acc;
        if (
          acc[year].some((entry) =>
            entry.milestones.includes(song.milestones[0]),
          )
        )
          return acc;
        acc[year].push({
          broadcast_at: song.broadcast_at,
          milestones: song.milestones || [],
        });
        return acc;
      },
      {},
    );

  const yearNodes = years.flatMap((year) => {
    return (
      <li
        key={year}
        className="border rounded hover:shadow-md transition-shadow duration-150"
      >
        <Link
          href={`/summary/${year}`}
          className="block p-3 h-full dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-gray-600"
          onClick={() => setLoading(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{year}年</span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1">
              {counts[year]}曲
            </span>
          </div>
          <div>
            {milestonesByYear[year] && (
              <ul className="mt-2 space-y-1">
                {milestonesByYear[year]
                  .flat()
                  .map(
                    (
                      s: { broadcast_at: string; milestones: string[] },
                      idx: number,
                    ) => (
                      <li
                        key={idx}
                        className="text-sm text-light-gray-600 dark:text-light-gray-400"
                      >
                        • {s.milestones.join(", ")} (
                        {new Date(s.broadcast_at).toLocaleDateString("ja-JP")})
                      </li>
                    ),
                  )}
              </ul>
            )}
          </div>
        </Link>
      </li>
    );
  });

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {yearNodes}
    </ul>
  );
}
