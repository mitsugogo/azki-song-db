"use client";

import { ROUTE_RANGES } from "../config/timelineRoutes";
import { useTranslations } from "next-intl";
import {
  ACTIVITY_DEBUT_DATE,
  formatJourneyDate,
  getActivityJourneyStats,
  getJourneyPosition,
} from "./activityJourneyUtils";
import { Text } from "@mantine/core";
type JourneyMarker = {
  date: string;
  label: string;
  compactLabel: string;
  placement: "above" | "below";
};

const PIONEER_APPEARANCE_DATE = "2023-05-14";
const MILLION_SUBSCRIBERS_DATE = "2024-04-27";

export default function ActivityJourney() {
  const t = useTranslations("Summary");
  const stats = getActivityJourneyStats();
  const duration = t("duration", {
    years: String(stats.duration.years),
    months: String(stats.duration.months),
    days: String(stats.duration.days),
  });

  const routeMarkers: JourneyMarker[] = ROUTE_RANGES.map((route, index) => ({
    date: route.from,
    label:
      index === 0
        ? `${t("journey.debut")} / ${t(route.labelKey!)}`
        : t(route.labelKey!),
    compactLabel: index === 0 ? t("journey.debut") : t(route.labelKey!),
    placement: index === 1 || index === 2 ? "above" : "below",
  }));
  const pioneerMarker: JourneyMarker = {
    date: PIONEER_APPEARANCE_DATE,
    label: t("journey.pioneersAppear"),
    compactLabel: t("journey.pioneersAppearCompact"),
    placement: "below",
  };
  const millionSubscribersMarker: JourneyMarker = {
    date: MILLION_SUBSCRIBERS_DATE,
    label: t("journey.millionSubscribers"),
    compactLabel: t("journey.millionSubscribersCompact"),
    placement: "below",
  };
  const markers = [
    ...routeMarkers,
    pioneerMarker,
    millionSubscribersMarker,
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section
      className="relative mb-4 h-32 overflow-hidden rounded-xl border border-pink-200/50 bg-azki-100/50 px-2 dark:border-white/10 dark:bg-gray-800/30 sm:px-3"
      aria-label={t("journey.ariaLabel", {
        days: stats.activityDays,
        duration,
      })}
    >
      <div className="absolute left-2 top-1 z-30 flex items-baseline gap-1.5 sm:left-3 p-1">
        <span className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-300 sm:text-xs">
          {t("journey.daysLabel")}
        </span>
        <span className="text-base font-black tabular-nums leading-none text-primary sm:text-lg">
          {t("journey.daysValue", { days: stats.activityDays })}
        </span>
        <span className="hidden text-[10px] text-gray-500 dark:text-gray-400 md:inline">
          {t("journey.duration", { duration })}
        </span>
      </div>
      <div className="absolute right-2 top-3 z-30 text-right sm:right-3">
        <span className="block text-[9px] font-bold leading-none text-primary dark:text-pink-200 sm:text-[10px]">
          {t("journey.today")}
        </span>
        <Text c="dimmed">
          <time
            dateTime={stats.today}
            className="mt-0.5 block text-[8px] tabular-nums leading-none sm:text-[9px]"
          >
            {formatJourneyDate(stats.today)}
          </time>
        </Text>
      </div>

      <div className="absolute inset-x-2 top-17 z-10 h-px bg-linear-to-r from-violet-400/55 via-cyan-400/55 to-primary/75 dark:from-violet-300/45 dark:via-cyan-300/45 dark:to-pink-300/70">
        <span className="absolute -right-0.5 -top-0.75 size-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-primary/70" />
      </div>

      {markers.map((marker, index) => {
        const position = getJourneyPosition(marker.date, stats.today);
        const isFirst = index === 0;
        const isAbove = marker.placement === "above";

        return (
          <div
            key={`${marker.date}-${marker.label}`}
            className="absolute top-17 z-20"
            style={{
              left: isFirst ? "0.5rem" : `${position}%`,
            }}
          >
            <span className="absolute -left-1 -top-1 size-2 rounded-full border-2 border-white bg-primary shadow-sm dark:border-gray-900" />
            <span
              className={`absolute left-0 h-2 w-px bg-gray-400/50 dark:bg-gray-400/40 ${
                isAbove ? "-top-3" : "top-1"
              }`}
            />
            <div
              className={`absolute ${isAbove ? "bottom-3" : "top-3"} ${
                isFirst
                  ? "left-0 text-left"
                  : "left-0 -translate-x-1/2 text-center"
              }`}
            >
              <MarkerLabel marker={marker} />
            </div>
          </div>
        );
      })}

      <span className="absolute right-2 top-16 z-20 size-2 rounded-full border-2 border-white bg-primary shadow-sm dark:border-gray-900" />
    </section>
  );
}

function MarkerLabel({ marker }: { marker: JourneyMarker }) {
  return (
    <span className="flex flex-col whitespace-nowrap">
      <span className="text-[8px] font-semibold leading-none text-gray-600 dark:text-gray-300 sm:text-[10px]">
        <span className="hidden sm:inline">{marker.label}</span>
        <span className="sm:hidden">{marker.compactLabel}</span>
      </span>
      <time
        dateTime={marker.date}
        className="mt-1 text-[7px] tabular-nums leading-none text-gray-400 dark:text-gray-300 sm:text-[9px]"
      >
        {formatJourneyDate(marker.date)}
      </time>
    </span>
  );
}
