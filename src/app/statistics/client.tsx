"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { Center, Loader, Select, Tabs, Text } from "@mantine/core";
import { HiArrowUp } from "react-icons/hi";

import DataTable from "./datatable";
import SongCountOverview from "./SongCountOverview";
import { useSongData } from "../hook/useSongData";
import { useStatistics } from "../hook/useStatistics";
import useStatViewCounts from "../hook/useStatViewCounts";
import { TABS_CONFIG } from "./tabsConfig";
import Loading from "../loading";
import historyHelper from "../lib/history";
import { buildViewMilestoneInfo } from "../lib/viewMilestone";
import { StatisticsItem } from "../types/statisticsItem";

export default function StatisticsPage() {
  const tabKeys = useMemo(() => TABS_CONFIG.map((tab) => tab.dataKey), []);
  const defaultTab = tabKeys[0] ?? "songCounts";

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        .map((item) => item.song?.video_id)
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
        const viewCount = Number(item.song?.view_count ?? 0);
        const history = viewStatisticsByVideoId[item.song?.video_id || ""];
        return {
          ...item,
          viewMilestone: buildViewMilestoneInfo(viewCount, history),
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
          primaryLabel: "曲の種類",
          totalCountLabel: "総歌唱回数",
          topLabel: "最多曲",
          countUnit: "回",
        };
      case "artistCounts":
        return {
          primaryLabel: "アーティスト数",
          totalCountLabel: "総歌唱回数",
          topLabel: "最多アーティスト",
          countUnit: "回",
        };
      case "originalSongCounts":
        return {
          primaryLabel: "オリ曲数",
          totalCountLabel: "総歌唱回数",
          topLabel: "最多オリ曲",
          countUnit: "回",
        };
      case "tagCounts":
        return {
          primaryLabel: "タグ数",
          totalCountLabel: "総収録回数",
          topLabel: "最多タグ",
          countUnit: "件",
        };
      case "milestoneCounts":
        return {
          primaryLabel: "マイルストーン数",
          totalCountLabel: "総登場回数",
          topLabel: "最新マイルストーン",
          countUnit: "回",
        };
      case "videoCounts":
        return {
          primaryLabel: "動画数",
          totalCountLabel: "総歌唱回数",
          topLabel: "最多動画",
          countUnit: "回",
        };
      case "originalSongCountsByReleaseDate":
        return {
          primaryLabel: "収録楽曲数",
          totalCountLabel: "総歌唱回数",
          topLabel: "",
          countUnit: "回",
        };
      case "coverSongCountsByReleaseDate":
        return {
          primaryLabel: "収録楽曲数",
          totalCountLabel: "総歌唱回数",
          topLabel: "",
          countUnit: "回",
        };
      default:
        return {
          primaryLabel: "項目数",
          totalCountLabel: "総回数",
          topLabel: "最多項目",
          countUnit: "回",
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

    setIsTabSwitching(true);
    startTransition(() => {
      setActiveTab(nextTab);
    });

    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    // タブ切替は履歴を増やさない（戻る操作で過去のタブが大量に残るのを防ぐ）
    historyHelper.replaceUrlIfDifferent(url.href);
  };

  // ページを開いた時にURLの"tab"を取得してタブを選択する
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

  useEffect(() => {
    if (!isPending && isTabSwitching) {
      const frameId = window.requestAnimationFrame(() => {
        setIsTabSwitching(false);
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [activeTab, isPending, isTabSwitching]);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="grow lg:p-6 lg:pb-0 relative">
        <Loading />
      </div>
    );
  }

  const showTabLoading = isTabSwitching || isPending;

  return (
    <div className="grow">
      <h1 className="font-extrabold text-2xl p-3">統計情報</h1>

      <Tabs value={activeTab} onChange={handleTabChange} variant="default">
        <div className="md:hidden px-3 pb-2">
          <Select
            aria-label="統計タブ選択"
            value={activeTab}
            onChange={handleTabChange}
            data={TABS_CONFIG.map((tab) => ({
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
            {TABS_CONFIG.map((tab) => (
              <Tabs.Tab
                id={`tab-${TABS_CONFIG.indexOf(tab)}`}
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

        {showTabLoading ? (
          <div className="relative min-h-70">
            <Center className="h-70">
              <div className="flex flex-col items-center gap-2">
                <Loader color="pink" type="dots" />
                <Text
                  size="sm"
                  c="dimmed"
                  aria-live="polite"
                  className="select-none"
                >
                  {"Loading...".split("").map((char, index) => (
                    <span
                      key={`loading-char-${index}`}
                      className="inline-block animate-bounce"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        animationDuration: "900ms",
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </Text>
              </div>
            </Center>
          </div>
        ) : (
          TABS_CONFIG.map((tab, index) => (
            <Tabs.Panel key={`${tab.title}-${index}-panel`} value={tab.dataKey}>
              <SongCountOverview
                items={
                  statisticsWithMilestones[tab.dataKey] as StatisticsItem[]
                }
                {...getOverviewLabels(tab.dataKey)}
                showMilestoneHighlights={milestoneOverviewTabs.has(tab.dataKey)}
                showTopTile={!hideTopTileTabs.has(tab.dataKey)}
              />
              <DataTable
                data={statisticsWithMilestones[tab.dataKey]}
                caption={tab.caption}
                description={tab.description}
                columns={tab.columns}
                minWidth={tab.minWidth}
                initialSortColumnId={tab.initialSort.id}
                initialSortDirection={tab.initialSort.direction}
                visualMode={
                  rankedDesignTabs.has(tab.dataKey)
                    ? "ranked"
                    : viewCountBarTabs.has(tab.dataKey)
                      ? "viewCountBar"
                      : "default"
                }
                {...(tab.dataKey === "videoCounts" && {
                  onRowClick: handleVideoClick,
                  selectedVideoId: selectedVideoId,
                  songs: songs,
                })}
              />
            </Tabs.Panel>
          ))
        )}
      </Tabs>

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label="ページ上部へ戻る"
          className="fixed bottom-4 right-4 z-40 inline-flex items-center justify-center rounded-full bg-primary-600 p-3 text-white shadow-lg transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <HiArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
