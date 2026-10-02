import type { ArchiveItem } from "../types/archiveItem";
import { getArchiveAnchorId } from "./archiveAnchors";
import type { ArchiveSeriesGroup } from "./archiveSeries";

export const createArchiveEntries = <T extends ArchiveItem>(
  groups: ArchiveSeriesGroup<T>[],
) => {
  const anchoredVideoIds = new Set<string>();

  return groups.flatMap((group) => [
    { type: "group" as const, key: `group-${group.key}`, group },
    ...group.items.map((item) => {
      const baseAnchorId = getArchiveAnchorId(item.video_id);
      // 共有URLのアンカーは最初の表示に付け、以降の表示にも一意のIDを付ける。
      const anchorId = anchoredVideoIds.has(item.video_id)
        ? `${baseAnchorId}-series-${encodeURIComponent(group.key)}`
        : baseAnchorId;
      anchoredVideoIds.add(item.video_id);

      return {
        type: "item" as const,
        key: `item-${JSON.stringify([group.key, item.video_id])}`,
        anchorId,
        item,
      };
    }),
  ]);
};
