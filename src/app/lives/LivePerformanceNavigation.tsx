"use client";

import { Tabs } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { formatLiveDate } from "@/app/lib/liveSetlists";
import {
  getLiveComparisonPath,
  getLivePerformancePath,
  getLiveTitlePath,
} from "@/app/lib/livePaths";
import type { LiveTitleGroup } from "@/app/types/live";
import { Link } from "@/i18n/navigation";

export default function LivePerformanceNavigation({
  group,
  selectedId,
}: {
  group: LiveTitleGroup;
  selectedId: string;
}) {
  const t = useTranslations("Lives");
  const locale = useLocale();
  const comparisonPath = getLiveComparisonPath(group);
  if (!comparisonPath) return null;

  return (
    <Tabs value={selectedId} className="mb-6">
      <Tabs.List aria-label={t("performanceSelectorLabel")}>
        <Tabs.Tab
          renderRoot={(props) => <Link {...props} href={comparisonPath} />}
          value="all"
        >
          {t("allPerformances")}
        </Tabs.Tab>
        {group.performances.map((performance) => {
          const path =
            getLivePerformancePath(group, performance.id) ??
            getLiveTitlePath(group);
          return (
            <Tabs.Tab
              key={performance.id}
              renderRoot={(props) => <Link {...props} href={path} />}
              value={performance.id}
            >
              {performance.performance ||
                formatLiveDate(performance.date, locale)}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs>
  );
}
