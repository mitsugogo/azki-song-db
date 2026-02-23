import Link from "next/link";
import { Button } from "@mantine/core";
import { FaMusic, FaTag, FaUser, FaUsers } from "react-icons/fa6";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { Song } from "../../types/song";
import FilterModeGrid from "./FilterModeGrid";
import SearchBreadcrumb from "./SearchBreadcrumb";
import SearchQueryInputSection from "./SearchQueryInputSection";
import {
  FilterMode,
  SearchFilterModeResult,
} from "../hook/useSearchFilterModeData";

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
  categorySongs,
  filterModeData,
}: SearchBrowseViewProps) => {
  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <SearchBreadcrumb />

      <div>
        <h1 className="font-extrabold text-2xl p-3">検索</h1>
        <div className="p-3">
          <p className="text-sm text-gray-600 dark:text-light-gray-400">
            楽曲を検索できます。全{allSongs.length}
            曲、{Array.from(new Set(allSongs.map((s) => s.video_id))).length}
            動画を収録。
          </p>
        </div>
      </div>

      <SearchQueryInputSection
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
        placeholder="曲名、アーティスト、タグなどで検索"
      />

      <div className="px-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterMode === "categories" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("categories")}
          >
            カテゴリー
          </Button>
          <Button
            variant={filterMode === "title" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("title")}
            leftSection={<FaMusic />}
          >
            曲名
          </Button>
          <Button
            variant={filterMode === "artist" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("artist")}
            leftSection={<FaUser />}
          >
            アーティスト
          </Button>
          <Button
            variant={filterMode === "tag" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("tag")}
            leftSection={<FaTag />}
          >
            タグ
          </Button>
          <Button
            variant={filterMode === "singer" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("singer")}
            leftSection={<FaUser />}
          >
            歌った人
          </Button>
          <Button
            variant={filterMode === "collab" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("collab")}
            leftSection={<FaUsers />}
          >
            コラボ・ユニット
          </Button>
          <Button
            variant={filterMode === "not-sung-for-a-year" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("not-sung-for-a-year")}
          >
            1年以上歌ってない曲
          </Button>
        </div>
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
                    » もっと見る
                  </a>
                )}
              </div>

              {category.songs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    該当する曲がありません
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 grid-rows-2 gap-4">
                  {category.songs.map((song) => (
                    <article
                      key={`${song.video_id}-${song.start}-${song.title}`}
                      className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 hover:bg-primary-200 dark:hover:bg-gray-600 shadow-sm"
                    >
                      <Link
                        href={`/?v=${song.video_id}${song.start ? `&t=${song.start}s` : ""}`}
                        className="block"
                      >
                        <div className="w-full aspect-video bg-black">
                          <YoutubeThumbnail
                            videoId={song.video_id}
                            alt={song.title}
                            fill={true}
                          />
                        </div>
                        <div className="p-3">
                          <div className="font-medium line-clamp-2">
                            {song.title}
                          </div>
                          {song.artist && (
                            <div className="text-sm text-gray-700 dark:text-light-gray-400 line-clamp-1">
                              {song.artist}
                            </div>
                          )}
                          <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                            {new Date(song.broadcast_at).toLocaleDateString()}
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <FilterModeGrid filterModeResult={filterModeData} />
      )}
    </div>
  );
};

export default SearchBrowseView;
