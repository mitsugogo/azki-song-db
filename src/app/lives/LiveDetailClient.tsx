"use client";

import { Avatar, Badge, Button, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { HiExternalLink } from "react-icons/hi";
import useChannels from "@/app/hook/useChannels";
import {
  createChannelsByParticipantName,
  parseArchiveParticipants,
} from "@/app/lib/archiveParticipants";
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
  const { channels } = useChannels();
  const channelsByName = useMemo(
    () => createChannelsByParticipantName(channels),
    [channels],
  );
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
            {(locale === "en"
              ? selected.performanceEn || selected.performance
              : selected.performance) || t("performanceInformation")}
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
          <DetailItem
            label={t("venue")}
            value={
              locale === "en"
                ? selected.venueEn || selected.venue
                : selected.venue
            }
          />
          <DetailItem
            label={t("performers")}
            value={
              locale === "en"
                ? selected.performersEn || selected.performers
                : selected.performers
            }
          />
          <DetailItem
            label={t("ticket")}
            value={
              locale === "en"
                ? selected.ticketEn || selected.ticket
                : selected.ticket
            }
          />
        </dl>
        {selected.note ? (
          <div className="mt-3 rounded-xl border border-light-gray-200 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-900/60">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("note")}
            </h3>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
              {locale === "en"
                ? selected.noteEn || selected.note
                : selected.note}
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
                    {locale === "en"
                      ? entry.titleEn || entry.title
                      : entry.title}
                  </h3>
                  <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {entry.artist ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold">
                          {t("artist")}
                        </dt>
                        <dd>
                          {locale === "en"
                            ? entry.artistEn || entry.artist
                            : entry.artist}
                        </dd>
                      </div>
                    ) : null}
                    {entry.singers ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold">
                          {t("singers")}
                        </dt>
                        <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {parseArchiveParticipants(
                            locale === "en"
                              ? entry.singersEn || entry.singers
                              : entry.singers,
                          ).map((name) => {
                            const channel = channelsByName.get(
                              name
                                .normalize("NFKC")
                                .trim()
                                .toLocaleLowerCase("ja-JP"),
                            );
                            const avatar = (
                              <Avatar
                                src={channel?.iconUrl || null}
                                alt={name}
                                size={22}
                                radius="xl"
                                color="pink"
                              >
                                {Array.from(name)[0]}
                              </Avatar>
                            );

                            return (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1.5"
                              >
                                <Tooltip
                                  label={channel?.channelName || name}
                                  withArrow
                                >
                                  {channel?.youtubeId ? (
                                    <a
                                      href={`https://www.youtube.com/channel/${encodeURIComponent(channel.youtubeId)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={channel.channelName || name}
                                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    >
                                      {avatar}
                                    </a>
                                  ) : (
                                    <span>{avatar}</span>
                                  )}
                                </Tooltip>
                                <span>{name}</span>
                              </span>
                            );
                          })}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {(
                    locale === "en" ? entry.noteEn || entry.note : entry.note
                  ) ? (
                    <aside className="mt-3 max-w-3xl rounded-r-lg border-l-2 border-primary-200 bg-light-gray-50/80 px-3 py-2 dark:border-primary-800 dark:bg-gray-800/50">
                      <p className="whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {locale === "en"
                          ? entry.noteEn || entry.note
                          : entry.note}
                      </p>
                    </aside>
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
