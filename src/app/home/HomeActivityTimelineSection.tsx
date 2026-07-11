"use client";

import { useIntersection } from "@mantine/hooks";
import { memo, useEffect, useMemo, useState } from "react";
import ActivityTimelineSection from "../components/ActivityTimelineSection";
import useActivityTimeline from "../hook/useActivityTimeline";
import type { MilestoneItem } from "../hook/useMilestones";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { EventItem } from "../types/eventItem";
import type { Song } from "../types/song";

const PAGE_SIZE = 5;

type HomeActivityTimelineSectionProps = {
  channels: ChannelEntry[];
  events: EventItem[];
  isEventsLoading: boolean;
  isMilestonesLoading: boolean;
  isSongsLoading: boolean;
  milestones: MilestoneItem[];
  songs: Song[];
};

export const HomeActivityTimelineSection = memo(
  function HomeActivityTimelineSection({
    channels,
    events,
    isEventsLoading,
    isMilestonesLoading,
    isSongsLoading,
    milestones,
    songs,
  }: HomeActivityTimelineSectionProps) {
    const [shouldLoadViewStatistics, setShouldLoadViewStatistics] =
      useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const { ref, entry } = useIntersection<HTMLElement>({
      rootMargin: "420px 0px",
      threshold: 0,
    });

    useEffect(() => {
      if (entry?.isIntersecting) {
        setShouldLoadViewStatistics(true);
      }
    }, [entry?.isIntersecting]);

    const { items, isLoading, isViewMilestonesLoading } = useActivityTimeline({
      songs,
      events,
      milestones,
      isSongsLoading,
      isEventsLoading,
      isMilestonesLoading,
      limit: 160,
      songUpdateLimit: 80,
      archiveLimit: 80,
      enabled: shouldLoadViewStatistics,
    });
    const visibleItems = useMemo(
      () => items.slice(0, visibleCount),
      [items, visibleCount],
    );

    return (
      <ActivityTimelineSection
        sectionRef={ref}
        items={visibleItems}
        isLoading={isLoading}
        isViewMilestonesLoading={isViewMilestonesLoading}
        shouldLoadViewStatistics={shouldLoadViewStatistics}
        channels={channels}
        hasMoreItems={items.length > visibleItems.length}
        onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
      />
    );
  },
);
