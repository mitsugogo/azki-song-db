"use client";

import { useState, useEffect } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

import DataTable from "./datatable";
import { useSongData } from "../hook/useSongData";
import { useStatistics } from "../hook/useStatistics";
import { TABS_CONFIG } from "./tabsConfig";
import Loading from "../loading";

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { songs, coverSongInfo, originalSongInfo, loading } = useSongData();

  const statistics = useStatistics({
    songs,
    coverSongInfo,
    originalSongInfo,
  });

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId((prev) => (prev === videoId ? null : videoId));
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabIndex.toString());
    window.history.pushState(null, "", url.href);
  };

  // ページを開いた時にURLの"tab"を取得してタブを選択する
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab) {
      const tabIndex = parseInt(tab, 10);
      setActiveTab(tabIndex);
    }
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex-grow lg:p-6 lg:pb-0">
      <h1 className="font-extrabold text-2xl p-3">統計情報</h1>

      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabList className="flex whitespace-nowrap overflow-x-auto overflow-y-hidden">
            {TABS_CONFIG.map((tab) => (
              <Tab
                id={`tab-${TABS_CONFIG.indexOf(tab)}`}
                key={`${tab.title}-${tab.dataKey}-header`}
                className={({ selected }) =>
                  `flex items-center justify-center p-4 font-medium text-sm border-b-2 focus:outline-none transition-colors duration-200 cursor-pointer
                   ${
                     selected
                       ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                       : "border-transparent text-light-gray-800 dark:text-light-gray-300 hover:border-gray-300 hover:text-gray-400 dark:hover:text-gray-100"
                   }`
                }
              >
                {tab.icon && (
                  <span className="mr-2">
                    <tab.icon />
                  </span>
                )}
                {tab.title}
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanels>
          {TABS_CONFIG.map((tab, index) => (
            <TabPanel key={`${tab.title}-${index}-panel`}>
              <DataTable
                data={statistics[tab.dataKey]}
                caption={tab.caption}
                description={tab.description}
                columns={tab.columns}
                minWidth={tab.minWidth}
                initialSortColumnId={tab.initialSort.id}
                initialSortDirection={tab.initialSort.direction}
                {...(tab.dataKey === "videoCounts" && {
                  onRowClick: handleVideoClick,
                  selectedVideoId: selectedVideoId,
                  songs: songs,
                })}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
