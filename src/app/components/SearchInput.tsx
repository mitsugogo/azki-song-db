import { TagsInput, TagsInputProps, Group, Text } from "@mantine/core";
import { useMemo } from "react";
import { HiSearch } from "react-icons/hi";
import { FaMusic, FaUser, FaTag, FaUsers, FaCalendar } from "react-icons/fa6";
import { useLocale, useTranslations } from "next-intl";
import { Song } from "../types/song";
import {
  collabUnits,
  getCollabUnitName,
  normalizeMemberNames,
} from "../config/collabUnits";

interface SearchInputProps {
  allSongs: Song[];
  searchValue: string[];
  onSearchChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const normalizeSearchText = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase();

const splitSearchAliases = (aliases?: string[]) =>
  (aliases ?? []).map((alias) => alias.trim()).filter(Boolean);

const createAliasAwareFilter =
  (
    searchTextByValue: Map<string, string>,
  ): NonNullable<TagsInputProps["filter"]> =>
  ({ options, search, limit }) => {
    const normalizedSearch = normalizeSearchText(search);
    const result: ReturnType<NonNullable<TagsInputProps["filter"]>> = [];
    let remaining = limit;

    const matches = (value: string, label: string) => {
      const indexedText = searchTextByValue.get(value) ?? label;
      return normalizeSearchText(indexedText).includes(normalizedSearch);
    };

    for (const option of options) {
      if (remaining <= 0) {
        break;
      }

      if ("items" in option) {
        const items = [];

        for (const item of option.items) {
          if (remaining <= 0) {
            break;
          }

          if (matches(item.value, item.label)) {
            items.push(item);
            remaining -= 1;
          }
        }

        if (items.length > 0) {
          result.push({ group: option.group, items });
        }

        continue;
      }

      if (matches(option.value, option.label)) {
        result.push(option);
        remaining -= 1;
      }
    }

    return result;
  };

export default function SearchInput({
  allSongs,
  searchValue,
  onSearchChange,
  placeholder,
  className,
}: SearchInputProps) {
  const locale = useLocale();
  const t = useTranslations("SearchInput");
  const isEnglish = locale === "en";

  const resolvedPlaceholder = placeholder ?? t("search");

  const { searchData, optionSearchTextByValue, canonicalValueByAlias } =
    useMemo(() => {
      const optionSearchTextByValue = new Map<string, string>();
      const canonicalValueByAlias = new Map<string, string>();

      const registerSearchOption = (
        prefix: string,
        canonicalValue: string,
        aliases: string[] = [],
      ) => {
        const value = `${prefix}${canonicalValue}`;
        const searchText = [value, canonicalValue, ...aliases]
          .filter(Boolean)
          .join(" ");

        optionSearchTextByValue.set(value, searchText);
        aliases.forEach((alias) => {
          canonicalValueByAlias.set(
            normalizeSearchText(`${prefix}${alias}`),
            value,
          );
        });

        return value;
      };

      const availableTags = Array.from(
        new Set(allSongs.flatMap((song) => song.tags)),
      ).filter((tag) => tag !== "");

      const availableMilestones = Array.from(
        new Set(allSongs.flatMap((song) => song.milestones || [])),
      ).filter((milestone) => milestone !== "");

      const artistAliasesByName = new Map<string, Set<string>>();
      const addAliases = (name: string, aliases: string[] = []) => {
        if (!name) return;
        const aliasSet = artistAliasesByName.get(name) ?? new Set<string>();
        splitSearchAliases(aliases).forEach((alias) => aliasSet.add(alias));
        artistAliasesByName.set(name, aliasSet);
      };

      allSongs.forEach((song) => {
        addAliases(song.artist, song.artist_aliases);
        song.artists?.forEach((artist) =>
          addAliases(artist, song.artist_aliases),
        );

        if (isEnglish) {
          (song.artist_en ?? "")
            .split(/[,、]/)
            .map((artist) => artist.trim())
            .filter(Boolean)
            .forEach((artist) => addAliases(artist, song.artist_aliases));
        }
      });

      const availableArtists = Array.from(artistAliasesByName.keys()).filter(
        (artist) => artist !== "",
      );

      const singerAliasesByName = new Map<string, Set<string>>();
      allSongs.forEach((song) => {
        song.sings
          .map((s) => s.trim())
          .filter((s) => s !== "")
          .forEach((singer) => {
            const aliasSet =
              singerAliasesByName.get(singer) ?? new Set<string>();
            splitSearchAliases(song.sing_aliases).forEach((alias) =>
              aliasSet.add(alias),
            );
            singerAliasesByName.set(singer, aliasSet);
          });
      });

      const availableSingers = Array.from(singerAliasesByName.keys());

      const titleAliasesByName = new Map<string, Set<string>>();
      allSongs.forEach((song) => {
        const title = song.title;
        if (!title) return;
        const aliasSet = titleAliasesByName.get(title) ?? new Set<string>();
        splitSearchAliases(song.title_aliases).forEach((alias) =>
          aliasSet.add(alias),
        );
        titleAliasesByName.set(title, aliasSet);
      });

      const availableTitles = Array.from(titleAliasesByName.keys()).filter(
        (title) => title !== "",
      );

      const availableLyricists = Array.from(
        new Set(
          allSongs.flatMap((song) =>
            song.lyricist
              .split("、")
              .map((s) => s.trim())
              .filter((s) => s !== ""),
          ),
        ),
      );

      const availableComposers = Array.from(
        new Set(
          allSongs.flatMap((song) =>
            song.composer
              .split("、")
              .map((s) => s.trim())
              .filter((s) => s !== ""),
          ),
        ),
      );
      const availableArrangers = Array.from(
        new Set(
          allSongs.flatMap((song) =>
            song.arranger
              .split("、")
              .map((s) => s.trim())
              .filter((s) => s !== ""),
          ),
        ),
      );

      // ユニット（コラボ通称）のリスト作成
      const availableUnits = collabUnits
        .filter((unit) => {
          // 実際にそのユニットの曲が存在するかチェック
          return allSongs.some((song) => {
            if (song.sing === "") return false;
            const singers = song.hl?.ja?.sings || song.sings;
            if (singers.length !== unit.members.length) return false;
            const sortedSingers = normalizeMemberNames(singers);
            const sortedUnitMembers = normalizeMemberNames(unit.members);
            return sortedUnitMembers.every((m, i) => m === sortedSingers[i]);
          });
        })
        .map((unit) => {
          // ロケールに応じて英語表記があれば英語を優先、なければ通称を返す
          if (isEnglish && unit.hl && unit.hl.en) return unit.hl.en.unitName;
          return unit.unitName;
        })
        .filter((v, i, arr) => arr.indexOf(v) === i); // 重複排除

      const data = [
        {
          group: t("groupArtist"),
          items: availableArtists.map((artist) =>
            registerSearchOption(
              "artist:",
              artist,
              Array.from(artistAliasesByName.get(artist) ?? []),
            ),
          ),
        },
        {
          group: t("groupSinger"),
          items: availableSingers.map((singer) =>
            registerSearchOption(
              "sing:",
              singer,
              Array.from(singerAliasesByName.get(singer) ?? []),
            ),
          ),
        },
        {
          group: t("groupUnit"),
          items: availableUnits.map((unit) => `unit:${unit}`),
        },
        {
          group: t("groupTitle"),
          items: availableTitles.map((title) =>
            registerSearchOption(
              "title:",
              title,
              Array.from(titleAliasesByName.get(title) ?? []),
            ),
          ),
        },
        {
          group: t("groupLyricist"),
          items: availableLyricists.map((lyricist) => `lyricist:${lyricist}`),
        },
        {
          group: t("groupComposer"),
          items: availableComposers.map((composer) => `composer:${composer}`),
        },
        {
          group: t("groupArranger"),
          items: availableArrangers.map((arranger) => `arranger:${arranger}`),
        },
        {
          group: t("groupTag"),
          items: availableTags.map((tag) => `tag:${tag}`),
        },
        {
          group: t("groupMilestone"),
          items: availableMilestones.map(
            (milestone) => `milestone:${milestone}`,
          ),
        },
        {
          group: t("groupYear"),
          items: Array.from(new Set(allSongs.map((song) => song.year)))
            .filter((year): year is number => year !== undefined)
            .sort((a, b) => b - a)
            .map((year) => `year:${year}`),
        },
        {
          group: t("groupSeason"),
          items: ["season:春", "season:夏", "season:秋", "season:冬"],
        },
      ];

      return {
        searchData: data,
        optionSearchTextByValue,
        canonicalValueByAlias,
      };
    }, [allSongs, isEnglish, t]);

  const aliasAwareFilter = useMemo(
    () => createAliasAwareFilter(optionSearchTextByValue),
    [optionSearchTextByValue],
  );

  const handleSearchChange = (values: string[]) => {
    onSearchChange(
      values.map(
        (value) =>
          canonicalValueByAlias.get(normalizeSearchText(value)) ?? value,
      ),
    );
  };

  const renderMultiSelectOption: TagsInputProps["renderOption"] = ({
    option,
  }) => (
    <Group gap="sm">
      {option.value.includes("title:") && <FaMusic />}
      {option.value.includes("artist:") && <FaUser />}
      {option.value.includes("sing:") && <FaUser />}
      {option.value.includes("unit:") && <FaUsers />}
      {option.value.includes("tag:") && <FaTag />}
      {option.value.includes("milestone:") && "★"}
      {option.value.includes("year:") && <FaCalendar />}
      {option.value.includes("season:") && "季節:"}
      {option.value.includes("lyricist:") && "作詞:"}
      {option.value.includes("composer:") && "作曲:"}
      {option.value.includes("arranger:") && "編曲:"}
      <div>
        <Text size="sm">
          {option.value
            .replace("title:", "")
            .replace("artist:", "")
            .replace("sing:", "")
            .replace("unit:", "")
            .replace("tag:", "")
            .replace("lyricist:", "")
            .replace("composer:", "")
            .replace("arranger:", "")
            .replace("year:", "")
            .replace("milestone:", "")
            .replace("season:", "")}
        </Text>
      </div>
    </Group>
  );

  return (
    <TagsInput
      placeholder={resolvedPlaceholder}
      leftSection={<HiSearch />}
      data={searchData}
      renderOption={renderMultiSelectOption}
      maxDropdownHeight={200}
      value={searchValue}
      onChange={handleSearchChange}
      filter={aliasAwareFilter}
      limit={15}
      splitChars={["|"]}
      comboboxProps={{
        shadow: "md",
        transitionProps: { transition: "fade", duration: 100 },
      }}
      clearable
      className={className}
      acceptValueOnBlur
    />
  );
}
