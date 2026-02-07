import { TagsInput, TagsInputProps, Group, Text } from "@mantine/core";
import { useMemo } from "react";
import { HiSearch } from "react-icons/hi";
import { FaMusic, FaUser, FaTag, FaUsers, FaCalendar } from "react-icons/fa6";
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
  placeholder = "検索",
  className,
}: SearchInputProps) {
  const searchData = useMemo(() => {
    const availableTags = Array.from(
      new Set(allSongs.flatMap((song) => song.tags)),
    ).filter((tag) => tag !== "");

    const availableMilestones = Array.from(
      new Set(allSongs.flatMap((song) => song.milestones || [])),
    ).filter((milestone) => milestone !== "");

    const availableArtists = Array.from(
      new Set(allSongs.map((song) => song.artist)),
    ).filter((artist) => artist !== "");

    const availableSingers = Array.from(
      new Set(
        allSongs.flatMap((song) =>
          song.sing
            .split("、")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
        ),
      ),
    );

    const availableTitles = Array.from(
      new Set(allSongs.map((song) => song.title)),
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
          const singers = song.sing
            .split("、")
            .map((s) => s.trim())
            .filter((s) => s !== "");
          if (singers.length !== unit.members.length) return false;
          const sortedSingers = normalizeMemberNames(singers);
          const sortedUnitMembers = normalizeMemberNames(unit.members);
          return sortedUnitMembers.every((m, i) => m === sortedSingers[i]);
        });
      })
      .map((unit) => unit.unitName);

    return [
      {
        group: "アーティスト",
        items: availableArtists.map((artist) => `artist:${artist}`),
      },
      {
        group: "歌った人",
        items: availableSingers.map((singer) => `sing:${singer}`),
      },
      {
        group: "ユニット",
        items: availableUnits.map((unit) => `unit:${unit}`),
      },
      {
        group: "曲名",
        items: availableTitles.map((title) => `title:${title}`),
      },
      {
        group: "作詞",
        items: availableLyricists.map((lyricist) => `lyricist:${lyricist}`),
      },
      {
        group: "作曲",
        items: availableComposers.map((composer) => `composer:${composer}`),
      },
      {
        group: "編曲",
        items: availableArrangers.map((arranger) => `arranger:${arranger}`),
      },
      {
        group: "タグ",
        items: availableTags.map((tag) => `tag:${tag}`),
      },
      {
        group: "マイルストーン",
        items: availableMilestones.map((milestone) => `milestone:${milestone}`),
      },
      {
        group: "配信年",
        items: Array.from(new Set(allSongs.map((song) => song.year)))
          .filter((year): year is number => year !== undefined)
          .sort((a, b) => b - a)
          .map((year) => `year:${year}`),
      },
      {
        group: "季節",
        items: ["season:春", "season:夏", "season:秋", "season:冬"],
      },
    ];
  }, [allSongs]);

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
      placeholder={placeholder}
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
