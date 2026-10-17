"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs, Skeleton } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { useLocale, useTranslations } from "next-intl";
import useAnniversaries from "../hook/useAnniversaries";
import { jstOffsetMs } from "../lib/highlights";
import { breadcrumbClasses, pageClasses } from "../theme";
import {
  AnniversaryCard,
  FeaturedAnniversaries,
} from "./components/AnniversaryCards";
import { buildAnniversaryPresentation } from "./presentation";

const dayInMs = 24 * 60 * 60 * 1000;

function useAnniversaryClock() {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let timer: number;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = Date.now();
      setNowMs(now);
      const nextMidnight =
        (Math.floor((now + jstOffsetMs) / dayInMs) + 1) * dayInMs - jstOffsetMs;
      timer = window.setTimeout(refresh, nextMidnight - now);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return nowMs;
}

export default function AnniversariesPageClient() {
  const t = useTranslations("Anniversaries");
  const locale = useLocale();
  const { items, isLoading } = useAnniversaries();
  const nowMs = useAnniversaryClock();
  const { groups, featured } = useMemo(
    () => buildAnniversaryPresentation(items, locale, nowMs),
    [items, locale, nowMs],
  );

  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        role="navigation"
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

      <h1 className={pageClasses.heading}>{t("title")}</h1>
      <p className={pageClasses.description}>{t("description")}</p>

      {isLoading ? (
        <div role="status" aria-label={t("loading")} className="space-y-5">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton height={208} radius="lg" />
          <Skeleton height={24} width="40%" radius="sm" />
          <Skeleton height={120} radius="md" />
          <Skeleton height={120} radius="md" />
        </div>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl border border-primary-100 bg-white px-5 py-10 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
          {t("empty")}
        </p>
      ) : (
        <>
          {featured.length > 0 && <FeaturedAnniversaries rows={featured} />}

          <section aria-labelledby="anniversary-list-title" className="mt-7">
            <h2
              id="anniversary-list-title"
              className="text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              {t("upcomingTitle")}
            </h2>
            <nav aria-label={t("monthNavigationLabel")} className="mt-2 mb-6">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {groups.map((group) => (
                  <li key={group.key}>
                    <a
                      href={`#anniversary-month-${group.key}`}
                      className="rounded-sm text-sm font-medium text-primary-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 dark:text-primary-200"
                    >
                      {group.label || t("undatedTitle")}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-6">
              {groups.map((group) => (
                <section
                  key={group.key}
                  id={`anniversary-month-${group.key}`}
                  aria-labelledby={`anniversary-month-heading-${group.key}`}
                  className="scroll-mt-5"
                >
                  <div className="mb-3 flex items-center gap-4">
                    <h3
                      id={`anniversary-month-heading-${group.key}`}
                      className="shrink-0 text-lg font-bold text-gray-900 dark:text-gray-100"
                    >
                      {group.label || t("undatedTitle")}
                    </h3>
                    <div
                      aria-hidden="true"
                      className="h-px flex-1 bg-gray-200 dark:bg-white/15"
                    />
                  </div>
                  <div className="space-y-3">
                    {group.rows.map((row) => (
                      <AnniversaryCard key={row.id} row={row} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
