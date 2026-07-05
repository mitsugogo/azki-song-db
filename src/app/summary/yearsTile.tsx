"use client";

import { Link } from "@/i18n/navigation";
import { Song } from "../types/song";
import { useLoading } from "../context/LoadingContext";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../lib/formatDate";
import { Badge, Button } from "@mantine/core";

export default function YearsTile({ songs }: { songs: Song[] }) {
  const { setLoading } = useLoading();
  const t = useTranslations("Summary");
  const locale = useLocale();
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
        className="rounded-2xl border border-gray-50/60 bg-white/80 dark:border-white/10 dark:bg-gray-900/40 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(190,24,93,0.15)] dark:hover:shadow-[0_16px_40px_rgba(190,24,93,0.08)] transition-all duration-200"
      >
        <Link
          href={`/summary/${year}`}
          className="block p-3 h-full bg-transparent hover:bg-white/10 dark:hover:bg-white/5 transition duration-200"
          onClick={() => setLoading(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {year}
              {t("yearSuffix")}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1">
              {counts[year]}
              {t("songsSuffix")}
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
                        {formatDate(s.broadcast_at, locale)})
                      </li>
                    ),
                  )}
              </ul>
            )}
            <hr className="mt-2 border-light-gray-200 dark:border-white/10" />
            <div className="mt-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const monthCount = songs.filter(
                  (s) =>
                    Number(s.year) === year &&
                    new Date(s.broadcast_at).getMonth() + 1 === month,
                ).length;
                if (
                  year === new Date().getFullYear() &&
                  month > new Date().getMonth() + 1
                ) {
                  return null;
                }
                // デビュー月より前も非表示
                if (
                  year === 2018 &&
                  month < new Date("2018-11-15").getMonth() + 1
                ) {
                  return null;
                }
                return (
                  <Badge
                    component={Link}
                    href={`/summary/${year}/${month}`}
                    color="gray"
                    variant="light"
                    size="xs"
                    radius="xs"
                    key={month}
                    className="mr-1 cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800"
                  >
                    {new Intl.DateTimeFormat(locale, { month: "long" }).format(
                      new Date(2020, month - 1, 1),
                    )}
                  </Badge>
                );
              })}
            </div>
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
