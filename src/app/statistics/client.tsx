"use client";

import { useState, useEffect, useMemo } from "react";
import { Select, Tabs } from "@mantine/core";
import { HiArrowUp } from "react-icons/hi";
import { useTranslations } from "next-intl";

import DataTable from "./datatable";
import SongCountOverview from "./SongCountOverview";
import { useSongData } from "../hook/useSongData";
import { useStatistics } from "../hook/useStatistics";
import useStatViewCounts from "../hook/useStatViewCounts";
import Loading from "../loading";
import historyHelper from "../lib/history";
import { buildViewMilestoneInfo } from "../lib/viewMilestone";
import { StatisticsItem } from "../types/statisticsItem";
import { getTabsConfig } from "./tabsConfig";

export default function StatisticsPage() {
  const t = useTranslations("Statistics");
  const tabsConfig = useMemo(() => getTabsConfig(t), [t]);

  const tabKeys = useMemo(
    () => tabsConfig.map((tab) => tab.dataKey),
    [tabsConfig],
  );
  const defaultTab = tabKeys[0] ?? "songCounts";

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { songs, loading } = useSongData();

  const statistics = useStatistics({
    songs,
  });

  const viewLabelVideoIds = useMemo(
    () =>
      [
        ...statistics.originalSongCountsByReleaseDate,
        ...statistics.coverSongCountsByReleaseDate,
      ]
        .map(
          (item) =>
            item.song?.video_id ||
            item.firstVideo?.video_id ||
            item.lastVideo?.video_id,
        )
        .filter(Boolean),
    [
      statistics.originalSongCountsByReleaseDate,
      statistics.coverSongCountsByReleaseDate,
    ],
  );

  const { data: viewStatisticsByVideoId } =
    useStatViewCounts(viewLabelVideoIds);

  const statisticsWithMilestones = useMemo(() => {
    const attachMilestone = (
      items: typeof statistics.originalSongCountsByReleaseDate,
    ) =>
      items.map((item) => {
        const statVideoId =
          item.song?.video_id ||
          item.firstVideo?.video_id ||
          item.lastVideo?.video_id ||
          "";
        const history = viewStatisticsByVideoId[statVideoId] || [];
        const latestHistoryViewCount =
          history[history.length - 1]?.viewCount ?? 0;
        const songViewCount = Number(item.song?.view_count ?? 0);
        const effectiveViewCount =
          songViewCount > 0 ? songViewCount : latestHistoryViewCount;

        return {
          ...item,
          statVideoId,
          effectiveViewCount,
          viewMilestone: buildViewMilestoneInfo(effectiveViewCount, history),
        };
      });

    return {
      ...statistics,
      originalSongCountsByReleaseDate: attachMilestone(
        statistics.originalSongCountsByReleaseDate,
      ),
      coverSongCountsByReleaseDate: attachMilestone(
        statistics.coverSongCountsByReleaseDate,
      ),
    };
  }, [statistics, viewStatisticsByVideoId]);

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId((prev) => (prev === videoId ? null : videoId));
  };

  const rankedDesignTabs = new Set([
    "songCounts",
    "artistCounts",
    "originalSongCounts",
    "tagCounts",
    "videoCounts",
  ]);

  const hideTopTileTabs = new Set([
    "milestoneCounts",
    "videoCounts",
    "originalSongCountsByReleaseDate",
    "coverSongCountsByReleaseDate",
  ]);

  const viewCountBarTabs = new Set([
    "originalSongCountsByReleaseDate",
    "coverSongCountsByReleaseDate",
  ]);

  const milestoneOverviewTabs = new Set([
    "originalSongCountsByReleaseDate",
    "coverSongCountsByReleaseDate",
  ]);

  const getOverviewLabels = (
    dataKey: keyof typeof statisticsWithMilestones,
  ) => {
    switch (dataKey) {
      case "songCounts":
        return {
          primaryLabel: t("overview.songCounts.primaryLabel"),
          totalCountLabel: t("overview.songCounts.totalCountLabel"),
          topLabel: t("overview.songCounts.topLabel"),
          countUnit: t("overview.songCounts.countUnit"),
        };
      case "artistCounts":
        return {
          primaryLabel: t("overview.artistCounts.primaryLabel"),
          totalCountLabel: t("overview.artistCounts.totalCountLabel"),
          topLabel: t("overview.artistCounts.topLabel"),
          countUnit: t("overview.artistCounts.countUnit"),
        };
      case "originalSongCounts":
        return {
          primaryLabel: t("overview.originalSongCounts.primaryLabel"),
          totalCountLabel: t("overview.originalSongCounts.totalCountLabel"),
          topLabel: t("overview.originalSongCounts.topLabel"),
          countUnit: t("overview.originalSongCounts.countUnit"),
        };
      case "tagCounts":
        return {
          primaryLabel: t("overview.tagCounts.primaryLabel"),
          totalCountLabel: t("overview.tagCounts.totalCountLabel"),
          topLabel: t("overview.tagCounts.topLabel"),
          countUnit: t("overview.tagCounts.countUnit"),
        };
      case "milestoneCounts":
        return {
          primaryLabel: t("overview.milestoneCounts.primaryLabel"),
          totalCountLabel: t("overview.milestoneCounts.totalCountLabel"),
          topLabel: t("overview.milestoneCounts.topLabel"),
          countUnit: t("overview.milestoneCounts.countUnit"),
        };
      case "videoCounts":
        return {
          primaryLabel: t("overview.videoCounts.primaryLabel"),
          totalCountLabel: t("overview.videoCounts.totalCountLabel"),
          topLabel: t("overview.videoCounts.topLabel"),
          countUnit: t("overview.videoCounts.countUnit"),
        };
      case "originalSongCountsByReleaseDate":
        return {
          primaryLabel: t(
            "overview.originalSongCountsByReleaseDate.primaryLabel",
          ),
          totalCountLabel: t(
            "overview.originalSongCountsByReleaseDate.totalCountLabel",
          ),
          topLabel: "",
          countUnit: t("overview.originalSongCountsByReleaseDate.countUnit"),
        };
      case "coverSongCountsByReleaseDate":
        return {
          primaryLabel: t("overview.coverSongCountsByReleaseDate.primaryLabel"),
          totalCountLabel: t(
            "overview.coverSongCountsByReleaseDate.totalCountLabel",
          ),
          topLabel: "",
          countUnit: t("overview.coverSongCountsByReleaseDate.countUnit"),
        };
      default:
        return {
          primaryLabel: t("overview.default.primaryLabel"),
          totalCountLabel: t("overview.default.totalCountLabel"),
          topLabel: t("overview.default.topLabel"),
          countUnit: t("overview.default.countUnit"),
        };
    }
  };

  const resolveTabFromSearchParam = (tabParam: string | null) => {
    if (!tabParam) return defaultTab;

    const matchedByKey = tabKeys.find((key) => key === tabParam);
    if (matchedByKey) return matchedByKey;

    if (/^\d+$/.test(tabParam)) {
      const tabIndex = Number(tabParam);
      if (tabIndex >= 0 && tabIndex < tabKeys.length) {
        return tabKeys[tabIndex];
      }
    }

    return defaultTab;
  };

  const handleTabChange = (nextTab: string | null) => {
    if (!nextTab || nextTab === activeTab) return;

    setActiveTab(nextTab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    historyHelper.replaceUrlIfDifferent(url.href);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    setActiveTab(resolveTabFromSearchParam(url.searchParams.get("tab")));

    const handlePopState = () => {
      const nextUrl = new URL(window.location.href);
      setActiveTab(resolveTabFromSearchParam(nextUrl.searchParams.get("tab")));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultTab, tabKeys]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeTabConfig = useMemo(
    () => tabsConfig.find((tab) => tab.dataKey === activeTab),
    [activeTab, tabsConfig],
  );

  if (loading) {
    return (
      <div className="grow lg:p-6 lg:pb-0 relative">
        <Loading />
      </div>
    );
  }

  return (
    <div className="grow">
      <h1 className="font-extrabold text-2xl p-3">{t("title")}</h1>

      <Tabs value={activeTab} onChange={handleTabChange} variant="default">
        <div className="md:hidden px-3 pb-2">
          <Select
            aria-label={t("selectTabAriaLabel")}
            value={activeTab}
            onChange={handleTabChange}
            data={tabsConfig.map((tab) => ({
              value: tab.dataKey,
              label: tab.title,
            }))}
            searchable={false}
            allowDeselect={false}
            checkIconPosition="right"
            comboboxProps={{ withinPortal: false }}
          />
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 hidden md:block">
          <Tabs.List className="flex whitespace-nowrap overflow-x-auto overflow-y-hidden">
            {tabsConfig.map((tab) => (
              <Tabs.Tab
                id={`tab-${tabsConfig.indexOf(tab)}`}
                key={`${tab.title}-${tab.dataKey}-header`}
                value={tab.dataKey}
                leftSection={
                  tab.icon ? <tab.icon className="h-4 w-4" /> : undefined
                }
                className="px-4"
              >
                {tab.title}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </div>

        {activeTabConfig && (
          <Tabs.Panel
            key={activeTabConfig.dataKey}
            value={activeTabConfig.dataKey}
          >
            <SongCountOverview
              items={
                statisticsWithMilestones[
                  activeTabConfig.dataKey
                ] as StatisticsItem[]
              }
              {...getOverviewLabels(activeTabConfig.dataKey)}
              showMilestoneHighlights={milestoneOverviewTabs.has(
                activeTabConfig.dataKey,
              )}
              showTopTile={!hideTopTileTabs.has(activeTabConfig.dataKey)}
            />
            <DataTable
              key={activeTabConfig.dataKey}
              data={statisticsWithMilestones[activeTabConfig.dataKey]}
              caption={activeTabConfig.caption}
              description={activeTabConfig.description}
              columns={activeTabConfig.columns}
              minWidth={activeTabConfig.minWidth}
              initialSortColumnId={activeTabConfig.initialSort.id}
              initialSortDirection={activeTabConfig.initialSort.direction}
              visualMode={
                rankedDesignTabs.has(activeTabConfig.dataKey)
                  ? "ranked"
                  : viewCountBarTabs.has(activeTabConfig.dataKey)
                    ? "viewCountBar"
                    : "default"
              }
              countUnit={
                activeTabConfig.dataKey === "videoCounts"
                  ? t("units.songs")
                  : t("units.times")
              }
              {...(activeTabConfig.dataKey === "videoCounts" && {
                onRowClick: handleVideoClick,
                selectedVideoId: selectedVideoId,
                songs: songs,
              })}
            />
          </Tabs.Panel>
        )}
      </Tabs>

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label={t("backToTopAriaLabel")}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center justify-center rounded-full bg-primary-600 p-3 text-white shadow-lg transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <HiArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
