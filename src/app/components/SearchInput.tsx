import {
  TagsInput,
  TagsInputProps,
  Group,
  OverflowList,
  Pill,
  Text,
  Tooltip,
} from "@mantine/core";
import type { PillReorderProps } from "@mantine/core";
import { useMemo } from "react";
import { HiSearch } from "react-icons/hi";
import {
  FaCalendar,
  FaFilePen,
  FaGuitar,
  FaLeaf,
  FaMicrophone,
  FaMusic,
  FaPenNib,
  FaStar,
  FaTag,
  FaUser,
  FaUsers,
} from "react-icons/fa6";
import { useLocale, useTranslations } from "next-intl";
import { Song } from "../types/song";
import {
  collabUnits,
  getCollabUnitName,
  normalizeMemberNames,
} from "../config/collabUnits";
import {
  getSongModeItemLabel,
  renderSongModeIcon,
  SONG_MODE_MENU_ITEMS,
} from "./songModeMenu";

interface SearchInputProps {
  allSongs: Song[];
  searchValue: string[];
  onSearchChange: (values: string[]) => void;
  onEmptyInputEnter?: () => void;
  placeholder?: string;
  className?: string;
}

const normalizeSearchText = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase();

const splitSearchAliases = (aliases?: string[]) =>
  (aliases ?? []).map((alias) => alias.trim()).filter(Boolean);

const searchPrefixes = [
  "title:",
  "artist:",
  "sing:",
  "unit:",
  "tag:",
  "lyricist:",
  "composer:",
  "arranger:",
  "year:",
  "milestone:",
  "season:",
] as const;

const removeSingleSearchPrefix = (value: string) => {
  const prefix = searchPrefixes.find((item) => value.startsWith(item));
  return prefix ? value.slice(prefix.length) : value;
};

const removeSearchPrefix = (value: string) =>
  value
    .split(/\s+(OR)\s+/i)
    .map((part) =>
      part.toUpperCase() === "OR"
        ? part.toUpperCase()
        : removeSingleSearchPrefix(part),
    )
    .join(" ");

