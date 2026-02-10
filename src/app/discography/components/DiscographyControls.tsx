import { ToggleSwitch } from "flowbite-react";

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
  return (
    <div className="flex items-center justify-end mb-4 space-x-4">
      <ToggleSwitch
        label="アルバムごとに表示"
        checked={groupByAlbum}
        onChange={onGroupByAlbumChange}
      />

      <ToggleSwitch
        label="年ごとに区切る"
        checked={groupByYear}
        onChange={onGroupByYearChange}
      />

      {/* オリジナル楽曲タブのときのみ表示するオプション */}
      {activeTab === 0 && (
        <ToggleSwitch
          label="オリ曲MVのみ"
          checked={onlyOriginalMV}
          onChange={onOnlyOriginalMVChange}
        />
      )}
    </div>
  );
}
