"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Select, TextInput } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { HiOutlineCalendar, HiOutlineLocationMarker } from "react-icons/hi";
import { useSearchParams } from "next/navigation";
import { HiArrowRight, HiSearch } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import historyHelper from "@/app/lib/history";
import { getLiveComparisonPath, getLiveTitlePath } from "@/app/lib/livePaths";
import {
  formatLiveDate,
  filterLiveTitleGroups,
  getLiveCategoryKey,
  groupLiveTitleGroupsByYear,
} from "@/app/lib/liveSetlists";
import type { LiveTitleGroup } from "@/app/types/live";
import LiveCategoryBadge from "./LiveCategoryBadge";

const uniqueValues = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export default function LivesClient({ groups }: { groups: LiveTitleGroup[] }) {
  const t = useTranslations("Lives");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");

  useEffect(() => {
    const restoreFilters = () => {
      const params = new URL(window.location.href).searchParams;
      setQuery(params.get("q") ?? "");
      setCategory(params.get("category") ?? "");
    };
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);

  const setParam = (key: "q" | "category", value: string) => {
    if (key === "q") setQuery(value);
    else setCategory(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    historyHelper.replaceUrlIfDifferent(url.href);
  };

  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("allCategories") },
      ...uniqueValues(groups.map((group) => group.category)).map((value) => {
        const key = getLiveCategoryKey(value);
        return {
          value,
          label: key ? t(`category.${key}`) : value,
        };
      }),
    ],
    [groups, t],
  );

  const filteredGroups = useMemo(() => {
    return filterLiveTitleGroups(groups, { query, category });
  }, [category, groups, query]);

  const groupsByYear = useMemo(() => {
    const result = groupLiveTitleGroupsByYear(filteredGroups);
    if (result.has("")) {
      result.set(t("unknownYear"), result.get("") ?? []);
      result.delete("");
    }
    return result;
  }, [filteredGroups, t]);

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)_auto]">
        <TextInput
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          leftSection={<HiSearch aria-hidden="true" />}
          value={query}
          onChange={(event) => setParam("q", event.currentTarget.value)}
        />
        <Select
          aria-label={t("categoryFilterLabel")}
          data={categoryOptions}
          value={category}
          allowDeselect={false}
          onChange={(value) => setParam("category", value ?? "")}
        />
        <Button
          variant="subtle"
          disabled={!query && !category}
          onClick={() => {
            setQuery("");
            setCategory("");
            const url = new URL(window.location.href);
            url.searchParams.delete("q");
            url.searchParams.delete("category");
            historyHelper.replaceUrlIfDifferent(url.href);
          }}
        >
          {t("clearFilters")}
        </Button>
      </div>

      <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
        {t("resultCount", { count: filteredGroups.length })}
      </p>

      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-light-gray-300 px-6 py-14 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(groupsByYear.entries()).map(([year, yearGroups]) => (
            <section key={year} aria-labelledby={`live-year-${year}`}>
              <h2
                id={`live-year-${year}`}
                className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100"
              >
                {t("yearHeading", { year })}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {yearGroups.map((group) => {
                  const first = group.performances[0];
                  const last = group.performances.at(-1) ?? first;
                  const venues = uniqueValues(
                    group.performances.map((performance) =>
                      locale === "en"
                        ? performance.venueEn || performance.venue
                        : performance.venue,
                    ),
                  );
                  const dateLabel =
                    first.date === last.date
                      ? formatLiveDate(first.date, locale)
                      : `${formatLiveDate(first.date, locale)} — ${formatLiveDate(last.date, locale)}`;

                  return (
                    <article
                      key={group.canonicalId}
                      className="flex h-full flex-col rounded-2xl border border-light-gray-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-white/10 dark:bg-gray-900/70 dark:hover:border-primary-700"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <LiveCategoryBadge category={group.category} />
                        {group.performances.length > 1 ? (
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t("performanceCount", {
                              count: group.performances.length,
                            })}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
                        {locale === "en" ? group.titleEn || group.title : group.title}
                      </h3>
                      <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div>
                          <dt className="sr-only">{t("date")}</dt>
                          <dd className="flex items-center gap-2">
                            <HiOutlineCalendar
                              aria-hidden="true"
                              className="shrink-0 text-gray-400 dark:text-gray-500"
                            />
                            <span>{dateLabel}</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="sr-only">{t("venue")}</dt>
                          <dd className="flex items-center gap-2">
                            <HiOutlineLocationMarker
                              aria-hidden="true"
                              className="shrink-0 text-gray-400 dark:text-gray-500"
                            />
                            <span>{venues.join(" / ")}</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="sr-only">{t("songs")}</dt>
                          <dd>{t("songCount", { count: group.totalSongs })}</dd>
                        </div>
                      </dl>
                      <Link
                        href={
                          getLiveComparisonPath(group) ??
                          getLiveTitlePath(group)
                        }
                        aria-label={t("openLive", { title: group.title })}
                        className="mt-auto inline-flex items-center justify-end gap-1 pt-5 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300"
                      >
                        {t("viewDetails")}
                        <HiArrowRight aria-hidden="true" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
