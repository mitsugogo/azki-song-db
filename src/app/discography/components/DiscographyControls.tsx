"use client";

import { SegmentedControl, Switch } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuGrid2X2, LuList, LuVideo } from "react-icons/lu";

export type DiscographyViewMode = "tile" | "list" | "originalMv";

interface DiscographyControlsProps {
  groupByAlbum: boolean;
  groupByYear: boolean;
  viewMode: DiscographyViewMode;
  showOriginalMv: boolean;
  onGroupByAlbumChange: () => void;
  onGroupByYearChange: () => void;
  onViewModeChange: (value: DiscographyViewMode) => void;
}

/**
 * Discographyページのトグルスイッチコントロール群
 */
export default function DiscographyControls({
  groupByAlbum,
  groupByYear,
  viewMode,
  showOriginalMv,
  onGroupByAlbumChange,
  onGroupByYearChange,
  onViewModeChange,
}: DiscographyControlsProps) {
  const t = useTranslations("Discography");
  const modeOptions = [
    {
      label: (
        <span
          className="flex items-center justify-center"
          title={t("controls.viewModeTile")}
        >
          <LuGrid2X2 aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("controls.viewModeTile")}</span>
        </span>
      ),
      value: "tile",
    },
    {
      label: (
        <span
          className="flex items-center justify-center"
          title={t("controls.viewModeSongList")}
        >
          <LuList aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("controls.viewModeSongList")}</span>
        </span>
      ),
      value: "list",
    },
    ...(showOriginalMv
      ? [
          {
            label: (
              <span
                className="flex items-center justify-center"
                title={t("controls.onlyOriginalMV")}
              >
                <LuVideo aria-hidden="true" className="size-4" />
                <span className="sr-only">{t("controls.onlyOriginalMV")}</span>
              </span>
            ),
            value: "originalMv",
          },
        ]
      : []),
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <SegmentedControl
        aria-label={t("controls.viewMode")}
        data-testid="discography-view-mode"
        value={viewMode}
        onChange={(value) => {
          if (value === "tile" || value === "list" || value === "originalMv") {
            onViewModeChange(value);
          }
        }}
        data={modeOptions}
        size="sm"
        classNames={{
          root: "border border-light-gray-200 bg-white/80 p-0.5 shadow-sm dark:border-white/10 dark:bg-gray-800/80",
          indicator: "bg-primary-600 shadow-sm dark:bg-primary-500",
          label:
            "px-2.5 py-1 text-xs font-semibold text-gray-700 data-[active=true]:text-white dark:text-gray-200 dark:data-[active=true]:text-white",
        }}
      />
      <Switch
        label={t("controls.groupByAlbum")}
        checked={groupByAlbum}
        onChange={onGroupByAlbumChange}
        withThumbIndicator={false}
      />

      <Switch
        label={t("controls.groupByYear")}
        checked={groupByYear}
        onChange={onGroupByYearChange}
        withThumbIndicator={false}
      />
    </div>
  );
}
