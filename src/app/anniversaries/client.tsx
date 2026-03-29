"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Breadcrumbs } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { useLocale, useTranslations } from "next-intl";
import useAnniversaries from "../hook/useAnniversaries";
import { formatDate } from "../lib/formatDate";
import { breadcrumbClasses } from "../theme";
import { FaExternalLinkAlt } from "react-icons/fa";

const dayInMs = 24 * 60 * 60 * 1000;
const hourInMs = 60 * 60 * 1000;
const minuteInMs = 60 * 1000;
const secondInMs = 1000;

const parseToLocalDayStart = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const parseToTargetDateTime = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const getDaysUntil = (nextDateAt: string) => {
  const target = parseToLocalDayStart(nextDateAt);
  if (!target) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.max(
    0,
    Math.ceil((target.getTime() - todayStart.getTime()) / dayInMs),
  );
};

export default function AnniversariesPageClient() {
  const t = useTranslations("Anniversaries");
  const locale = useLocale();
  const { items, isLoading } = useAnniversaries();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, secondInMs);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = new Date(a.next_date_at).getTime();
        const bTime = new Date(b.next_date_at).getTime();
        const aSafe = Number.isFinite(aTime) ? aTime : Number.MAX_SAFE_INTEGER;
        const bSafe = Number.isFinite(bTime) ? bTime : Number.MAX_SAFE_INTEGER;
        return aSafe - bSafe;
      }),
    [items],
  );

  const featuredAnniversary = useMemo(
    () =>
      sortedItems.find((item) => {
        const target = parseToTargetDateTime(item.next_date_at);
        if (!target) {
          return false;
        }
        return target.getTime() >= nowMs;
      }) || null,
    [nowMs, sortedItems],
  );

  const featuredCountdown = useMemo(() => {
    if (!featuredAnniversary) {
      return null;
    }

    const target = parseToTargetDateTime(featuredAnniversary.next_date_at);
    if (!target) {
      return null;
    }

    const diff = target.getTime() - nowMs;
    if (diff <= 0) {
      return t("countdownFinished");
    }

    const days = Math.floor(diff / dayInMs);
    const hours = Math.floor((diff % dayInMs) / hourInMs);
    const minutes = Math.floor((diff % hourInMs) / minuteInMs);
    const seconds = Math.floor((diff % minuteInMs) / secondInMs);

    return t("countdownFormat", { days, hours, minutes, seconds });
  }, [featuredAnniversary, nowMs, t]);

  return (
    <div className="grow p-2 lg:p-6 lg:pb-10">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
        </Link>
        <Link href="/anniversaries" className={breadcrumbClasses.link}>
          {t("breadcrumb")}
        </Link>
      </Breadcrumbs>

      <div className="px-3 py-2">
        <h1 className="font-extrabold text-2xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t("description")}
        </p>
      </div>

      {featuredAnniversary && featuredCountdown && (
        <section className="mx-2 mb-2 rounded-xl border border-primary-300/40 bg-primary-50/70 p-4 shadow-sm dark:border-pink-200/20 dark:bg-gray-900/50">
          <p className="text-xs font-semibold tracking-wide text-primary-700 dark:text-pink-200">
            {t("featuredTitle")}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
            {featuredAnniversary.formatted_name}
          </h2>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {t("nextDateLabel")}:{" "}
            {formatDate(featuredAnniversary.next_date_at, locale)}
          </p>
          <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-pink-200">
            {featuredCountdown}
          </p>
        </section>
      )}

      {isLoading ? (
        <p className="px-3 py-6 text-sm text-gray-600 dark:text-gray-300">
          {t("loading")}
        </p>
      ) : sortedItems.length === 0 ? (
        <p className="px-3 py-6 text-sm text-gray-600 dark:text-gray-300">
          {t("empty")}
        </p>
      ) : (
        <>
          <div className="p-2 md:hidden">
            <table className="w-full rounded-xl border border-light-gray-200/50 bg-white/70 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
              {sortedItems.map((item, index) => {
                const nextDate = item.next_date_at
                  ? formatDate(item.next_date_at, locale)
                  : "-";
                const firstDate = item.first_date_at
                  ? formatDate(item.first_date_at, locale)
                  : "-";
                const daysUntil = item.next_date_at
                  ? getDaysUntil(item.next_date_at)
                  : null;

                return (
                  <tbody key={`${item.formatted_name}-${index}`}>
                    <tr className="border-t border-light-gray-200/60 text-gray-800 dark:border-white/10 dark:text-gray-100">
                      <th className="w-20 px-3 pt-3 pb-1 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">
                        {t("nextDateLabel")}
                      </th>
                      <td className="px-3 pt-3 pb-1 whitespace-nowrap">
                        {nextDate}
                      </td>
                      <th className="w-16 px-3 pt-3 pb-1 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">
                        {t("anniversaryNameLabel")}
                      </th>
                      <td className="px-3 pt-3 pb-1 font-semibold">
                        {item.formatted_name}
                      </td>
                    </tr>
                    <tr className="text-gray-800 dark:text-gray-100">
                      <th className="w-20 px-3 pt-1 pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">
                        {t("firstDateLabel")}
                      </th>
                      <td className="px-3 pt-1 pb-3 whitespace-nowrap">
                        {firstDate}
                      </td>
                      <th className="w-16 px-3 pt-1 pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">
                        {t("daysUntilLabel")}
                      </th>
                      <td className="px-3 pt-1 pb-3 whitespace-nowrap text-primary-700 dark:text-pink-200">
                        {daysUntil !== null
                          ? t("daysUntil", { days: daysUntil })
                          : "-"}
                      </td>
                    </tr>
                    {(item.note || item.url) && (
                      <tr className="border-b border-light-gray-200/60 text-gray-700 dark:border-white/10 dark:text-gray-300">
                        <th className="px-3 pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">
                          {item.note ? t("noteLabel") : t("linkLabel")}
                        </th>
                        <td className="px-3 pb-3" colSpan={3}>
                          {item.note || ""}
                          {item.url && (
                            <>
                              {item.note ? " " : ""}
                              <Link
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary-700 underline-offset-4 hover:underline dark:text-pink-200"
                              >
                                {t("openLink")}
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>

          <div className="hidden overflow-x-auto p-2 md:block">
            <table className="min-w-full rounded-xl border border-light-gray-200/50 bg-white/70 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
              <thead className="bg-light-gray-100/70 dark:bg-gray-800/60">
                <tr className="text-left text-xs font-semibold text-gray-700 dark:text-gray-200">
                  <th className="px-3 py-2">{t("nextDateLabel")}</th>
                  <th className="px-3 py-2">{t("anniversaryNameLabel")}</th>
                  <th className="px-3 py-2">{t("firstDateLabel")}</th>
                  <th className="px-3 py-2">{t("daysUntilLabel")}</th>
                  <th className="px-3 py-2">{t("noteLabel")}</th>
                  <th className="px-3 py-2 whitespace-nowrap">
                    {t("linkLabel")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, index) => {
                  const nextDate = item.next_date_at
                    ? formatDate(item.next_date_at, locale)
                    : "-";
                  const firstDate = item.first_date_at
                    ? formatDate(item.first_date_at, locale)
                    : "-";
                  const daysUntil = item.next_date_at
                    ? getDaysUntil(item.next_date_at)
                    : null;

                  return (
                    <tr
                      key={`${item.formatted_name}-${index}`}
                      className="border-t border-light-gray-200/60 align-top text-gray-800 dark:border-white/10 dark:text-gray-100"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        {nextDate}
                      </td>
                      <td className="px-3 py-3 font-semibold whitespace-nowrap">
                        {item.formatted_name}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {firstDate}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-primary-700 dark:text-pink-200">
                        {daysUntil !== null
                          ? t("daysUntil", { days: daysUntil })
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {item.note || "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {item.url ? (
                          <Badge
                            component={Link}
                            variant="variant"
                            size="sm"
                            radius="sm"
                            color="pink"
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whitespace-nowrap cursor-pointer inline-block"
                          >
                            <FaExternalLinkAlt className="w-2 h-2 inline mr-1" />
                            {t("openLink")}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
