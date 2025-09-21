import { useEffect, useState } from "react";
import { Song } from "../types/song";
import SongsList from "./SongList";
import { Button } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaMusic, FaStar, FaTag, FaUser } from "react-icons/fa6";
import { LuCrown } from "react-icons/lu";
import { Group, TagsInput, TagsInputProps, Text } from "@mantine/core";

// Propsの型定義
type SearchAndSongListProps = {
  songs: Song[];
  allSongs: Song[];
  currentSongInfo: Song | null;
  searchTerm: string;
  availableSongTitles: string[];
  availableArtists: string[];
  availableSingers: string[];
  availableTags: string[];
  availableMilestones: string[];
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song | null) => void;
  playRandomSong: (songList: Song[]) => void;
  setSearchTerm: (term: string) => void;
};

export default function SearchAndSongList({
  songs,
  allSongs,
  searchTerm,
  currentSongInfo,
  availableSongTitles,
  availableArtists,
  availableSingers,
  availableTags,
  availableMilestones,
  hideFutureSongs,
  changeCurrentSong,
  playRandomSong,
  setSearchTerm,
}: SearchAndSongListProps) {
  const [searchValue, setSearchValue] = useState<string[]>([]);

  useEffect(() => {
    const s = searchTerm.split("|").filter((s) => s.trim() !== "");
    if (s.length > 0) {
      setSearchValue(searchTerm.split("|"));
    }
  }, [searchTerm]);

  const renderMultiSelectOption: TagsInputProps["renderOption"] = ({
    option,
  }) => (
    <Group gap="sm">
      {option.value.includes("title:") && <FaMusic />}
      {option.value.includes("artist:") && <FaUser />}
      {option.value.includes("sing:") && <FaUser />}
      {option.value.includes("tag:") && <FaTag />}
      {option.value.includes("milestone:") && <FaStar />}
      {option.value.includes("season:") && "季節:"}
      <div>
        <Text size="sm">
          {option.value
            .replace("title:", "")
            .replace("artist:", "")
            .replace("sing:", "")
            .replace("tag:", "")
            .replace("milestone:", "")
            .replace("season:", "")}
        </Text>
      </div>
    </Group>
  );

  return (
    <section className="flex md:w-4/12 lg:w-1/3 xl:w-5/12 sm:w-full flex-col min-h-0 h-dvh md:h-full lg:h-full sm:mx-0">
      <div className="flex flex-col h-full bg-background px-2 lg:px-0 lg:pl-2 py-0">
        <Button
          onClick={() => playRandomSong(songs)}
          className="hidden lg:block px-3 py-1 bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition mb-1 shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0"
        >
          <span className="text-sm">ランダムで他の曲にする</span>
        </Button>

        <Button
          onClick={() => {
            // ソロライブ用のプレイリストをセットしてCreating worldを再生
            setSearchTerm("sololive2025");
            const song = songs.find((song) => song.video_id === "ZkvtKUQp3nM");
            if (!song) return;
            changeCurrentSong(song);
          }}
          className="hidden lg:block px-3 py-1 cursor-pointer text-white rounded transition mb-2 shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
        >
          <span className="text-sm">
            <LuCrown className="inline mr-2" />
            ソロライブ予習モード
          </span>
        </Button>

        <div className="mb-1 md:mb-4 md:mt-2 lg:mt-0">
          {/* Search Bar */}
          <TagsInput
            placeholder="検索"
            leftSection={<HiSearch />}
            data={[
              {
                group: "タグ",
                items: availableTags
                  .filter((tag) => tag !== "")
                  .map((tag) => `tag:${tag}`),
              },
              {
                group: "マイルストーン",
                items: availableMilestones
                  .filter((milestone) => milestone !== "")
                  .map((milestone) => `milestone:${milestone}`),
              },
              {
                group: "アーティスト",
                items: availableArtists
                  .filter((artist) => artist !== "")
                  .map((artist) => `artist:${artist}`),
              },
              {
                group: "歌手",
                items: availableSingers
                  .filter((singer) => singer !== "")
                  .map((singer) => `sing:${singer}`),
              },
              {
                group: "曲名",
                items: availableSongTitles
                  .filter((title) => title !== "")
                  .map((title) => `title:${title}`),
              },
              {
                group: "季節",
                items: ["season:春", "season:夏", "season:秋", "season:冬"],
              },
            ]}
            renderOption={renderMultiSelectOption}
            maxDropdownHeight={200}
            value={searchValue}
            onChange={(values: string[]) => {
              setSearchValue(values);
              setSearchTerm(values.join("|"));
            }}
            limit={15}
            splitChars={["|"]}
            comboboxProps={{
              shadow: "md",
              transitionProps: { transition: "pop", duration: 100 },
            }}
            clearable
          />
        </div>
        <div className="block">
          <p className="text-xs text-muted-foreground dark:text-white mb-2">
            楽曲一覧 ({songs.length}曲/{allSongs.length}曲)
          </p>
        </div>
        <SongsList
          songs={songs}
          currentSongInfo={currentSongInfo}
          changeCurrentSong={changeCurrentSong}
          hideFutureSongs={hideFutureSongs}
        />
      </div>
    </section>
  );
}
