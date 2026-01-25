// SearchAndSongList.tsx
import { Suspense, useCallback, useEffect, useState } from "react";
import { Song } from "../types/song";
import SongsList from "./SongList";
import { Button } from "flowbite-react";
import { LuCrown, LuMusic } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { LuSparkles } from "react-icons/lu";
import {
  Button as MantineButton,
  Grid,
  Modal,
  ScrollArea,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import SearchInput from "./SearchInput";
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
  hideFutureSongs,
  changeCurrentSong,
  playRandomSong,
  setSearchTerm,
  setSongs,
  searchSongs,
}: SearchAndSongListProps) {
  const [isLoading, setIsLoading] = useState(true);

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
  const handlePlayPlaylist = useCallback(
    (playlist: Playlist) => {
      playPlaylist(playlist);
      setShowPlaylistSelector(false);
      setCurrentPlaylist(playlist);
    },
    [playPlaylist],
  );

  // Handles disabling playlist mode
  const handleDisablePlaylistMode = useCallback(() => {
    disablePlaylistMode();
    setShowPlaylistSelector(false);
    setCurrentPlaylist(null);
  }, [disablePlaylistMode]);

  const baseUrl = window.location.origin;

  useEffect(() => {
    const s = searchTerm.split("|").filter((s) => s.trim() !== "");
    if (s.length > 0) {
      setSearchValue(s);
    } else {
      setSearchValue([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    // URLでプレイリストの指定があったら反映（初回マウント時のみ）
    const decodedPlaylist = decodePlaylistFromUrl();

    if (decodedPlaylist) {
      setCurrentPlaylist(decodedPlaylist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

  return (
    <section className="flex md:w-1/2 lg:w-1/3 xl:w-5/12 sm:w-full foldable:w-1/2 flex-col min-h-0 h-dvh md:h-full foldable:h-full lg:h-full sm:mx-0">
      <div className="flex flex-col h-full bg-background px-2 lg:px-0 lg:pl-2 foldable:pt-1 py-0">
        <div className="mb-2 hidden lg:block foldable:block">
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
            <Grid.Col span={4} className="foldable:hidden">
              <Button
                onClick={() => {
                  // オリ曲モードをセット
                  setSearchTerm("original-songs");
                }}
                className="px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
              >
                <LuCrown className="mr-1" />
                <span className="text-sm">オリ曲モード</span>
              </Button>
            </Grid.Col>
            <Grid.Col span={4}>
              <Button
                onClick={() => {
                  // 楽曲紹介shortsモード
                  setSearchTerm("tag:楽曲紹介shorts");
                }}
                className="px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
              >
                <LuMusic className="mr-1" />
                <span className="text-sm">楽曲紹介shorts</span>
              </Button>
            </Grid.Col>
            <Grid.Col span={4}>
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

        <div className="lg:hidden md:mt-2 mb-2 foldable:hidden">
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

        <div className="mb-1 md:mb-4 md:mt-2 lg:mt-0 lg:hidden">
          {/* Search Bar */}
          <SearchInput
            allSongs={allSongs}
            searchValue={searchValue}
            onSearchChange={(values: string[]) => {
              setSearchValue(values);
              setSearchTerm(values.join("|"));
            }}
            placeholder="検索"
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
                      className="flex grow items-center rounded cursor-pointer"
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

                    <CopyButton
                      value={`${baseUrl}?playlist=${encodePlaylistUrlParam(
                        playlist,
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
