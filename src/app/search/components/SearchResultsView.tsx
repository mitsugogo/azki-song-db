import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import { Song } from "../../types/song";
import SearchBreadcrumb from "./SearchBreadcrumb";
import SearchQueryInputSection from "./SearchQueryInputSection";
import SearchTermChips from "./SearchTermChips";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../lib/formatDate";
import { Badge } from "flowbite-react";
import { FaStar } from "react-icons/fa6";

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
  const t = useTranslations("SearchResults");
  const tWatchDetail = useTranslations("Watch.nowPlayingSongInfoDetail");
  const locale = useLocale();
  const tHeader = useTranslations("Header");
  const firstStart = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const lastEnd =
    virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div
      ref={parentRef}
      className="grow lg:p-6 lg:pb-0 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarGutter: "stable" }}
    >
      <SearchBreadcrumb
        currentLabel={t("labelWithQuery", { term: searchTerm })}
      />

      <div className="mb-4">
        <h1 className="font-extrabold text-2xl p-3">{t("title")}</h1>
        <div className="px-3 pb-3">
          <SearchTermChips terms={searchTokens} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("foundCount", { count: filteredSongs.length })}
          </p>
        </div>
      </div>

      <SearchQueryInputSection
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
        placeholder={tHeader("searchPlaceholder")}
      />

      <div className="p-3">
        <div style={{ height: `${firstStart}px` }} />

        <ul
          id="search-result-list"
          className="song-list mb-2 auto-rows-max grid grid-cols-1 gap-2 grow dark:text-gray-300"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${estimatedItemWidth}px)`,
            justifyContent: "start",
            gap: "1rem",
            boxSizing: "border-box",
            width:
              typeof wrapperWidth === "number"
                ? `${wrapperWidth}px`
                : wrapperWidth,
            maxWidth: "100%",
            margin: "0",
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
                  <article className="card-glassmorphism hover-lift-shadow overflow-hidden h-full">
                    <Link
                      href={`/watch?v=${song.video_id}${song.start ? `&t=${song.start}` : ""}&q=${encodeURIComponent(searchTerm)}`}
                      className="block"
                    >
                      <div className="relative w-full aspect-video bg-black">
                        <YoutubeThumbnail
                          videoId={song.video_id}
                          alt={song.title}
                        />
                        {song.is_members_only && (
                          <div className="absolute right-1.5 top-1.5 z-20">
                            <Badge className="border-0 bg-emerald-600/95 px-1.5 py-0.5 text-[0.55rem] font-bold tracking-wide text-white shadow-sm dark:bg-emerald-500 dark:text-white">
                              <FaStar className="inline -mt-0.5" />{" "}
                              {tWatchDetail("membersOnlyBadge")}
                            </Badge>
                          </div>
                        )}
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
                          {formatDate(song.broadcast_at, locale)}
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
      <ScrollToTopButton />
    </div>
  );
};

export default SearchResultsView;
