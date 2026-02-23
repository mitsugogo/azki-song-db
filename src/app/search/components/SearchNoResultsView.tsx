import { Song } from "../../types/song";
import SearchTermChips from "./SearchTermChips";
import SearchQueryInputSection from "./SearchQueryInputSection";
import SearchBreadcrumb from "./SearchBreadcrumb";

interface SearchNoResultsViewProps {
  allSongs: Song[];
  searchTokens: string[];
  searchValue: string[];
  setSearchValue: (values: string[]) => void;
  setSearchTerm: (term: string) => void;
}

const SearchNoResultsView = ({
  allSongs,
  searchTokens,
  searchValue,
  setSearchValue,
  setSearchTerm,
}: SearchNoResultsViewProps) => {
  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <SearchBreadcrumb />

      <div className="mb-4">
        <h1 className="font-extrabold text-2xl p-3">検索結果</h1>
        <div className="px-3 pb-3">
          <SearchTermChips terms={searchTokens} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            該当する曲がありません
          </p>
        </div>
      </div>

      <SearchQueryInputSection
        allSongs={allSongs}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
};

export default SearchNoResultsView;
