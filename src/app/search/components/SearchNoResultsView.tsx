import { Song } from "../../types/song";
import SearchTermChips from "./SearchTermChips";
import { useTranslations } from "next-intl";
import SearchQueryInputSection from "./SearchQueryInputSection";
import SearchBreadcrumb from "./SearchBreadcrumb";
import { pageClasses } from "../../theme";

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
  const t = useTranslations("SearchBrowse");
  return (
    <div className={pageClasses.shellFlushBottom}>
      <SearchBreadcrumb />

      <div className="mb-4">
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <div className="pb-3">
          <SearchTermChips terms={searchTokens} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("noResults")}
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
