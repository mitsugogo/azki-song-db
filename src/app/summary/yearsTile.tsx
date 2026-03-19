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
        className="rounded-2xl border border-white/60 bg-white/80 dark:border-white/10 dark:bg-gray-900/40 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(190,24,93,0.15)] dark:hover:shadow-[0_16px_40px_rgba(190,24,93,0.08)] transition-all duration-200"
      >
        <Link
          href={`/summary/${year}`}
          className="block p-3 h-full bg-transparent hover:bg-white/10 dark:hover:bg-white/5 transition duration-200"
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
