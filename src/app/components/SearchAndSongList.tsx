import { RefObject } from "react";
import { Song } from "../types/song";
import SongsList from "./SongList";
import FlowbiteReactAutocomplete from "./FlowbiteReactAutocomplete";
import { Button, TextInput, ToggleSwitch } from "flowbite-react";
import { HiChevronDown, HiChevronUp, HiSearch, HiX } from "react-icons/hi";
import { FaCompactDisc, FaMusic, FaTag, FaUser } from "react-icons/fa6";
import { LuCrown } from "react-icons/lu";

// Propsの型定義
type SearchAndSongListProps = {
  songs: Song[];
  allSongs: Song[];
  currentSongInfo: Song | null;
  searchTerm: string;
  advancedSearchOpen: boolean;
  availableSongTitles: string[];
  availableArtists: string[];
  availableSingers: string[];
  availableTags: string[];
  availableMilestones: string[];
  searchTitleRef: RefObject<string>;
  searchArtistRef: RefObject<string>;
  searchSingerRef: RefObject<string>;
  searchTagRef: RefObject<string>;
  searchMilestoneRef: RefObject<string>;
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song | null) => void;
  playRandomSong: (songList: Song[]) => void;
  setSearchTerm: (term: string) => void;
  setAdvancedSearchOpen: (isOpen: boolean) => void;
  handleAdvancedSearch: () => void;
  setSearchTitle: (title: string) => void;
  setSearchArtist: (artist: string) => void;
  setSearchSinger: (singer: string) => void;
  setSearchTag: (tag: string) => void;
  setSearchMilestone: (milestone: string) => void;
};

export default function SearchAndSongList({
  songs,
  allSongs,
  currentSongInfo,
  searchTerm,
  advancedSearchOpen,
  availableSongTitles,
  availableArtists,
  availableSingers,
  availableTags,
  availableMilestones,
  searchTitleRef,
  searchArtistRef,
  searchSingerRef,
  searchTagRef,
  searchMilestoneRef,
  hideFutureSongs,
  changeCurrentSong,
  playRandomSong,
  setSearchTerm,
  setAdvancedSearchOpen,
  handleAdvancedSearch,
  setSearchTitle,
  setSearchArtist,
  setSearchSinger,
  setSearchTag,
  setSearchMilestone,
}: SearchAndSongListProps) {
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
          <div className="relative">
            <TextInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="検索"
              icon={HiSearch}
              disabled={advancedSearchOpen}
              className="z-0"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                onClick={() => setSearchTerm("")}
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Advanced Search */}
          <Button
            onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            className={`text-xs h-5 p-4 py-0 w-full transition focus:ring-0 mt-1 cursor-pointer ${
              !advancedSearchOpen
                ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white"
                : "bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white"
            }`}
          >
            <span className="text-xs">
              高度な検索{" "}
              {!advancedSearchOpen ? (
                <HiChevronDown className="inline" />
              ) : (
                <HiChevronUp className="inline" />
              )}
            </span>
          </Button>
          <div
            className={`mb-6 ${
              advancedSearchOpen ? "visible" : "hidden"
            } transition-all duration-300 ease-in-out mt-1`}
          >
            <div className="relative mt-1">
              <FlowbiteReactAutocomplete
                options={availableSongTitles}
                onSelect={(value) => {
                  searchTitleRef.current = value;
                  setSearchTitle(value);
                  handleAdvancedSearch();
                }}
                inputProps={{
                  icon: FaMusic,
                  placeholder: "曲名",
                }}
              />
            </div>
            <div className="relative mt-1">
              <FlowbiteReactAutocomplete
                options={availableArtists}
                onSelect={(value) => {
                  searchArtistRef.current = value;
                  setSearchArtist(value);
                  handleAdvancedSearch();
                }}
                inputProps={{
                  icon: FaUser,
                  placeholder: "アーティスト",
                }}
              />
            </div>
            <div className="relative mt-1">
              <FlowbiteReactAutocomplete
                options={availableSingers}
                onSelect={(value) => {
                  searchSingerRef.current = value;
                  setSearchSinger(value);
                  handleAdvancedSearch();
                }}
                inputProps={{
                  icon: FaCompactDisc,
                  placeholder: "歌った人",
                }}
              />
            </div>
            <div className="relative mt-1">
              <FlowbiteReactAutocomplete
                options={availableTags}
                onSelect={(value) => {
                  searchTagRef.current = value;
                  setSearchTag(value);
                  handleAdvancedSearch();
                }}
                inputProps={{
                  icon: FaTag,
                  placeholder: "タグ",
                }}
              />
            </div>
            <div className="relative mt-1">
              <FlowbiteReactAutocomplete
                options={availableMilestones}
                onSelect={(value) => {
                  searchMilestoneRef.current = value;
                  setSearchMilestone(value);
                  handleAdvancedSearch();
                }}
                inputProps={{
                  icon: FaCompactDisc,
                  placeholder: "マイルストーン",
                }}
              />
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
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
