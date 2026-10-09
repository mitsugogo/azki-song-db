"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Loader,
  MultiSelect,
  Pagination,
  Select,
  TextInput,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  HiChevronUp,
  HiChevronDown,
  HiSelector,
  HiPlay,
  HiSearch,
} from "react-icons/hi";
import { useMediaQuery } from "@mantine/hooks";
import RepertoireYouTubeLink from "./RepertoireYouTubeLink";
import { Link } from "@/i18n/navigation";
import useSongs from "@/app/hook/useSongs";
import historyHelper from "@/app/lib/history";
import { formatDate } from "@/app/lib/formatDate";
import {
  buildRepertoire,
  filterRepertoire,
  getRepertoirePlaybackLinks,
  sortRepertoire,
  getDefaultRepertoireSortDirection,
  type RepertoireSort,
  type RepertoireSortDirection,
} from "@/app/lib/repertoire";

const PAGE_SIZE = 100;
const sortableColumns: { label: string; sort: RepertoireSort }[] = [
  { label: "songTitle", sort: "title" },
  { label: "artistLabel", sort: "artist" },
  { label: "sourceLabel", sort: "source" },
  { label: "tagsColumn", sort: "tags" },
  { label: "performanceCountLabel", sort: "count" },
  { label: "latestLabel", sort: "latest" },
];
const readFilters = (params: URLSearchParams) => {
  const sort = sortableColumns.some(
    (column) => column.sort === params.get("sort"),
  )
    ? params.get("sort")!
    : "title";
  const order: RepertoireSortDirection =
    params.get("order") === "asc" || params.get("order") === "desc"
      ? (params.get("order") as RepertoireSortDirection)
      : getDefaultRepertoireSortDirection(sort);
  return {
    query: params.get("q") ?? "",
    source: ["singing", "collaboration", "other"].includes(
      params.get("source") ?? "",
    )
      ? params.get("source")!
      : "",
    tags: params.getAll("tag"),
    sort,
    order,
  };
};

