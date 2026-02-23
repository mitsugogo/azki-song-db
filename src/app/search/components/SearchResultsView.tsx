import Link from "next/link";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { Song } from "../../types/song";
import SearchBreadcrumb from "./SearchBreadcrumb";
import SearchQueryInputSection from "./SearchQueryInputSection";
import SearchTermChips from "./SearchTermChips";

interface VirtualRow {
  index: number;
  start: number;
  end: number;
}

interface SearchResultsViewProps {
  parentRef: React.RefObject<HTMLDivElement | null>;
  searchTerm: string;
  searchTokens: string[];
  filteredSongs: Song[];
  allSongs: Song[];
  searchValue: string[];
  setSearchValue: (values: string[]) => void;
  setSearchTerm: (term: string) => void;
  cols: number;
  estimatedItemWidth: number;
  wrapperWidth: number | "100%";
  virtualRows: VirtualRow[];
  totalSize: number;
  measureElement: (node: Element | null) => void;
}

const SearchResultsView = ({
  parentRef,
  searchTerm,
  searchTokens,
  filteredSongs,
  allSongs,
  searchValue,
  setSearchValue,
  setSearchTerm,
  cols,
  estimatedItemWidth,
  wrapperWidth,
  virtualRows,
  totalSize,
  measureElement,
}: SearchResultsViewProps) => {
  const firstStart = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const lastEnd =
    virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div ref={parentRef} className="grow lg:p-6 lg:pb-0 overflow-auto">
      <SearchBreadcrumb currentLabel={`「${searchTerm}」の検索結果`} />

      <div className="mb-4">
        <h1 className="font-extrabold text-2xl p-3">検索結果</h1>
        <div className="px-3 pb-3">
          <SearchTermChips terms={searchTokens} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredSongs.length} 件の楽曲が見つかりました
          </p>
        </div>
      </div>

      <SearchQueryInputSection
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
      />

      <div className="p-3 lg:ml-6">
        <div style={{ height: `${firstStart}px` }} />

        <ul
          id="search-result-list"
          className="song-list mb-2 auto-rows-max grid grid-cols-1 gap-2 grow dark:text-gray-300"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${estimatedItemWidth}px)`,
            justifyContent: "center",
            gap: "1rem",
            boxSizing: "border-box",
            width:
              typeof wrapperWidth === "number"
                ? `${wrapperWidth}px`
                : wrapperWidth,
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          {virtualRows.flatMap((virtualRow) => {
            const startItemIndex = virtualRow.index * cols;
            const rowItems = filteredSongs.slice(
              startItemIndex,
              startItemIndex + cols,
            );

            return rowItems.map((song, itemIndexInRow) => {
              const globalIndex = startItemIndex + itemIndexInRow;
              if (!song) {
                return (
                  <li
                    key={`${virtualRow.index}-${itemIndexInRow}`}
                    style={{
                      width: estimatedItemWidth,
                      flex: `0 0 ${estimatedItemWidth}px`,
                      boxSizing: "border-box",
                    }}
                  />
                );
              }

              return (
                <li
                  key={`${song.video_id}-${song.start}-${song.title}`}
                  data-index={globalIndex}
                  data-row-index={virtualRow.index}
                  ref={
                    itemIndexInRow === 0 && cols > 1
                      ? measureElement
                      : undefined
                  }
                  style={{
                    width: estimatedItemWidth,
                    flex: `0 0 ${estimatedItemWidth}px`,
                    boxSizing: "border-box",
                  }}
                >
                  <article className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 hover:bg-primary-100/50 dark:hover:bg-primary-900/20 shadow-sm h-full">
                    <Link
                      href={`/?v=${song.video_id}${song.start ? `&t=${song.start}s` : ""}&q=${encodeURIComponent(searchTerm)}`}
                      className="block"
                    >
                      <div className="w-full aspect-video bg-black">
                        <YoutubeThumbnail
                          videoId={song.video_id}
                          alt={song.title}
                          fill={true}
                        />
                      </div>
                      <div className="p-3 pt-1">
                        <div className="font-medium line-clamp-2 dark:text-gray-100">
                          {song.title}
                        </div>
                        {song.artist && (
                          <div className="text-sm text-gray-300 dark:text-gray-200 line-clamp-1">
                            {song.artist}
                          </div>
                        )}
                        <div className="text-xs text-gray-200 dark:text-gray-300 mt-1">
                          {new Date(song.broadcast_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            });
          })}
        </ul>

        <div style={{ height: `${totalSize - lastEnd}px` }} />
      </div>
    </div>
  );
};

export default SearchResultsView;
