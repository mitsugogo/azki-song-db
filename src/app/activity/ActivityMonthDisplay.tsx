"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import ActivityTimelineSection, {
  ActivityTimelineFilterMenu,
  DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS,
} from "../components/ActivityTimelineSection";
import { filterActivityTimelineItemsForDisplay } from "../lib/activityTimelineFilters";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ChannelEntry } from "../types/api/yt/channels";
import ActivityCalendarSection from "./ActivityCalendarSection";
import type { ActivityMonth } from "./monthActivity";

type ActivityDisplayMode = "calendar" | "timeline";

type ActivityMonthDisplayProps = {
  activityMonth: ActivityMonth;
  items: ActivityTimelineItem[];
  isLoading: boolean;
  isViewMilestonesLoading: boolean;
  channels: ChannelEntry[];
};

export default function ActivityMonthDisplay({
  activityMonth,
  items,
  isLoading,
  isViewMilestonesLoading,
  channels,
}: ActivityMonthDisplayProps) {
  const t = useTranslations("Summary");
  const [displayMode, setDisplayMode] =
    useState<ActivityDisplayMode>("calendar");
  const [displayFilters, setDisplayFilters] = useState(
    DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS,
  );
  const filteredItems = useMemo(
    () => filterActivityTimelineItemsForDisplay(items, displayFilters),
    [displayFilters, items],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={displayMode}
          onChange={(value) => setDisplayMode(value as ActivityDisplayMode)}
          data={[
            { label: t("calendarView"), value: "calendar" },
            { label: t("timelineView"), value: "timeline" },
          ]}
          aria-label={t("activityViewLabel")}
          size="sm"
          radius="md"
        />
        <ActivityTimelineFilterMenu
          filters={displayFilters}
          onChange={setDisplayFilters}
        />
      </div>

      {displayMode === "calendar" ? (
        <ActivityCalendarSection
          activityMonth={activityMonth}
          items={filteredItems}
          isLoading={isLoading}
          isViewMilestonesLoading={isViewMilestonesLoading}
          channels={channels}
        />
      ) : (
        <ActivityTimelineSection
          items={filteredItems}
          isLoading={isLoading}
          isViewMilestonesLoading={isViewMilestonesLoading}
          shouldLoadViewStatistics
          channels={channels}
          showTitle={false}
          showFilter={false}
          className="mt-6"
        />
      )}
    </>
  );
}