export default function RepertoireClient() {
  const t = useTranslations("Repertoire");
  const locale = useLocale();
  const params = useSearchParams();
  const searchString = params.toString();
  const previewEnabled = useMediaQuery(
    "(min-width: 64em) and (hover: hover) and (pointer: fine)",
    false,
  );
  const { allSongs, isLoading } = useSongs();
  const [filters, setFilters] = useState(() =>
    readFilters(new URLSearchParams(searchString)),
  );
  const [page, setPage] = useState(1);
  const query = useDeferredValue(filters.query);

  useEffect(() => {
    setFilters(readFilters(new URLSearchParams(searchString)));
    setPage(1);
  }, [searchString]);

  const updateFilters = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
    const url = new URL(window.location.href);
    for (const key of ["q", "source", "tag", "sort", "order"])
      url.searchParams.delete(key);
    if (next.query) url.searchParams.set("q", next.query);
    if (next.source) url.searchParams.set("source", next.source);
    for (const tag of next.tags) url.searchParams.append("tag", tag);
    if (next.sort !== "title") url.searchParams.set("sort", next.sort);
    if (next.order !== getDefaultRepertoireSortDirection(next.sort))
      url.searchParams.set("order", next.order);
    historyHelper.replaceUrlIfDifferent(url.href);
  };

  const entries = useMemo(() => buildRepertoire(allSongs), [allSongs]);
  const tags = useMemo(
    () =>
      Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort((a, b) =>
        a.localeCompare(b, locale),
      ),
    [entries, locale],
  );
  const results = useMemo(
    () =>
      sortRepertoire(
        filterRepertoire(entries, query, filters.source, filters.tags),
        filters.sort,
        locale,
        filters.order,
      ),
    [
      entries,
      query,
      filters.source,
      filters.tags,
      filters.sort,
      filters.order,
      locale,
    ],
  );
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (isLoading)
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 py-16 text-gray-600 dark:text-gray-300"
      >
        <Loader size="sm" />
        {t("loading")}
      </div>
    );

  return (
    <>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_2fr_auto]">
        <TextInput
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          leftSection={<HiSearch aria-hidden="true" />}
          value={filters.query}
          onChange={(event) =>
            updateFilters({ query: event.currentTarget.value })
          }
        />
        <Select
          label={t("sourceLabel")}
          value={filters.source}
          allowDeselect={false}
          data={[
            { value: "", label: t("allSources") },
            ...(["singing", "collaboration", "other"] as const).map(
              (value) => ({ value, label: t(`source.${value}`) }),
            ),
          ]}
          onChange={(value) => updateFilters({ source: value ?? "" })}
        />
        <MultiSelect
          label={t("tagsLabel")}
          placeholder={t("tagsPlaceholder")}
          searchable
          clearable
          data={Array.from(new Set([...tags, ...filters.tags]))}
          value={filters.tags}
          onChange={(value) => updateFilters({ tags: value })}
          nothingFoundMessage={t("noTags")}
        />
        <Button
          className="self-end"
          variant="subtle"
          disabled={
            !filters.query &&
            !filters.source &&
            filters.tags.length === 0 &&
            filters.sort === "title" &&
            filters.order === "asc"
          }
          onClick={() =>
            updateFilters({
              query: "",
              source: "",
              tags: [],
              sort: "title",
              order: "asc",
            })
          }
        >
          {t("clearFilters")}
        </Button>
      </div>
      <p
        aria-live="polite"
        className="mb-4 text-sm text-gray-600 dark:text-gray-300"
      >
        {t("resultCount", { count: results.length, total: entries.length })}
      </p>
      {visible.length === 0 ? (
        <div className="border border-dashed border-light-gray-300 px-6 py-14 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-light-gray-200 bg-white/80 dark:border-white/10 dark:bg-gray-900/70">
          <table
            className="block w-full text-left text-sm lg:table"
            aria-label={t("title")}
          >
            <thead className="block overflow-x-auto bg-light-gray-100 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-200 lg:table-header-group">
              <tr className="flex lg:table-row">
                {sortableColumns.map(({ label, sort }) => {
                  const active = filters.sort === sort;
                  const Icon = active
                    ? filters.order === "asc"
                      ? HiChevronUp
                      : HiChevronDown
                    : HiSelector;
                  return (
                    <th
                      key={sort}
                      scope="col"
                      aria-sort={
                        active
                          ? filters.order === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className="shrink-0 px-3 py-2 font-semibold"
                    >
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:text-primary-200 lg:whitespace-normal"
                        aria-label={t("sortBy", { column: t(label) })}
                        onClick={() =>
                          updateFilters({
                            sort,
                            order: active
                              ? filters.order === "asc"
                                ? "desc"
                                : "asc"
                              : getDefaultRepertoireSortDirection(sort),
                          })
                        }
                      >
                        {t(label)}
                        <Icon aria-hidden="true" className="shrink-0" />
                      </button>
                    </th>
                  );
                })}
                <th
                  scope="col"
                  className="hidden px-3 py-2 font-semibold lg:table-cell"
                >
                  {t("playbackLabel")}
                </th>
              </tr>
            </thead>
            <tbody className="block lg:table-row-group">
              {visible.map((entry) => {
                const links = getRepertoirePlaybackLinks(entry.latest);
                return (
                  <tr
                    key={entry.key}
                    className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 border-b border-light-gray-200 p-3 last:border-b-0 hover:bg-light-gray-50/70 dark:border-white/10 dark:hover:bg-gray-800/60 lg:table-row lg:p-0"
                  >
                    <th
                      scope="row"
                      className="col-span-2 min-w-0 text-left align-top lg:w-[18%] lg:px-3 lg:py-2.5"
                    >
                      <h2 className="break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {entry.title}
                      </h2>
                    </th>
                    <td className="col-span-2 break-words text-xs text-gray-600 dark:text-gray-300 lg:w-[13%] lg:px-3 lg:py-2.5">
                      {entry.artist}
                    </td>
                    <td className="col-span-2 lg:w-[14%] lg:px-3 lg:py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {entry.sources.map((source) => (
                          <Badge
                            key={source}
                            size="sm"
                            fz="xs"
                            fw={500}
                            lh={1}
                            px={7}
                            className="max-w-full"
                            styles={{
                              root: {
                                height: "auto",
                                minHeight: 22,
                                paddingBlock: 4,
                                letterSpacing: 0,
                              },
                              label: { whiteSpace: "normal" },
                            }}
                            color={
                              source === "singing"
                                ? "green"
                                : source === "collaboration"
                                  ? "blue"
                                  : "gray"
                            }
                            variant="light"
                          >
                            {t(`source.${source}`)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="col-span-2 lg:w-[25%] lg:px-3 lg:py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <Button
                            key={tag}
                            size="compact-xs"
                            variant={
                              filters.tags.includes(tag) ? "filled" : "light"
                            }
                            aria-pressed={filters.tags.includes(tag)}
                            onClick={() =>
                              updateFilters({
                                tags: filters.tags.includes(tag)
                                  ? filters.tags.filter(
                                      (value) => value !== tag,
                                    )
                                  : [...filters.tags, tag],
                              })
                            }
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-gray-600 dark:text-gray-300 lg:whitespace-nowrap lg:px-3 lg:py-2.5">
                      <span className="mr-2 lg:hidden">
                        {t("performanceCountLabel")}
                      </span>
                      {t("performanceCount", { count: entry.count })}
                    </td>
                    <td
                      className="text-xs text-gray-600 dark:text-gray-300 lg:whitespace-nowrap lg:px-3 lg:py-2.5"
                      title={entry.latest.video_title}
                    >
                      <span className="mr-2 lg:hidden">{t("latestLabel")}</span>
                      {Number.isFinite(Date.parse(entry.latest.broadcast_at))
                        ? formatDate(entry.latest.broadcast_at, locale, {
                            timeZone: "Asia/Tokyo",
                          })
                        : t("unknownDate")}
                    </td>
                    <td className="col-span-2 lg:px-3 lg:py-2.5">
                      <div className="flex flex-wrap gap-1.5 lg:flex-nowrap">
                        {links ? (
                          <>
                            <Button
                              component={Link}
                              href={links.songDb}
                              prefetch={false}
                              size="compact-xs"
                              leftSection={<HiPlay aria-hidden="true" />}
                              aria-label={t("playLabel", {
                                title: entry.title,
                              })}
                            >
                              {t("play")}
                            </Button>
                            <RepertoireYouTubeLink
                              song={entry.latest}
                              href={links.youtube}
                              previewEnabled={previewEnabled}
                            />
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t("noVideo")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 ? (
        <div className="mt-5 flex justify-center">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={(value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : null}
    </>
  );
}
