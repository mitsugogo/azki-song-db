// SearchAndSongList.tsx
import { Suspense, useEffect, useState } from "react";
import { Song } from "../types/song";
import SongsList from "./SongList";
import { Button } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaMusic, FaStar, FaTag, FaUser } from "react-icons/fa6";
import { LuCrown } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { LuSparkles } from "react-icons/lu";
import {
  Button as MantineButton,
  Grid,
  Group,
  Modal,
  ScrollArea,
  TagsInput,
  TagsInputProps,
  Text,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import usePlaylists, { Playlist } from "../hook/usePlaylists";
import {
  MdCheck,
  MdContentCopy,
  MdOutlineCreateNewFolder,
  MdPlayArrow,
  MdPlaylistPlay,
  MdPlaylistRemove,
} from "react-icons/md";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { usePlaylistActions } from "../hook/usePlaylistActions";
import Loading from "../loading";

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
  setSongs: (songs: Song[]) => void;
  searchSongs: (songsToFilter: Song[], term: string) => Song[];
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
  setSongs,
  searchSongs,
}: SearchAndSongListProps) {
  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  const { playlists, addToPlaylist, removeFromPlaylist, isNowPlayingPlaylist } =
    usePlaylists();
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);

  const {
    playPlaylist,
    disablePlaylistMode,
    decodePlaylistFromUrl,
    isInPlaylist,
  } = usePlaylistActions({
    allSongs,
    setSongs,
    changeCurrentSong,
    setSearchTerm,
  });

  const { encodePlaylistUrlParam } = usePlaylists();

  // Handles playing a playlist
  const handlePlayPlaylist = (playlist: Playlist) => {
    playPlaylist(playlist);
    setShowPlaylistSelector(false);
    setCurrentPlaylist(playlist);
  };

  // Handles disabling playlist mode
  const handleDisablePlaylistMode = () => {
    disablePlaylistMode();
    setShowPlaylistSelector(false);
    setCurrentPlaylist(null);
  };

  const baseUrl = window.location.origin;

  useEffect(() => {
    const s = searchTerm.split("|").filter((s) => s.trim() !== "");
    if (s.length > 0) {
      setSearchValue(searchTerm.split("|"));
    }
  }, [searchTerm]);

  useEffect(() => {
    // URLでプレイリストの指定があったら反映
    const decodedPlaylist = decodePlaylistFromUrl();

    // プレイリストが変更された場合にのみ状態を更新
    if (
      (!decodedPlaylist && currentPlaylist) ||
      (decodedPlaylist && decodedPlaylist.id !== currentPlaylist?.id)
    ) {
      setCurrentPlaylist(decodedPlaylist);
    }
  }, [decodePlaylistFromUrl, currentPlaylist]);

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
        <div className="mb-2 hidden lg:block">
          <Button
            onClick={() => playRandomSong(songs)}
            className="px-3 py-1 h-8 w-full bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0"
          >
            <span className="text-sm">
              <LuSparkles className="mr-1 inline" />
              ランダムで他の曲にする
            </span>
          </Button>
          <Grid grow gutter={{ base: 5 }} className="mt-2">
            <Grid.Col span={6}>
              <Button
                onClick={() => {
                  // ソロライブ用のプレイリストをセット
                  setSearchTerm("sololive2025");
                }}
                className="px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
              >
                <LuCrown className="mr-1" />
                <span className="text-sm">ソロライブ予習</span>
              </Button>
            </Grid.Col>
            <Grid.Col span={6}>
              <Button
                className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0  ${
                  isNowPlayingPlaylist()
                    ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                    : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                }`}
                onClick={() => {
                  setShowPlaylistSelector(true);
                }}
              >
                プレイリスト
              </Button>
            </Grid.Col>
          </Grid>
        </div>

        <div className="lg:hidden md:mt-2 mb-2">
          <Button
            className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition ring-0 focus:ring-0  ${
              isNowPlayingPlaylist()
                ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            onClick={() => {
              setShowPlaylistSelector(true);
            }}
          >
            プレイリスト
          </Button>
        </div>

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
                group: "歌った人",
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

        <Suspense fallback={<Loading />}>
          <SongsList
            songs={songs}
            currentSongInfo={currentSongInfo}
            changeCurrentSong={changeCurrentSong}
            hideFutureSongs={hideFutureSongs}
          />
        </Suspense>
      </div>
      <Modal
        opened={showPlaylistSelector}
        onClose={() => setShowPlaylistSelector(false)}
        title="プレイリスト"
      >
        <Modal.Body>
          {playlists.length === 0 ? (
            <>
              <div>
                プレイリストを作成して、自分だけのセットリストを作成しましょう！
              </div>
              <MantineButton
                onClick={() => setOpenCreatePlaylistModal(true)}
                className="mt-2"
              >
                <MdOutlineCreateNewFolder className="mr-2 inline w-5 h-5" />
                プレイリストを作成
              </MantineButton>
            </>
          ) : (
            <>
              {currentPlaylist && (
                <>
                  <div className="bg-green-100 dark:bg-gray-800 py-2 px-3 rounded text-sm">
                    ♪ 「{currentPlaylist?.name}」プレイリスト (
                    {currentPlaylist?.songs.length}
                    曲) を再生中
                  </div>
                  <div className="my-3 border-b border-gray-300"></div>
                </>
              )}

              <div className="mb-2 mx-3 text-sm">
                再生するプレイリストを選択してください
              </div>
              <ScrollArea h={400}>
                {playlists.map((playlist, index) => (
                  <div
                    key={`${index}-${playlist.id}`}
                    className={`flex items-center gap-x-1 mb-1 py-2 px-1 ${
                      playlist.id === currentPlaylist?.id
                        ? "bg-green-100 dark:bg-gray-600"
                        : ""
                    }`}
                  >
                    <div
                      className="flex flex-grow items-center ounded cursor-pointer"
                      onClick={() => {
                        handlePlayPlaylist(playlist);
                      }}
                    >
                      {playlist.id === currentPlaylist?.id ? (
                        <MdPlayArrow className="mr-2 inline w-5 h-5" />
                      ) : (
                        <MdPlaylistPlay className="mr-2 inline w-5 h-5" />
                      )}
                      {playlist.name}
                    </div>
                    <Tooltip
                      withArrow
                      label={`${
                        isInPlaylist(playlist, currentSongInfo!)
                          ? "現在の楽曲をプレイリストから削除します"
                          : "現在の楽曲をプレイリストに追加します"
                      }`}
                    >
                      <MantineButton
                        size="xs"
                        onClick={() => {
                          if (currentSongInfo) {
                            if (isInPlaylist(playlist, currentSongInfo)) {
                              removeFromPlaylist(playlist, currentSongInfo);
                            } else {
                              addToPlaylist(playlist, currentSongInfo);
                            }
                          }
                        }}
                        bg={`${
                          currentSongInfo &&
                          isInPlaylist(playlist, currentSongInfo)
                            ? "green"
                            : "gray"
                        }`}
                      >
                        {currentSongInfo &&
                        isInPlaylist(playlist, currentSongInfo) ? (
                          <MdCheck className="inline w-5 h-5" />
                        ) : (
                          <MdAdd className="inline w-5 h-5" />
                        )}
                      </MantineButton>
                    </Tooltip>
                    <CopyButton
                      value={`${baseUrl}?playlist=${encodePlaylistUrlParam(
                        playlist
                      )}`}
                      timeout={2000}
                    >
                      {({ copied, copy }) => (
                        <Tooltip
                          withArrow
                          label="URLをコピーしてプレイリストをシェアできます"
                        >
                          <MantineButton
                            onClick={copy}
                            color={`${copied ? "green" : "gray"}`}
                            size="xs"
                          >
                            {copied ? (
                              <MdCheck className="inline w-5 h-5" />
                            ) : (
                              <MdContentCopy className="inline w-5 h-5" />
                            )}
                          </MantineButton>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </div>
                ))}
              </ScrollArea>

              <div className="border-t border-light-gray-300 dark:border-gray-600 mt-2">
                <MantineButton
                  className="mt-2"
                  color={"gray"}
                  w={"100%"}
                  onClick={handleDisablePlaylistMode}
                  leftSection={
                    <MdPlaylistRemove className="mr-2 inline w-5 h-5" />
                  }
                >
                  プレイリスト再生モードを解除
                </MantineButton>
              </div>
            </>
          )}
        </Modal.Body>
        <MantineButton
          variant="filled"
          color="dark"
          className="ml-3"
          onClick={() => setShowPlaylistSelector(false)}
        >
          閉じる
        </MantineButton>
      </Modal>

      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
      />
    </section>
  );
}
