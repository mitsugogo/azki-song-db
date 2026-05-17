import { Button } from "@mantine/core";
import {
  FaChartSimple,
  FaMusic,
  FaTag,
  FaUser,
  FaUsers,
} from "react-icons/fa6";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import { Song } from "../../types/song";
import FilterModeGrid from "./FilterModeGrid";
import SearchBreadcrumb from "./SearchBreadcrumb";
import SearchQueryInputSection from "./SearchQueryInputSection";
import SearchSongCard from "./SearchSongCard";
import { useTranslations } from "next-intl";
import {
  FilterMode,
  SearchBrowseSortMode,
  SearchFilterModeResult,
} from "../hook/useSearchFilterModeData";
import RelatedArtistsSection from "./RelatedArtistsSection";

interface CategorySection {
  label: string;
  value: string;
  songs: Song[];
  totalCount: number;
}

interface SearchBrowseViewProps {
  allSongs: Song[];
  searchValue: string[];
  setSearchValue: (values: string[]) => void;
  setSearchTerm: (term: string) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  sortMode: SearchBrowseSortMode;
  setSortMode: (mode: SearchBrowseSortMode) => void;
  categorySongs: CategorySection[];
  filterModeData: SearchFilterModeResult;
}

const SearchBrowseView = ({
  allSongs,
  searchValue,
  setSearchValue,
  setSearchTerm,
  filterMode,
  setFilterMode,
  sortMode,
  setSortMode,
  categorySongs,
  filterModeData,
}: SearchBrowseViewProps) => {
  const t = useTranslations("SearchBrowse");
  const tHeader = useTranslations("Header");
  const isSortableMode = [
    "title",
    "artist",
    "tag",
    "singer",
    "collab",
    "related-artists",
  ].includes(filterMode);

  return (
    <div className="grow overflow-auto pb-24 lg:p-6 lg:pb-8">
      <SearchBreadcrumb />

      <div>
        <h1 className="font-extrabold text-2xl p-3">{t("title")}</h1>
        <div className="p-3">
          <p className="text-sm text-gray-600 dark:text-light-gray-400">
            {t("summary", {
              countSongs: allSongs.length.toLocaleString(),
              countVideos: Array.from(new Set(allSongs.map((s) => s.video_id)))
                .length,
            })}
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

      <div className="px-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterMode === "categories" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("categories")}
          >
            {t("filters.category")}
          </Button>
          <Button
            variant={filterMode === "title" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("title")}
            leftSection={<FaMusic />}
          >
            {t("filters.title")}
          </Button>
          <Button
            variant={filterMode === "artist" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("artist")}
            leftSection={<FaUser />}
          >
            {t("filters.artist")}
          </Button>
          <Button
            variant={filterMode === "tag" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("tag")}
            leftSection={<FaTag />}
          >
            {t("filters.tag")}
          </Button>
          <Button
            variant={filterMode === "singer" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("singer")}
            leftSection={<FaUser />}
          >
            {t("filters.singer")}
          </Button>
          <Button
            variant={filterMode === "collab" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("collab")}
            leftSection={<FaUsers />}
          >
            {t("filters.collab")}
          </Button>
          <Button
            variant={filterMode === "related-artists" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("related-artists")}
            leftSection={<FaChartSimple />}
          >
            {t("filters.relatedArtists")}
          </Button>
          <Button
            variant={filterMode === "not-sung-for-a-year" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("not-sung-for-a-year")}
          >
            {t("filters.notSungForYear")}
          </Button>
        </div>

        {isSortableMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-light-gray-400">
              {t("sort.label")}
            </span>
            <Button
              variant={sortMode === "count-desc" ? "filled" : "light"}
              color="pink"
              size="xs"
              onClick={() => setSortMode("count-desc")}
            >
              {t("sort.countDesc")}
            </Button>
            <Button
              variant={sortMode === "alpha-asc" ? "filled" : "light"}
              color="pink"
              size="xs"
              onClick={() => setSortMode("alpha-asc")}
            >
              {t("sort.alphaAsc")}
            </Button>
          </div>
        )}
      </div>

      {filterModeData.filterMode === "categories" ? (
        <div className="p-3">
          {categorySongs.map((category) => (
            <section key={category.value} className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white">
                  {category.label} ({category.totalCount})
                </h2>
                {category.songs.length === 16 && (
                  <a
                    href={`/search?q=${encodeURIComponent(category.value)}`}
                    className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    {t("seeMore")}
                  </a>
                )}
              </div>

              {category.songs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t("noResults")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 grid-rows-2 gap-4">
                  {category.songs.map((song) => (
                    <SearchSongCard
                      key={`${song.video_id}-${song.start}-${song.title}`}
                      song={song}
                      href={`/watch?v=${song.video_id}${song.start ? `&t=${song.start}` : ""}`}
                      membersOnlyBadgeLabel={t("membersOnlyBadge")}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : filterModeData.filterMode === "related-artists" ? (
        <RelatedArtistsSection categories={filterModeData.data} />
      ) : (
        <FilterModeGrid filterModeResult={filterModeData} />
      )}
      <ScrollToTopButton />
    </div>
  );
};

export default SearchBrowseView;
