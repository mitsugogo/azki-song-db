import { Badge } from "@mantine/core";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { formatDate } from "@/app/lib/formatDate";
import type { UnitHistoryEntry } from "@/app/lib/unitHistory";

export default async function UnitHistory({
  entries,
  legacyName,
}: {
  entries: UnitHistoryEntry[];
  legacyName?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });
  const grouped = entries.reduce((map, entry) => {
    const year = entry.date.slice(0, 4);
    const list = map.get(year) ?? [];
    list.push(entry);
    map.set(year, list);
    return map;
  }, new Map<string, UnitHistoryEntry[]>());

  return (
    <section aria-labelledby="unit-history-title" className="mt-12">
      <div className="max-w-2xl">
        <h2
          id="unit-history-title"
          className="text-2xl font-extrabold text-gray-900 dark:text-gray-100"
        >
          {t("historyTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {legacyName
            ? t("historyDescriptionWithLegacy", { name: legacyName })
            : t("historyDescription")}
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          {t("historyEmpty")}
        </p>
      ) : (
        <div className="mt-6 space-y-9">
          {[...grouped.entries()].map(([year, yearEntries]) => (
            <section
              key={year}
              aria-labelledby={`history-${year}`}
              className="grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]"
            >
              <h3
                id={`history-${year}`}
                className="text-2xl font-black text-primary-700 dark:text-pink-200"
              >
                {year}
              </h3>
              <ol className="relative space-y-6 border-l-2 border-primary/20 pl-6">
                {yearEntries.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary shadow-sm dark:border-gray-900" />
                    <div
                      className={
                        entry.videoId && entry.youtubeHref
                          ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start"
                          : undefined
                      }
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <time className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                            {formatDate(
                              `${entry.date}T00:00:00+09:00`,
                              locale,
                              {
                                year: undefined,
                                timeZone: "Asia/Tokyo",
                              },
                            )}
                          </time>
                          <Badge size="xs" variant="light">
                            {t(`historyType.${entry.type}`)}
                          </Badge>
                        </div>
                        <h4 className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
                          {entry.href ? (
                            <Link href={entry.href}>{entry.title}</Link>
                          ) : (
                            entry.title
                          )}
                        </h4>
                        {entry.description && (
                          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {entry.description}
                          </p>
                        )}
                        {entry.youtubeHref && !entry.videoId && (
                          <Link
                            href={entry.youtubeHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                          >
                            {t("watchOnYouTube")}
                          </Link>
                        )}
                      </div>
                      {entry.videoId && entry.youtubeHref && (
                        <Link
                          href={entry.youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("historyThumbnailLinkLabel", {
                            title: entry.title,
                          })}
                          className="block w-40 max-w-full justify-self-end overflow-hidden rounded-lg bg-black shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <YoutubeThumbnail
                            videoId={entry.videoId}
                            alt={t("historyThumbnailAlt", {
                              title: entry.title,
                            })}
                          />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
