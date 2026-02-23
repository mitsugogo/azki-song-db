import SearchInput from "../../components/SearchInput";
import { Song } from "../../types/song";

interface SearchQueryInputSectionProps {
  allSongs: Song[];
  searchValue: string[];
  setSearchValue: (values: string[]) => void;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
}

const SearchQueryInputSection = ({
  allSongs,
  searchValue,
  setSearchValue,
  setSearchTerm,
  placeholder,
}: SearchQueryInputSectionProps) => {
  return (
    <div className="mb-4 px-3">
      <SearchInput
        allSongs={allSongs}
        searchValue={searchValue}
        onSearchChange={(values: string[]) => {
          setSearchValue(values);
          setSearchTerm(values.join("|"));
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchQueryInputSection;
