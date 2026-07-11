"use client";

import { Badge, Skeleton, Text } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { BsGeoAlt } from "react-icons/bs";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "../../i18n/navigation";
import { formatDate } from "../lib/formatDate";
import {
  getDaysUntil,
  getFeaturedEvents,
  isEventActive,
  parseToJstDayStart,
} from "../lib/highlights";
import type { EventItem } from "../types/eventItem";

type HomeEventsSectionProps = {
  events: EventItem[];
  isLoading: boolean;
};

export const HomeEventsSection = memo(function HomeEventsSection({
  events,
  isLoading,
}: HomeEventsSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const tAnniversaries = useTranslations("Anniversaries");
  const featuredEvents = useMemo(() => getFeaturedEvents(events, 3), [events]);

  if (featuredEvents.length === 0) {
    return null;
  }

  const formatEventRange = (startAt: string, endAt: string) => {
    const startLabel = formatDate(startAt, locale);
    if (!endAt) {
      return startLabel;
    }

    const startDate = parseToJstDayStart(startAt);
    const endDate = parseToJstDayStart(endAt);
    if (!startDate || !endDate || startDate.getTime() === endDate.getTime()) {
      return startLabel;
    }

    const separator = locale === "ja" ? "〜" : " - ";
    return `${startLabel}${separator}${formatDate(endAt, locale)}`;
  };

  return (
    <div className="mt-16 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          EVENTS
        </p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {t("eventsTitle")}
        </h3>
      </div>
      <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
        <div className="mt-4 space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`event-skeleton-${index}`}
                  className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                  aria-hidden="true"
                >
                  <Skeleton height={12} width="30%" radius="sm" />
                  <Skeleton height={16} radius="sm" className="mt-2" />
                  <Skeleton
                    height={12}
                    width="65%"
                    radius="sm"
                    className="mt-2"
                  />
                </div>
              ))
            : featuredEvents.map((event, index) => {
                const active = isEventActive(event);
                const daysUntilEvent = getDaysUntil(
                  active ? event.end_at || event.start_at : event.start_at,
                );
                const showDaysUntilEvent =
                  daysUntilEvent !== null && (!active || daysUntilEvent > 0);

                return (
                  <div
                    key={`${event.start_at}-${event.content}-${index}`}
                    className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1">
                          {active ? (
                            <>
                              <Badge
                                color="pink"
                                size="md"
                                radius="lg"
                                className="mr-1"
                              >
                                {t("eventOngoing")}
                              </Badge>
                              {showDaysUntilEvent ? (
                                <Badge
                                  color="pink"
                                  size="md"
                                  radius="lg"
                                  variant="outline"
                                >
                                  {tAnniversaries("daysUntil", {
                                    days: daysUntilEvent,
                                  })}
                                </Badge>
                              ) : null}
                            </>
                          ) : showDaysUntilEvent ? (
                            <Badge
                              color="pink"
                              size="md"
                              radius="lg"
                              variant="outline"
                            >
                              {tAnniversaries("daysUntil", {
                                days: daysUntilEvent,
                              })}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Text size="xs" c="dimmed">
                            {event.place ? (
                              <>
                                <BsGeoAlt className="mr-1 inline" />
                                {event.place_url ? (
                                  <Link
                                    href={event.place_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {event.place}
                                  </Link>
                                ) : (
                                  event.place
                                )}
                                <span className="mx-1">|</span>
                              </>
                            ) : null}
                            {formatEventRange(event.start_at, event.end_at)}
                          </Text>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                          {event.content}
                        </p>
                        {event.note ? (
                          <Text
                            size="xs"
                            c="dimmed"
                            className="mt-1 whitespace-pre-line"
                          >
                            {event.note}
                          </Text>
                        ) : null}
                      </div>
                      {event.url ? (
                        <Link
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:text-pink-100"
                        >
                          <FaExternalLinkAlt className="text-[0.65rem]" />
                          {t("linkLabel")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
        </div>
      </section>
    </div>
  );
});
