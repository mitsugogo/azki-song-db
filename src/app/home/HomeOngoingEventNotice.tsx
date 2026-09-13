"use client";

import { Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "../../i18n/navigation";
import { isEventActive } from "../lib/highlights";
import type { EventItem } from "../types/eventItem";

type HomeOngoingEventNoticeProps = {
  events: EventItem[];
};

export function HomeOngoingEventNotice({
  events,
}: HomeOngoingEventNoticeProps) {
  const t = useTranslations("Home");
  const event = events.find((item) => isEventActive(item));

  if (!event) {
    return null;
  }

  return (
    <aside className="mb-6 rounded-lg border border-gray-200/60 bg-white/40 px-4 py-3 text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Text size="sm" className="min-w-0 whitespace-pre-line break-words">
          {t("eventOngoingTitle", { title: event.content })}
        </Text>
        {event.url ? (
          <Link
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded text-xs text-gray-500 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-400"
          >
            <FaExternalLinkAlt className="text-[0.6rem]" aria-hidden="true" />
            {t("linkLabel")}
          </Link>
        ) : null}
      </div>
      {event.note ? (
        <Text
          size="xs"
          c="dimmed"
          className="mt-1 whitespace-pre-line break-words"
        >
          {event.note}
        </Text>
      ) : null}
    </aside>
  );
}
