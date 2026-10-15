"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tooltip } from "@mantine/core";
import {
  dateKeyToUtc,
  getActivityJourneyStats,
  type ActivityJourneyStats,
} from "../activity/activityJourneyUtils";

type ActivityDaysBadgeProps = {
  variant?: "header" | "light";
};

export default function ActivityDaysBadge({
  variant = "header",
}: ActivityDaysBadgeProps) {
  const t = useTranslations("Header");
  // SSR と最初の client render を揃え、キャッシュされた日数を表示しない。
  const [stats, setStats] = useState<ActivityJourneyStats | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const refresh = () => {
      window.clearTimeout(timer);
      const now = new Date();
      const stats = getActivityJourneyStats(now);
      setStats(stats);

      // 次の JST 00:00 に更新。日付の基準は活動記録と共通。
      const nextMidnight = dateKeyToUtc(stats.today) + 15 * 60 * 60 * 1000;
      timer = window.setTimeout(refresh, nextMidnight - now.getTime());
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const activityDays = stats?.activityDays ?? null;
  const description =
    activityDays === null
      ? undefined
      : t("activityDaysDescription", { days: activityDays });

  return (
    <Tooltip
      label={stats ? t("activityDuration", stats.duration) : ""}
      disabled={!stats}
      position="bottom"
      withArrow
      events={{ hover: true, focus: true, touch: false }}
    >
      <Link
        href="/activity"
        aria-label={description}
        className={`inline-flex h-8 shrink-0 items-center gap-1 overflow-hidden whitespace-nowrap rounded-full pl-0.5 pr-2 text-[10px] leading-none md:h-10 md:gap-1.5 md:pr-2.5 md:text-xs ${
          variant === "header"
            ? "bg-white/12 text-white/90"
            : "bg-primary/8 text-primary dark:bg-pink-300/12 dark:text-pink-100"
        }`}
      >
        <Image
          src="/azki-header-chibi.webp"
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          unoptimized
          className="h-8 w-auto shrink-0 self-end md:h-10"
        />
        <span>{t("activityLabel")}</span>
        <span className="min-w-[5ch] font-semibold tabular-nums">
          {t("activityDays", { days: activityDays ?? "—" })}
        </span>
      </Link>
    </Tooltip>
  );
}
