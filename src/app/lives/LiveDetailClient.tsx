"use client";

import { Badge, Button } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { HiExternalLink } from "react-icons/hi";
import {
  formatLiveDate,
  isAzkiSungOfficialFesEntry,
} from "@/app/lib/liveSetlists";
import type { LiveTitleGroup } from "@/app/types/live";
import LivePerformanceNavigation from "./LivePerformanceNavigation";
import LiveTitleHeader from "./LiveTitleHeader";

const DetailItem = ({ label, value }: { label: string; value: string }) =>
  value ? (
    <div className="rounded-xl border border-light-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-gray-800/70">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}
      </dd>
    </div>
  ) : null;

export default function LiveDetailClient({
  group,
  initialPerformanceId,
}: {
  group: LiveTitleGroup;
  initialPerformanceId: string;
}) {
  const t = useTranslations("Lives");
  const locale = useLocale();
  const selected =
    group.performances.find(
      (performance) => performance.id === initialPerformanceId,
    ) ?? group.performances[0];

  return (
    <>
      <LiveTitleHeader group={group} />
      <LivePerformanceNavigation group={group} selectedId={selected.id} />

      <section aria-labelledby="live-information-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="live-information-heading"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            {selected.performance || t("performanceInformation")}
          </h2>
          {selected.url ? (
            <Button
              component="a"
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              rightSection={<HiExternalLink aria-hidden="true" />}
            >
              {t("officialPage")}
            </Button>
          ) : null}
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label={t("date")}
            value={formatLiveDate(selected.date, locale)}
          />
          <DetailItem label={t("doorsTime")} value={selected.doorsTime} />
          <DetailItem label={t("startTime")} value={selected.startTime} />
          <DetailItem label={t("venue")} value={selected.venue} />
          <DetailItem label={t("performers")} value={selected.performers} />
          <DetailItem label={t("ticket")} value={selected.ticket} />
        </dl>
        {selected.note ? (
          <div className="mt-3 rounded-xl border border-light-gray-200 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-900/60">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("note")}
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
              {selected.note}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="setlist-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2
            id="setlist-heading"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            {t("setlist")}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("songCount", { count: selected.setlist.length })}
          </span>
        </div>
        {selected.setlist.length > 0 ? (
          <ol className="space-y-3">
            {selected.setlist.map((entry, index) => (
              <li
                key={`${selected.id}-${entry.order}-${index}`}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 odd:bg-white/75 even:bg-light-gray-100/50 p-3 dark:border-white/10 dark:bg-gray-900/65 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
              >
                <div className="flex h-7 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                  {entry.order || index + 1}
                </div>
                <div className="min-w-0">
                  <h3
                    className={`font-bold ${
                      isAzkiSungOfficialFesEntry(group.category, entry)
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {entry.title}
                  </h3>
                  <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {entry.artist ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold">
                          {t("artist")}
                        </dt>
                        <dd>{entry.artist}</dd>
                      </div>
                    ) : null}
                    {entry.singers ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold">
                          {t("singers")}
                        </dt>
                        <dd>{entry.singers}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {entry.note ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600 dark:border-white/10 dark:text-gray-300">
                      {entry.note}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-2xl border border-dashed border-light-gray-300 px-6 py-12 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
            {t("setlistEmpty")}
          </div>
        )}
      </section>
    </>
  );
}
