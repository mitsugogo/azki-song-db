import { TagsInput, TagsInputProps, Group, Text } from "@mantine/core";
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
}

export default function SearchInput({
  allSongs,
  searchValue,
  onSearchChange,
  placeholder = "検索",
}: SearchInputProps) {
  // 検索データを生成
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

  const searchData = [
    {
      group: "タグ",
      items: availableTags.map((tag) => `tag:${tag}`),
    },
    {
      group: "マイルストーン",
      items: availableMilestones.map((milestone) => `milestone:${milestone}`),
    },
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
      <div>
        <Text size="sm">
          {option.value
            .replace("title:", "")
            .replace("artist:", "")
            .replace("sing:", "")
            .replace("unit:", "")
            .replace("tag:", "")
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
        transitionProps: { transition: "pop", duration: 100 },
      }}
      clearable
    />
  );
}
