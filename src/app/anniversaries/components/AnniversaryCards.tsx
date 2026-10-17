import { Badge, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { FaArrowUpRightFromSquare, FaYoutube } from "react-icons/fa6";
import { renderLinkedText } from "../../lib/textLinkify";
import type { AnniversaryRow } from "../presentation";

function AnniversaryLink({ url, name }: { url: string; name: string }) {
  const t = useTranslations("Anniversaries");
  if (!url.trim()) return null;
  let isYoutube = false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return null;
    const hostname = parsed.hostname.toLowerCase();
    isYoutube =
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com");
  } catch {
    return null;
  }

  const label = isYoutube ? "YouTube" : t("openLink");
  return (
    <Button
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      color={isYoutube ? "red" : "gray"}
      size="compact-sm"
      radius="sm"
      aria-label={t("openLinkFor", { name, label })}
      leftSection={isYoutube ? <FaYoutube aria-hidden="true" /> : undefined}
      rightSection={
        <FaArrowUpRightFromSquare aria-hidden="true" className="h-2.5 w-2.5" />
      }
      className="max-w-full"
    >
      {label}
    </Button>
  );
}

export function FeaturedAnniversaries({ rows }: { rows: AnniversaryRow[] }) {
  const t = useTranslations("Anniversaries");
  const first = rows[0];
  const isToday = first.daysUntil === 0;

  return (
    <section
      aria-labelledby="featured-anniversaries-title"
      className="rounded-2xl bg-primary-50/80 p-5 sm:p-7 dark:bg-primary-950/40"
    >
      <h2
        id="featured-anniversaries-title"
        className="text-sm font-bold text-primary-700 dark:text-primary-200"
      >
        {isToday ? t("featuredTodayTitle") : t("featuredTitle")}
      </h2>
      <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 space-y-5">
          {rows.map((row) => (
            <div key={row.id}>
              <h3 className="break-words text-2xl font-bold leading-snug text-gray-950 sm:text-3xl dark:text-gray-50">
                {row.name}
              </h3>
              <time
                dateTime={row.nextIso}
                className="mt-1 block text-base text-gray-600 sm:text-lg dark:text-gray-300"
              >
                {row.nextDate}
              </time>
              {row.item.url.trim() && (
                <div className="mt-3">
                  <AnniversaryLink url={row.item.url} name={row.name} />
                </div>
              )}
            </div>
          ))}
        </div>
        {isToday ? (
          <p className="shrink-0 text-center text-2xl font-bold text-primary-700 md:max-w-64 dark:text-primary-200">
            {t("todayCelebration")}
          </p>
        ) : (
          <p
            aria-label={t("daysUntil", { days: first.daysUntil! })}
            className="flex shrink-0 items-baseline justify-center gap-2 whitespace-nowrap text-primary-700 dark:text-primary-200"
          >
            <span
              aria-hidden="true"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {t("countdownPrefix")}
            </span>
            <span
              aria-hidden="true"
              className="text-7xl font-extrabold leading-none tracking-tight tabular-nums sm:text-8xl"
            >
              {first.daysUntil}
            </span>
            <span aria-hidden="true" className="text-xl font-bold sm:text-2xl">
              {t("countdownUnit", { days: first.daysUntil! })}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

export function AnniversaryCard({ row }: { row: AnniversaryRow }) {
  const t = useTranslations("Anniversaries");
  const isToday = row.daysUntil === 0;

  return (
    <article
      aria-labelledby={`${row.id}-title`}
      className={`rounded-xl border p-4 sm:p-5 ${isToday ? "border-primary-300 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-950/25" : "border-primary-100/80 bg-white dark:border-white/15 dark:bg-gray-900/50"}`}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        <div className="w-16 shrink-0 border-r border-gray-200 pr-3 sm:w-24 sm:pr-5 dark:border-white/10">
          {row.nextIso ? (
            <time
              dateTime={row.nextIso}
              aria-label={row.nextDate}
              className="text-lg font-bold tabular-nums text-gray-950 sm:text-2xl dark:text-gray-50"
            >
              {row.monthDay}
            </time>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-2 md:flex-row md:justify-between md:gap-5">
            <h4
              id={`${row.id}-title`}
              className="min-w-0 break-words text-base font-bold leading-snug text-gray-950 sm:text-lg dark:text-gray-50"
            >
              {row.name}
            </h4>
            {row.daysUntil !== null && (
              <Badge
                color="azki"
                variant={isToday ? "filled" : "light"}
                radius="xl"
                size="lg"
                className="shrink-0 tabular-nums"
              >
                {isToday
                  ? t("todayLabel")
                  : t("daysUntil", { days: row.daysUntil })}
              </Badge>
            )}
          </div>
          {row.firstDate && (
            <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
              {t("firstDateLabel")}{" "}
              <time dateTime={row.item.first_date_at}>{row.firstDate}</time>
            </p>
          )}
          {row.item.note.trim() && (
            <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere] dark:text-gray-300">
              {renderLinkedText(row.item.note)}
            </div>
          )}
          {row.item.url.trim() && (
            <div className="mt-2">
              <AnniversaryLink url={row.item.url} name={row.name} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
