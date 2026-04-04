import { Button, Group } from "@mantine/core";
import { HiCog6Tooth } from "react-icons/hi2";
import { useState } from "react";
import { useTranslations } from "next-intl";
import SearchInput from "../../components/SearchInput";
import SearchHelpPopover from "./SearchHelpPopover";
import AdvancedSearchModal from "./AdvancedSearchModal";
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
  const t = useTranslations("AdvancedSearch");
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const handleAdvancedSearchApply = (query: string) => {
    // クエリをタグ配列に分解して設定
    const tags = query.split("|").map((tag) => tag.trim());
    setSearchValue(tags);
    setSearchTerm(query);
  };

  return (
    <div className="mb-4 px-3">
      <Group mb="sm" justify="flex-end">
        <SearchHelpPopover />
        <Button
          variant="subtle"
          size="xs"
          leftSection={<HiCog6Tooth size={18} />}
          aria-label={t("title")}
          title={t("title")}
          onClick={() => setAdvancedSearchOpen(true)}
        >
          {t("title")}
        </Button>
      </Group>
      <SearchInput
        allSongs={allSongs}
        searchValue={searchValue}
        onSearchChange={(values: string[]) => {
          setSearchValue(values);
          setSearchTerm(values.join("|"));
        }}
        placeholder={placeholder}
      />
      <AdvancedSearchModal
        isOpen={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        onApply={handleAdvancedSearchApply}
      />
    </div>
  );
};

export default SearchQueryInputSection;
