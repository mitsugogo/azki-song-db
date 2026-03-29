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

  const searchData = useMemo(() => {
    const availableTags = Array.from(
      new Set(allSongs.flatMap((song) => song.tags)),
    ).filter((tag) => tag !== "");

    const availableMilestones = Array.from(
      new Set(allSongs.flatMap((song) => song.milestones || [])),
    ).filter((milestone) => milestone !== "");

    const availableArtists = Array.from(
      new Set([
        ...allSongs.map((song) => song.artist),
        ...(isEnglish
          ? allSongs.flatMap((song) =>
              (song.artist_en ?? "")
                .split(/[,、]/)
                .map((artist) => artist.trim())
                .filter(Boolean),
            )
          : []),
      ]),
    ).filter((artist) => artist !== "");

    const availableSingers = Array.from(
      new Set(
        allSongs.flatMap((song) =>
          song.sings.map((s) => s.trim()).filter((s) => s !== ""),
        ),
      ),
    );

    const availableTitles = Array.from(
      new Set([
        ...allSongs.map((song) => song.title),
        ...(isEnglish
          ? allSongs
              .map((song) => song.title ?? "")
              .filter((title) => title !== "")
          : []),
      ]),
    ).filter((title) => title !== "");

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

    return [
      {
        group: t("groupArtist"),
        items: availableArtists.map((artist) => `artist:${artist}`),
      },
      {
        group: t("groupSinger"),
        items: availableSingers.map((singer) => `sing:${singer}`),
      },
      {
        group: t("groupUnit"),
        items: availableUnits.map((unit) => `unit:${unit}`),
      },
      {
        group: t("groupTitle"),
        items: availableTitles.map((title) => `title:${title}`),
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
        items: availableMilestones.map((milestone) => `milestone:${milestone}`),
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
  }, [allSongs, isEnglish, t]);

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
      onChange={onSearchChange}
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
