import { Button, Group, Switch } from "@mantine/core";
import { HiCog6Tooth } from "react-icons/hi2";
import { useId, useState } from "react";
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
  azkiOnly: boolean;
  setAzkiOnly: (value: boolean) => void;
  placeholder?: string;
}

const SearchQueryInputSection = ({
  allSongs,
  searchValue,
  setSearchValue,
  setSearchTerm,
  azkiOnly,
  setAzkiOnly,
  placeholder,
}: SearchQueryInputSectionProps) => {
  const t = useTranslations("AdvancedSearch");
  const tSearchPage = useTranslations("SearchPage");
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const azkiOnlyLabelId = useId();

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
        <Group gap={6} wrap="nowrap">
          <span
            id={azkiOnlyLabelId}
            className="text-xs font-medium text-gray-700 dark:text-gray-200"
          >
            {tSearchPage("azkiOnly")}
          </span>
          <Switch
            size="sm"
            color="pink"
            withThumbIndicator={false}
            checked={azkiOnly}
            aria-labelledby={azkiOnlyLabelId}
            onChange={(event) => setAzkiOnly(event.currentTarget.checked)}
          />
        </Group>
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
