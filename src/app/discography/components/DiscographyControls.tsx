"use client";

import { Switch } from "@mantine/core";
import { useTranslations } from "next-intl";

interface DiscographyControlsProps {
  groupByAlbum: boolean;
  groupByYear: boolean;
  onlyOriginalMV: boolean;
  activeTab: number;
  onGroupByAlbumChange: () => void;
  onGroupByYearChange: () => void;
  onOnlyOriginalMVChange: () => void;
}

/**
 * Discographyページのトグルスイッチコントロール群
 */
export default function DiscographyControls({
  groupByAlbum,
  groupByYear,
  onlyOriginalMV,
  activeTab,
  onGroupByAlbumChange,
  onGroupByYearChange,
  onOnlyOriginalMVChange,
}: DiscographyControlsProps) {
  const t = useTranslations("Discography");
  return (
    <div className="flex items-center justify-end mb-4 space-x-4">
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

      {/* オリジナル楽曲タブのときのみ表示するオプション */}
      {activeTab === 0 && (
        <Switch
          label={t("controls.onlyOriginalMV")}
          checked={onlyOriginalMV}
          onChange={onOnlyOriginalMVChange}
          withThumbIndicator={false}
        />
      )}
    </div>
  );
}
