"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zenMaruGothic } from "@/app/fonts";
import { getOrdinal } from "@/app/lib/formatDate";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CELEBRATION_WINDOW_MS = 3 * DAY_MS;

function getJstParts(now: Date) {
  const shifted = new Date(now.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [days, hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(" : ");
}

export default function UnitAnniversaryStatus({
  formedAt,
  anniversaryMonth,
  anniversaryDay,
  unitName,
  initialNowIso,
  freezeNow = false,
}: {
  formedAt: string;
  anniversaryMonth: number;
  anniversaryDay: number;
  unitName: string;
  initialNowIso: string;
  freezeNow?: boolean;
}) {
  const t = useTranslations("Units");
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date(initialNowIso));

  useEffect(() => {
    if (freezeNow) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [freezeNow]);

  const status = useMemo(() => {
    const parts = getJstParts(now);
    const formedYear = Number(formedAt.slice(0, 4));
    const getAnniversaryTimestamp = (year: number) =>
      Date.UTC(year, anniversaryMonth - 1, anniversaryDay) - JST_OFFSET_MS;
    const thisYearTarget = getAnniversaryTimestamp(parts.year);
    const previousYearTarget = getAnniversaryTimestamp(parts.year - 1);
    const celebrationTarget =
      now.getTime() >= thisYearTarget ? thisYearTarget : previousYearTarget;
    const celebrationYear =
      now.getTime() >= thisYearTarget ? parts.year : parts.year - 1;
    const isCelebrating =
      now.getTime() >= celebrationTarget &&
      now.getTime() < celebrationTarget + CELEBRATION_WINDOW_MS;
    const countdownYear =
      now.getTime() < thisYearTarget ? parts.year : parts.year + 1;
    const anniversaryYear = isCelebrating ? celebrationYear : countdownYear;
    const number = anniversaryYear - formedYear;
    const target = getAnniversaryTimestamp(countdownYear);
    const remaining = target - now.getTime();
    return { anniversaryYear, number, remaining, isCelebrating };
  }, [anniversaryDay, anniversaryMonth, formedAt, now]);

  const anniversaryLabel = locale.startsWith("ja")
    ? t("anniversaryNumberJa", { number: status.number })
    : t("anniversaryNumberEn", { ordinal: getOrdinal(status.number) });

  if (status.isCelebrating) {
    return (
      <div className="min-h-24" aria-live="polite">
        <p className="text-sm font-bold tracking-[0.18em] text-primary-700 dark:text-pink-200">
          {anniversaryLabel}
        </p>
        <p className="mt-2 text-xl font-extrabold text-gray-900 dark:text-white">
          {t("heroCongratulations", {
            name: unitName,
            number: status.number,
            ordinal: getOrdinal(status.number),
          })}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {formedAt.replaceAll("-", ".")} — {status.anniversaryYear}.
          {String(anniversaryMonth).padStart(2, "0")}.
          {String(anniversaryDay).padStart(2, "0")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-24" aria-live="polite">
      <p className="text-sm font-semibold text-primary-700 dark:text-pink-200">
        {t("countdownLead", { anniversary: anniversaryLabel })}
      </p>
      <p
        className={`${zenMaruGothic.className} mt-2 text-3xl font-bold tracking-[0.08em] tabular-nums text-gray-900 dark:text-white sm:text-4xl`}
      >
        {formatCountdown(status.remaining)}
      </p>
      <p className="mt-1 text-[11px] font-semibold tracking-[0.22em] text-gray-500 dark:text-gray-400">
        JST
      </p>
    </div>
  );
}
