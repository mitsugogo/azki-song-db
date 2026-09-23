"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  buildLiveComparisonRows,
  countLiveSongsByPerformance,
} from "@/app/lib/liveComparison";
import {
  formatLiveDate,
  isAzkiSungOfficialFesEntry,
} from "@/app/lib/liveSetlists";
import type { LiveTitleGroup } from "@/app/types/live";
import LivePerformanceNavigation from "./LivePerformanceNavigation";
import LiveTitleHeader from "./LiveTitleHeader";

export default function LiveComparisonClient({
  group,
}: {
  group: LiveTitleGroup;
}) {
  const t = useTranslations("Lives");
  const locale = useLocale();
  const rows = buildLiveComparisonRows(group.performances);
  const frequencies = countLiveSongsByPerformance(group.performances);

  return (
    <>
      <LiveTitleHeader group={group} />
      <LivePerformanceNavigation group={group} selectedId="all" />

      <section aria-labelledby="live-comparison-heading">
        <h2
          id="live-comparison-heading"
          className="text-xl font-bold text-gray-900 dark:text-gray-100"
        >
          {t("comparison")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
          <span>{t("comparisonVariantLegend")}</span>
          <span>{t("comparisonAdditionLegend")}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
          {t("comparisonScrollHint")}
        </p>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-light-gray-300 px-6 py-12 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
            {t("setlistEmpty")}
          </div>
        ) : (
          <div
            role="region"
            aria-label={t("comparisonTableLabel")}
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl border border-light-gray-200 bg-white/80 dark:border-white/10 dark:bg-gray-900/65"
          >
            <table
              className="w-full table-fixed border-collapse text-left text-sm"
              style={{ minWidth: `${group.performances.length * 220 + 56}px` }}
            >
              <caption className="sr-only">{t("comparisonTableLabel")}</caption>
              <thead>
                <tr className="border-b border-light-gray-200 bg-primary-50/60 dark:border-white/10 dark:bg-primary-950/30">
                  <th
                    scope="col"
                    className="w-14 px-3 py-3 text-gray-500 dark:text-gray-400"
                  >
                    <span className="sr-only">{t("comparisonRow")}</span>
                  </th>
                  {group.performances.map((performance) => (
                    <th
                      key={performance.id}
                      scope="col"
                      className="px-3 py-3 align-top font-semibold text-gray-900 dark:text-gray-100"
                    >
                      <span className="block">
                        {(locale === "en"
                          ? performance.performanceEn || performance.performance
                          : performance.performance) ||
                          formatLiveDate(performance.date, locale)}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">
                        {formatLiveDate(performance.date, locale)}
                        {(
                          locale === "en"
                            ? performance.venueEn || performance.venue
                            : performance.venue
                        )
                          ? ` · ${locale === "en" ? performance.venueEn || performance.venue : performance.venue}`
                          : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-light-gray-200 last:border-0 dark:border-white/10"
                  >
                    <th
                      scope="row"
                      className="px-3 py-3 align-top text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      {row.kind === "variant"
                        ? "⇄"
                        : row.kind === "addition"
                          ? "＋"
                          : rowIndex + 1}
                      <span className="sr-only">
                        {row.kind === "variant"
                          ? t("comparisonVariant")
                          : row.kind === "addition"
                            ? t("comparisonAddition")
                            : ""}
                      </span>
                    </th>
                    {row.entries.map((entry, performanceIndex) => (
                      <td
                        key={group.performances[performanceIndex].id}
                        className={`px-3 py-3 align-top ${
                          row.kind === "variant"
                            ? "bg-primary-50/40 dark:bg-primary-950/20"
                            : row.kind === "addition" && entry
                              ? "bg-amber-50/60 dark:bg-amber-950/20"
                              : ""
                        }`}
                      >
                        {entry ? (
                          <>
                            <span className="mr-2 font-mono text-xs font-semibold text-primary-700 dark:text-primary-300">
                              {entry.order || "—"}
                            </span>
                            <span
                              className={
                                isAzkiSungOfficialFesEntry(
                                  group.category,
                                  entry,
                                )
                                  ? "font-bold text-primary-700 dark:text-primary-300"
                                  : "font-medium text-gray-900 dark:text-gray-100"
                              }
                            >
                              {locale === "en"
                                ? entry.titleEn || entry.title
                                : entry.title}
                            </span>
                            {entry.artist ? (
                              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                {locale === "en"
                                  ? entry.artistEn || entry.artist
                                  : entry.artist}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {frequencies.length > 0 ? (
        <section className="mt-10" aria-labelledby="live-frequency-heading">
          <h2
            id="live-frequency-heading"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            {t("songFrequency", { count: frequencies.length })}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {frequencies.map((song) => (
              <li
                key={song.title}
                className="flex items-baseline gap-3 rounded-xl border border-light-gray-200 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-gray-900/65"
              >
                <span className="shrink-0 font-mono text-sm font-semibold text-primary-700 dark:text-primary-300">
                  {song.count} / {group.performances.length}
                </span>
                <span className="min-w-0 text-sm text-gray-900 dark:text-gray-100">
                  {song.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
