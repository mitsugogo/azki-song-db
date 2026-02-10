import { StatisticsItem } from "../createStatistics";
import SongItem from "../SongItem";
import SongDetails from "../SongDetails";
import { getGridCols } from "../utils/gridHelpers";

interface YearGroupProps {
  year: string;
  groupItems: Array<{ song: StatisticsItem; idx: number }>;
  visibleItems: boolean[];
  expandedItem: string | null;
  groupByAlbum: boolean;
  anchorToScroll: string | null;
  targetRef?: React.RefObject<HTMLDivElement>;
  onItemClick: (key: string) => void;
}

/**
 * 年ごとに楽曲をグループ化して表示するコンポーネント
 */
export default function YearGroup({
  year,
  groupItems,
  visibleItems,
  expandedItem,
  groupByAlbum,
  anchorToScroll,
  targetRef,
  onItemClick,
}: YearGroupProps) {
  const totalCount = groupItems.reduce(
    (sum, g) => sum + (g.song.count || 0),
    0,
  );
  const groupExpandedIndex = groupItems.findIndex(
    (g) => g.song.key === expandedItem,
  );
  const colCount = getGridCols();

  // 展開なし: 単純にグリッド表示
  if (expandedItem === null || groupExpandedIndex === -1) {
    return (
      <div>
        <div className="col-span-2 md:col-span-3 xl:col-span-4 my-4">
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
            <div className="px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              [{year}] ({totalCount}曲)
            </div>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
          {groupItems.map(({ song, idx }) => (
            <SongItem
              key={song.key}
              song={song}
              isVisible={visibleItems[idx] || false}
              groupByAlbum={groupByAlbum}
              onClick={() => onItemClick(song.key)}
            />
          ))}
        </div>
      </div>
    );
  }

  // 展開あり: 展開位置に詳細を挿入
  const expandedIdxInGroup = groupExpandedIndex;
  let detailsInsertionIndex =
    Math.floor(expandedIdxInGroup / colCount) * colCount + colCount;

  const itemsToRender = groupItems.map((g) => g.song);
  itemsToRender.splice(
    detailsInsertionIndex,
    0,
    groupItems[expandedIdxInGroup].song,
  );

  if (detailsInsertionIndex >= itemsToRender.length) {
    detailsInsertionIndex = itemsToRender.length - 1;
  }

  return (
    <div>
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-4">
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
          <div className="px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
            [{year}] ({totalCount}曲)
          </div>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
        {itemsToRender.map((s, i) => {
          if (i === detailsInsertionIndex) {
            return (
              <div
                key={`${s.key}-details`}
                className="col-span-2 md:col-span-3 xl:col-span-4"
                data-discography-anchor={`album-${s.key}`}
                ref={anchorToScroll === s.key ? targetRef : undefined}
              >
                <SongDetails song={s} />
              </div>
            );
          }

          // 元のアイテムの index を求める
          const originalIndex = (() => {
            const idxInGroup = i > detailsInsertionIndex ? i - 1 : i;
            return groupItems[idxInGroup].idx;
          })();

          return (
            <SongItem
              key={s.key}
              song={s}
              isVisible={visibleItems[originalIndex] || false}
              groupByAlbum={groupByAlbum}
              onClick={() => onItemClick(s.key)}
            />
          );
        })}
      </div>
    </div>
  );
}
