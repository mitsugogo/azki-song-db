import { ToggleSwitch } from "flowbite-react";
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
      <ToggleSwitch
        label={t("controls.groupByAlbum")}
        checked={groupByAlbum}
        onChange={onGroupByAlbumChange}
      />

      <ToggleSwitch
        label={t("controls.groupByYear")}
        checked={groupByYear}
        onChange={onGroupByYearChange}
      />

      {/* オリジナル楽曲タブのときのみ表示するオプション */}
      {activeTab === 0 && (
        <ToggleSwitch
          label={t("controls.onlyOriginalMV")}
          checked={onlyOriginalMV}
          onChange={onOnlyOriginalMVChange}
        />
      )}
    </div>
  );
}
