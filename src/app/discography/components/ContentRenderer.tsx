import { StatisticsItem } from "../createStatistics";
import SongItem from "../SongItem";
import SongDetails from "../SongDetails";
import YearGroup from "./YearGroup";
import { getGridCols } from "../utils/gridHelpers";

interface ContentRendererProps {
  data: StatisticsItem[];
  tabIndex: number;
  groupByAlbum: boolean;
  groupByYear: boolean;
  expandedItem: string | null;
  visibleItems: boolean[];
  anchorToScroll: string | null;
  targetRef?: React.RefObject<HTMLDivElement>;
  onItemClick: (key: string) => void;
}

/**
 * 楽曲一覧のコンテンツをレンダリングするコンポーネント
 */
export default function ContentRenderer({
  data,
  tabIndex,
  groupByAlbum,
  groupByYear,
  expandedItem,
  visibleItems,
  anchorToScroll,
  targetRef,
  onItemClick,
}: ContentRendererProps) {
  // 年ごとに区切るオプション
  if (groupByYear) {
    const getYear = (s: StatisticsItem) => {
      const dateStr = groupByAlbum
        ? (s.firstVideo.album_release_at ?? s.firstVideo.broadcast_at)
        : s.firstVideo.broadcast_at;
      const d = new Date(dateStr);
      return isNaN(d.getFullYear()) ? "Unknown" : String(d.getFullYear());
    };

    // 年ごとにグループ化（降順）
    const groups = data.reduce(
      (
        map: Map<string, Array<{ song: StatisticsItem; idx: number }>>,
        song,
        idx,
      ) => {
        const y = getYear(song);
        const arr = map.get(y) ?? [];
        arr.push({ song, idx });
        map.set(y, arr);
        return map;
      },
      new Map<string, Array<{ song: StatisticsItem; idx: number }>>(),
    );

    const years = Array.from(groups.keys()).sort(
      (a, b) => Number(b) - Number(a),
    );

    return (
      <div className="flex flex-col gap-4">
        {years.map((year) => {
          const groupItems = groups.get(year) ?? [];
          return (
            <YearGroup
              key={year}
              year={year}
              groupItems={groupItems}
              visibleItems={visibleItems}
              expandedItem={expandedItem}
              groupByAlbum={groupByAlbum}
              anchorToScroll={anchorToScroll}
              targetRef={targetRef}
              onItemClick={onItemClick}
            />
          );
        })}
      </div>
    );
  }

  // 展開するアイテムがない場合、通常のグリッドを表示
  if (expandedItem === null) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
        {data.map((song, index) => (
          <SongItem
            key={`${song.key}-${index}`}
            song={song}
            isVisible={visibleItems[index] || false}
            groupByAlbum={groupByAlbum}
            onClick={() => onItemClick(song.key)}
          />
        ))}
      </div>
    );
  }

  const expandedIndex = data.findIndex((song) => song.key === expandedItem);

  if (expandedIndex === -1) {
    return null;
  }

  const colCount = getGridCols();
  let detailsInsertionIndex =
    Math.floor(expandedIndex / colCount) * colCount + colCount;

  const itemsToRender = [...data];
  itemsToRender.splice(detailsInsertionIndex, 0, data[expandedIndex]);

  if (detailsInsertionIndex >= itemsToRender.length) {
    detailsInsertionIndex = itemsToRender.length - 1;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
      {itemsToRender.map((song, index) => {
        // SongDetailsの挿入位置
        if (index === detailsInsertionIndex) {
          return (
            <div
              key={`${song.key}-details`}
              className="col-span-2 md:col-span-3 xl:col-span-4"
              data-discography-anchor={`album-${song.key}`}
              ref={anchorToScroll === song.key ? targetRef : undefined}
            >
              <SongDetails song={song} />
            </div>
          );
        }

        // 元のアイテム
        const originalIndex = index > detailsInsertionIndex ? index - 1 : index;
        return (
          <SongItem
            key={song.key}
            song={song}
            isVisible={visibleItems[originalIndex] || false}
            groupByAlbum={groupByAlbum}
            onClick={() => onItemClick(song.key)}
          />
        );
      })}
    </div>
  );
}
