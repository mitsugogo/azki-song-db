"use client";

import { useLocale, useTranslations } from "next-intl";
import { BsCalendarEvent } from "react-icons/bs";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "../../i18n/navigation";
import { formatEventRange } from "../lib/formatEventRange";
import { isEventActive } from "../lib/highlights";
import type { EventItem } from "../types/eventItem";
import { homeHighlightCardClasses } from "./homeHighlightCardStyles";

type HomeOngoingEventNoticeProps = {
  events: EventItem[];
};

export function HomeOngoingEventNotice({
  events,
}: HomeOngoingEventNoticeProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const ongoingEvents = events.filter((item) => isEventActive(item));

  if (ongoingEvents.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t("ongoingEventsTitle")}
      className="mx-auto mb-8 w-full max-w-3xl"
    >
      <h2 className="mb-2 px-1 text-xs font-semibold text-primary dark:text-pink-200">
        {t("ongoingEventsTitle")}
      </h2>
      <ul className="space-y-1.5">
        {ongoingEvents.map((event, index) => {
          const content = (
            <>
              <BsCalendarEvent
                aria-hidden="true"
                className="size-4 shrink-0 text-primary dark:text-pink-200"
              />
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line break-words text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                  {event.content}
                </p>
                <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-300">
                  {formatEventRange(event.start_at, event.end_at, locale, {
                    compact: true,
                  })}
                </p>
                {event.note ? (
                  <p className="mt-0.5 whitespace-pre-line break-words text-xs text-gray-500 dark:text-gray-300">
                    {event.note}
                  </p>
                ) : null}
              </div>
            </>
          );

          return (
            <li key={`${event.start_at}-${event.content}-${index}`}>
              {event.url ? (
                <Link
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("eventOngoingTitle", { title: event.content })}
                  className={`${homeHighlightCardClasses.compactCard} ${homeHighlightCardClasses.interactive}`}
                >
                  {content}
                  <span
                    className={homeHighlightCardClasses.compactAction}
                    title={t("linkLabel")}
                  >
                    <FaExternalLinkAlt
                      className="size-3.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              ) : (
                <div className={homeHighlightCardClasses.compactCard}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
