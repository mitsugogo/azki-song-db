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

// 日本時間（JST）基準でその日の開始（00:00 JST）の Date を返す
const jstOffsetMs = 9 * hourInMs;
const parseToJstDayStart = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    // JST のその日の 00:00 を表す UTC 時刻を作る
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - jstOffsetMs;
    return new Date(utcMs);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // parsed を JST にシフトして JST の年月日を取り、その日の JST 00:00 を返す
  const jst = new Date(parsed.getTime() + jstOffsetMs);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const day = jst.getUTCDate();
  const utcMs = Date.UTC(year, month, day, 0, 0, 0) - jstOffsetMs;
  return new Date(utcMs);
};

const parseToTargetDateTime = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    // date-only は JST のその日の 00:00 をターゲットとする
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - jstOffsetMs;
    return new Date(utcMs);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const getDaysUntil = (nextDateAt: string, nowMsArg?: number) => {
  const target = parseToJstDayStart(nextDateAt);
  if (!target) {
    return null;
  }

  const nowMsLocal = typeof nowMsArg === "number" ? nowMsArg : Date.now();
  // 今の時刻を JST にシフトして JST の年月日でその日の開始（00:00 JST）を計算
  const jstNowMs = nowMsLocal + jstOffsetMs;
  const jstNow = new Date(jstNowMs);
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth();
  const day = jstNow.getUTCDate();
  const todayStartUtcMs = Date.UTC(year, month, day, 0, 0, 0) - jstOffsetMs;
  const diffDays = Math.ceil((target.getTime() - todayStartUtcMs) / dayInMs);
  return Math.max(0, diffDays);
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

  const sortedItems = useMemo(() => {
    const jstNow = new Date(nowMs + jstOffsetMs);
    const nowMonth = jstNow.getUTCMonth() + 1;
    const nowDay = jstNow.getUTCDate();
    // compute next occurrence for each item and sort: today first, then days until
    const withNext = items.map((it) => {
      const nextIso = computeNextIsoForItem(it, nowMs);
      const days = nextIso ? getDaysUntil(nextIso, nowMs) : null;
      return { it, nextIso, days };
    });

    withNext.sort((A, B) => {
      const aIsToday = (() => {
        if (!A.nextIso) return false;
        const d = new Date(
          parseToJstDayStart(A.nextIso)!.getTime() + jstOffsetMs,
        );
        return d.getUTCMonth() + 1 === nowMonth && d.getUTCDate() === nowDay;
      })();
      const bIsToday = (() => {
        if (!B.nextIso) return false;
        const d = new Date(
          parseToJstDayStart(B.nextIso)!.getTime() + jstOffsetMs,
        );
        return d.getUTCMonth() + 1 === nowMonth && d.getUTCDate() === nowDay;
      })();
      if (aIsToday && !bIsToday) return -1;
      if (bIsToday && !aIsToday) return 1;

      const aKey = A.days === null ? Number.MAX_SAFE_INTEGER : A.days;
      const bKey = B.days === null ? Number.MAX_SAFE_INTEGER : B.days;
      if (aKey !== bKey) return aKey - bKey;

      const aTime = A.nextIso
        ? new Date(A.nextIso).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = B.nextIso
        ? new Date(B.nextIso).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    return withNext.map((v) => v.it);
  }, [items, nowMs]);

  const featuredAnniversaries = useMemo(() => {
    // まず日本時間の月/日が今日と一致する記念日を探す（API の next_date_at が翌年になっている場合に対応）
    const getJstMonthDay = (dateStr?: string | null, item?: any) => {
      // dateStr may be empty because API no longer returns next_date_at; allow item to compute
      const source =
        dateStr || (item ? computeNextIsoForItem(item, nowMs) : "");
      if (!source) return null;
      const target = parseToJstDayStart(source);
      if (!target) return null;
      const d = new Date(target.getTime() + jstOffsetMs);
      return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    };

    const nowJst = new Date(
      (typeof nowMs === "number" ? nowMs : Date.now()) + jstOffsetMs,
    );
    const nowMonth = nowJst.getUTCMonth() + 1;
    const nowDay = nowJst.getUTCDate();

    const todayItems = sortedItems.filter((item) => {
      const md = getJstMonthDay(undefined, item);
      return md !== null && md.month === nowMonth && md.day === nowDay;
    });
    if (todayItems.length > 0) return todayItems;

    // 当日がなければ次に来る記念日を全件返す（同日重複に対応）
    let minDays = Number.MAX_SAFE_INTEGER;
    const nextItems: any[] = [];
    sortedItems.forEach((item) => {
      const nextIso = computeNextIsoForItem(item, nowMs);
      const days = nextIso ? getDaysUntil(nextIso, nowMs) : null;
      if (days === null || days <= 0) return;
      if (days < minDays) {
        minDays = days;
        nextItems.length = 0;
        nextItems.push(item);
        return;
      }
      if (days === minDays) {
        nextItems.push(item);
      }
    });

    return nextItems;
  }, [nowMs, sortedItems]);

  const getItemIsToday = (item: any) => {
    const target = parseToJstDayStart(computeNextIsoForItem(item, nowMs));
    if (!target) return false;
    const d = new Date(target.getTime() + jstOffsetMs);
    const jstNow = new Date(nowMs + jstOffsetMs);
    return (
      d.getUTCMonth() === jstNow.getUTCMonth() &&
      d.getUTCDate() === jstNow.getUTCDate()
    );
  };

  const getFeaturedCountdown = (item: any) => {
    const nextIso = computeNextIsoForItem(item, nowMs);
    const daysUntil = nextIso ? getDaysUntil(nextIso, nowMs) : null;
    if (daysUntil === null) return null;

    // 当日の判定は JST の月/日一致で行う（API の next_date_at が翌年になっている場合に対応）
    const isMonthDayToday = getItemIsToday(item);
    if (isMonthDayToday) return null;
    const target = parseToTargetDateTime(nextIso);
    if (!target) return null;
    const targetMs = target.getTime();

    const diff = targetMs - nowMs;
    if (diff <= 0) return t("countdownFinished");

    const days = Math.floor(diff / dayInMs);
    const hours = Math.floor((diff % dayInMs) / hourInMs);
    const minutes = Math.floor((diff % hourInMs) / minuteInMs);
    const seconds = Math.floor((diff % minuteInMs) / secondInMs);

    return t("countdownFormat", { days, hours, minutes, seconds });
  };

  const getYearFromDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) return Number(dateOnlyMatch[1]);
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return null;
    const jst = new Date(parsed.getTime() + jstOffsetMs);
    return jst.getUTCFullYear();
  };

  // first_date_at(date) を基準に次回日付を JST で計算（当日だけは当年を返す）
  function computeNextIsoForItem(item: any, nowMsArg?: number) {
    const nowMsLocal = typeof nowMsArg === "number" ? nowMsArg : Date.now();
    const nowJst = new Date(nowMsLocal + jstOffsetMs);
    const nowYear = nowJst.getUTCFullYear();
    const nowMonth = nowJst.getUTCMonth();
    const nowDay = nowJst.getUTCDate();

    // Prefer first_date_at if provided (ISO string representing JST midnight UTC)
    const firstIso = item.first_date_at || "";
    if (firstIso) {
      const parsed = new Date(firstIso);
      if (!Number.isNaN(parsed.getTime())) {
        const jst = new Date(parsed.getTime() + jstOffsetMs);
        const month = jst.getUTCMonth();
        const day = jst.getUTCDate();
        // 当年の候補日
        const candidateUtc =
          Date.UTC(nowYear, month, day, 0, 0, 0) - jstOffsetMs;
        const isToday = month === nowMonth && day === nowDay;
        if (isToday || candidateUtc > nowMsLocal) {
          return new Date(candidateUtc).toISOString();
        }
        const nextUtc =
          Date.UTC(nowYear + 1, month, day, 0, 0, 0) - jstOffsetMs;
        return new Date(nextUtc).toISOString();
      }
    }

    // fallback: if `date` is provided as MM/DD
    const dateStr = item.date || "";
    const mdMatch = (dateStr || "").match(/^(\d{2})\/(\d{2})$/);
    if (mdMatch) {
      const month = Number(mdMatch[1]) - 1;
      const day = Number(mdMatch[2]);
      const candidateUtc = Date.UTC(nowYear, month, day, 0, 0, 0) - jstOffsetMs;
      const isToday = month === nowMonth && day === nowDay;
      if (isToday || candidateUtc > nowMsLocal) {
        return new Date(candidateUtc).toISOString();
      }
      const nextUtc = Date.UTC(nowYear + 1, month, day, 0, 0, 0) - jstOffsetMs;
      return new Date(nextUtc).toISOString();
    }

    return "";
  }

  const formatWithAnniversary = (item: any) => {
    const template = item.name || "";
    if (!template) return "";

    const nextIso = computeNextIsoForItem(item, nowMs);
    if (!nextIso) return template;

    const nextJst = new Date(new Date(nextIso).getTime() + jstOffsetMs);
    const occurrenceYear = nextJst.getUTCFullYear();

    let result = template.replace(/\{year\}/g, String(occurrenceYear));

    if (result.includes("{n}")) {
      const firstYear = getYearFromDate(item.first_date_at || item.date);
      if (firstYear) {
        const n = occurrenceYear - firstYear;
        if (Number.isFinite(n) && n > 0) {
          const isEnLocale = (locale || "").toString().startsWith("en");
          const ordinal = (v: number) => {
            const mod10 = v % 10;
            const mod100 = v % 100;
            if (mod10 === 1 && mod100 !== 11) return `${v}st`;
            if (mod10 === 2 && mod100 !== 12) return `${v}nd`;
            if (mod10 === 3 && mod100 !== 13) return `${v}rd`;
            return `${v}th`;
          };
          result = result.replace(
            /\{n\}/g,
            isEnLocale ? ordinal(n) : String(n),
          );
        }
      }
    }

    return result;
  };

  const hasFeaturedToday =
    featuredAnniversaries.length > 0 &&
    getItemIsToday(featuredAnniversaries[0]);

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

      {featuredAnniversaries.length > 0 &&
        featuredAnniversaries.map((item, index) => {
          const featuredCountdown = getFeaturedCountdown(item);
          return (
            <section
              key={`${item.name}-${index}`}
              className="mx-2 mb-2 rounded-xl border border-primary-300/40 bg-primary-50/70 p-4 shadow-sm dark:border-pink-200/20 dark:bg-gray-900/50"
            >
              <p className="text-xs font-semibold tracking-wide text-primary-700 dark:text-pink-200">
                {hasFeaturedToday
                  ? t("featuredTodayTitle")
                  : t("featuredTitle")}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
                {formatWithAnniversary(item)}
              </h2>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {t("nextDateLabel")}:{" "}
                {formatDate(computeNextIsoForItem(item, nowMs), locale)}
              </p>
              {featuredCountdown && (
                <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-pink-200">
                  {featuredCountdown}
                </p>
              )}
            </section>
          );
        })}

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
                let nextDate: string;
                let daysUntil: number | null;
                // compute next occurrence client-side
                const itemNextIso = computeNextIsoForItem(item, nowMs);
                if (itemNextIso) {
                  const target = parseToJstDayStart(itemNextIso);
                  if (target) {
                    const md = new Date(target.getTime() + jstOffsetMs);
                    const jstNow = new Date(nowMs + jstOffsetMs);
                    const isMonthDayToday =
                      md.getUTCMonth() === jstNow.getUTCMonth() &&
                      md.getUTCDate() === jstNow.getUTCDate();
                    if (isMonthDayToday) {
                      const y = jstNow.getUTCFullYear();
                      const m = String(md.getUTCMonth() + 1).padStart(2, "0");
                      const d = String(md.getUTCDate()).padStart(2, "0");
                      nextDate = formatDate(`${y}-${m}-${d}`, locale);
                      daysUntil = 0;
                    } else {
                      nextDate = formatDate(itemNextIso, locale);
                      daysUntil = getDaysUntil(itemNextIso);
                    }
                  } else {
                    nextDate = formatDate(itemNextIso, locale);
                    daysUntil = getDaysUntil(itemNextIso);
                  }
                } else {
                  nextDate = "-";
                  daysUntil = null;
                }
                const firstDate = item.first_date_at
                  ? formatDate(item.first_date_at, locale)
                  : "-";

                return (
                  <tbody key={`${item.name}-${index}`}>
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
                        {formatWithAnniversary(item)}
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
                          ? daysUntil === 0
                            ? "-"
                            : t("daysUntil", { days: daysUntil })
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
                  let nextDate: string;
                  let daysUntil: number | null;
                  // compute next occurrence client-side
                  const itemNextIso = computeNextIsoForItem(item, nowMs);
                  if (itemNextIso) {
                    const target = parseToJstDayStart(itemNextIso);
                    if (target) {
                      const md = new Date(target.getTime() + jstOffsetMs);
                      const jstNow = new Date(nowMs + jstOffsetMs);
                      const isMonthDayToday =
                        md.getUTCMonth() === jstNow.getUTCMonth() &&
                        md.getUTCDate() === jstNow.getUTCDate();
                      if (isMonthDayToday) {
                        const y = jstNow.getUTCFullYear();
                        const m = String(md.getUTCMonth() + 1).padStart(2, "0");
                        const d = String(md.getUTCDate()).padStart(2, "0");
                        nextDate = formatDate(`${y}-${m}-${d}`, locale);
                        daysUntil = 0;
                      } else {
                        nextDate = formatDate(itemNextIso, locale);
                        daysUntil = getDaysUntil(itemNextIso);
                      }
                    } else {
                      nextDate = formatDate(itemNextIso, locale);
                      daysUntil = getDaysUntil(itemNextIso);
                    }
                  } else {
                    nextDate = "-";
                    daysUntil = null;
                  }
                  const firstDate = item.first_date_at
                    ? formatDate(item.first_date_at, locale)
                    : "-";

                  return (
                    <tr
                      key={`${item.name}-${index}`}
                      className="border-t border-light-gray-200/60 align-top text-gray-800 dark:border-white/10 dark:text-gray-100"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        {nextDate}
                      </td>
                      <td className="px-3 py-3 font-semibold whitespace-nowrap">
                        {formatWithAnniversary(item)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {firstDate}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-primary-700 dark:text-pink-200">
                        {daysUntil !== null
                          ? daysUntil === 0
                            ? "-"
                            : t("daysUntil", { days: daysUntil })
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