const splitSearchOrExpression = (value: string) => value.split(/\s+(OR)\s+/i);

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
  onEmptyInputEnter,
  placeholder,
  className,
}: SearchInputProps) {
  const locale = useLocale();
  const t = useTranslations("SearchInput");
  const tSongMode = useTranslations("Watch.songMode");
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
        new Set(
          allSongs.flatMap((song) => [...song.tags, ...(song.song_tags ?? [])]),
        ),
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

  const getSearchPrefixMeta = (value: string) => {
    if (value.startsWith("title:")) {
      return { icon: <FaMusic aria-hidden />, label: t("groupTitle") };
    }
    if (value.startsWith("artist:")) {
      return { icon: <FaUser aria-hidden />, label: t("groupArtist") };
    }
    if (value.startsWith("sing:")) {
      return { icon: <FaMicrophone aria-hidden />, label: t("groupSinger") };
    }
    if (value.startsWith("unit:")) {
      return { icon: <FaUsers aria-hidden />, label: t("groupUnit") };
    }
    if (value.startsWith("tag:")) {
      return { icon: <FaTag aria-hidden />, label: t("groupTag") };
    }
    if (value.startsWith("milestone:")) {
      return { icon: <FaStar aria-hidden />, label: t("groupMilestone") };
    }
    if (value.startsWith("year:")) {
      return { icon: <FaCalendar aria-hidden />, label: t("groupYear") };
    }
    if (value.startsWith("season:")) {
      return { icon: <FaLeaf aria-hidden />, label: t("groupSeason") };
    }
    if (value.startsWith("lyricist:")) {
      return { icon: <FaPenNib aria-hidden />, label: t("groupLyricist") };
    }
    if (value.startsWith("composer:")) {
      return { icon: <FaGuitar aria-hidden />, label: t("groupComposer") };
    }
    if (value.startsWith("arranger:")) {
      return { icon: <FaFilePen aria-hidden />, label: t("groupArranger") };
    }

    return null;
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
      {option.value.includes("season:") && (
        <span aria-label={t("groupSeason")} role="img">
          <FaLeaf aria-hidden />
        </span>
      )}
      {option.value.includes("lyricist:") && (
        <span aria-label={t("groupLyricist")} role="img">
          <FaPenNib aria-hidden />
        </span>
      )}
      {option.value.includes("composer:") && (
        <span aria-label={t("groupComposer")} role="img">
          <FaGuitar aria-hidden />
        </span>
      )}
      {option.value.includes("arranger:") && (
        <span aria-label={t("groupArranger")} role="img">
          <FaFilePen aria-hidden />
        </span>
      )}
      <div>
        <Text size="sm">{removeSearchPrefix(option.value)}</Text>
      </div>
    </Group>
  );

  const renderSelectedPill: TagsInputProps["renderPill"] = ({
    value,
    disabled,
    reorderProps,
  }) => {
    const itemValue = String(value ?? "");

    if (itemValue !== searchValue[0]) {
      return null;
    }

    const removeValueAtIndex = (indexToRemove: number) => {
      handleSearchChange(
        searchValue.filter((_, index) => index !== indexToRemove),
      );
    };
    const useCompactOverflow = searchValue.length > 3;
    const overflowItems = useCompactOverflow
      ? [
          { startIndex: 0, values: searchValue.slice(0, 2) },
          ...searchValue.slice(2).map((item, index) => ({
            startIndex: index + 2,
            values: [item],
          })),
        ]
      : [{ startIndex: 0, values: searchValue }];

    return (
      <OverflowList
        data={overflowItems}
        gap={4}
        maxRows={1}
        style={{
          flex: useCompactOverflow ? "1 1 auto" : "0 1 auto",
          maxWidth: useCompactOverflow ? "max(0px, calc(100% - 2rem))" : "100%",
          minWidth: 0,
        }}
        renderItem={(item) =>
          item.values.length > 1 ? (
            <Group component="span" gap={4} wrap="nowrap">
              {item.values.map((itemValue, index) =>
                renderSearchPill({
                  disabled,
                  onRemove: () => removeValueAtIndex(item.startIndex + index),
                  reorderProps:
                    item.startIndex + index === 0 ? reorderProps : undefined,
                  value: itemValue,
                }),
              )}
            </Group>
          ) : (
            renderSearchPill({
              disabled,
              onRemove: () => removeValueAtIndex(item.startIndex),
              reorderProps: item.startIndex === 0 ? reorderProps : undefined,
              value: item.values[0],
            })
          )
        }
        renderOverflow={(items) => {
          const hiddenValues = items.flatMap((item) => item.values);

          return (
            <Tooltip
              label={hiddenValues.map(removeSearchPrefix).join(", ")}
              multiline
              withArrow
            >
              <Pill>+{hiddenValues.length}</Pill>
            </Tooltip>
          );
        }}
      />
    );
  };

  const renderSearchPill = ({
    value,
    onRemove,
    disabled,
    reorderProps,
  }: {
    value: string;
    onRemove: () => void;
    disabled: boolean | undefined;
    reorderProps?: PillReorderProps;
  }) => {
    const expressionParts = splitSearchOrExpression(value);
    const hasPrefixedExpressionPart = expressionParts.some(
      (part) => part.toUpperCase() !== "OR" && getSearchPrefixMeta(part),
    );
    const songModeItem = SONG_MODE_MENU_ITEMS.find(
      (item) => item.mode !== "" && item.searchTerm === value,
    );

    return (
      <Pill
        key={value}
        withRemoveButton={!disabled}
        onRemove={onRemove}
        disabled={disabled}
        {...reorderProps}
      >
        {songModeItem ? (
          <Group component="span" gap={4} wrap="nowrap">
            <Tooltip label={t("songMode")} withArrow>
              <span aria-label={t("songMode")} role="img">
                {renderSongModeIcon(songModeItem.icon, "h-3.5 w-3.5")}
              </span>
            </Tooltip>
            <span>{getSongModeItemLabel(songModeItem, tSongMode)}</span>
          </Group>
        ) : hasPrefixedExpressionPart ? (
          <Group component="span" gap={4} wrap="nowrap">
            {expressionParts.map((part, index) => {
              if (part.toUpperCase() === "OR") {
                return <span key={`operator-${index}`}>OR</span>;
              }

              const partPrefixMeta = getSearchPrefixMeta(part);
              if (!partPrefixMeta) {
                return <span key={`${part}-${index}`}>{part}</span>;
              }

              return (
                <Group
                  component="span"
                  gap={4}
                  wrap="nowrap"
                  key={`${part}-${index}`}
                >
                  <Tooltip label={partPrefixMeta.label} withArrow>
                    <span aria-label={partPrefixMeta.label} role="img">
                      {partPrefixMeta.icon}
                    </span>
                  </Tooltip>
                  <span>{removeSingleSearchPrefix(part)}</span>
                </Group>
              );
            })}
          </Group>
        ) : (
          value
        )}
      </Pill>
    );
  };

  return (
    <TagsInput
      placeholder={resolvedPlaceholder}
      leftSection={<HiSearch />}
      data={searchData}
      renderOption={renderMultiSelectOption}
      renderPill={renderSelectedPill}
      maxDropdownHeight={200}
      value={searchValue}
      onChange={handleSearchChange}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !event.nativeEvent.isComposing &&
          event.currentTarget.value === "" &&
          searchValue.length > 0
        ) {
          event.preventDefault();
          onEmptyInputEnter?.();
        }
      }}
      filter={aliasAwareFilter}
      limit={15}
      splitChars={["|"]}
      comboboxProps={{
        shadow: "md",
        transitionProps: { transition: "fade", duration: 100 },
      }}
      clearable
      className={className}
      styles={{
        inputField:
          searchValue.length > 3
            ? { flex: "0 1 2rem", minWidth: "2rem" }
            : undefined,
      }}
      acceptValueOnBlur
    />
  );
}
