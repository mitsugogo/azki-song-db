// SearchAndSongList.tsx
import { Suspense, useCallback, useEffect, useState } from "react";
import { Song } from "../types/song";
import SongsList from "./SongList";
import { Button } from "flowbite-react";
import { LuCrown, LuMusic, LuX } from "react-icons/lu";
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
import useFavorites from "../hook/useFavorites";
import { FaStar } from "react-icons/fa6";
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
import MobileActionButtons from "./MobileActionButtons";

// Propsの型定義
type SearchAndSongListProps = {
  songs: Song[];
  allSongs: Song[];
  currentSong: Song | null;
  searchTerm: string;
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song | null) => void;
  playRandomSong: (songList: Song[]) => void;
  setSearchTerm: (term: string) => void;
  setSongs: (songs: Song[]) => void;
  searchSongs: (songsToFilter: Song[], term: string) => Song[];
  showPlaylistSelector: boolean;
  setShowPlaylistSelector: (open: boolean) => void;
};

type SearchAndSongListPropsExt = {
  isOverlayOpen?: boolean;
  setIsOverlayOpen?: (open: boolean) => void;
};

export default function SearchAndSongList({
  songs,
  allSongs,
  searchTerm,
  currentSong,
  hideFutureSongs,
  changeCurrentSong,
  playRandomSong,
  setSearchTerm,
  setSongs,
  searchSongs,
  showPlaylistSelector,
  setShowPlaylistSelector,
  isOverlayOpen,
  setIsOverlayOpen,
}: SearchAndSongListProps & SearchAndSongListPropsExt) {
  const [isLoading, setIsLoading] = useState(true);
  const overlayOpen = Boolean(isOverlayOpen);

  const [searchValue, setSearchValue] = useState<string[]>([]);

  const { playlists, addToPlaylist, removeFromPlaylist, isNowPlayingPlaylist } =
    usePlaylists();
  const { favorites } = useFavorites();
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
    <section className="flex md:w-1/3 lg:w-1/3 xl:w-5/12 sm:w-full foldable:w-1/2 flex-col min-h-0  md:h-full foldable:h-full lg:h-full sm:mx-0">
      <div className="flex flex-col h-full min-h-0 bg-background px-2 lg:px-0 lg:pl-2 foldable:pt-1 py-0">
        <div className="mb-2 hidden lg:block foldable:hidden md:foldable:block">
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
                <span className="text-sm">
                  オリ曲<span className="hidden 2xl:inline">モード</span>
                </span>
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
                <span className="text-sm">
                  楽曲紹介<span className="hidden 2xl:inline">shorts</span>
                </span>
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

        <div className="hidden md:block lg:hidden foldable:hidden mt-2">
          <MobileActionButtons
            onSurprise={() => playRandomSong(songs)}
            onOriginal={() => setSearchTerm("original-songs")}
            onPlaylist={() => setShowPlaylistSelector(true)}
          />
        </div>

        <div className="hidden md:flex md:flex-col md:min-h-0 md:flex-1">
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

          <div className="flex-1 min-h-0">
            <Suspense fallback={<Loading />}>
              <SongsList
                songs={songs}
                currentSong={currentSong}
                changeCurrentSong={changeCurrentSong as any}
                hideFutureSongs={hideFutureSongs}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/** Mobile: オーバーレイ検索 */}
      <>
        <div
          aria-hidden={!overlayOpen}
          className={`fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden transition-opacity duration-300 ${
            overlayOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsOverlayOpen?.(false)}
        />

        <div
          aria-hidden={!overlayOpen}
          className={`fixed inset-x-0 bottom-0 md:hidden z-60 transform transition-transform duration-300 ${
            overlayOpen ? "translate-y-0" : "translate-y-full"
          } ${overlayOpen ? "" : "pointer-events-none"}`}
        >
          <div className="h-[90vh] max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-lg shadow-lg overflow-hidden flex flex-col">
            <div className="px-3 pt-3 pb-2 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="flex-1">
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
                <Tooltip withArrow label="閉じる">
                  <button
                    aria-label="Close song list"
                    onClick={() => setIsOverlayOpen?.(false)}
                    className="p-2 rounded-full bg-light-gray-200 dark:bg-gray-700"
                  >
                    {/* Close Icon */}
                    <LuX className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 mt-2 ml-3 mr-1">
              <div className="h-full">
                <Suspense fallback={<Loading />}>
                  <SongsList
                    songs={songs}
                    currentSong={currentSong}
                    changeCurrentSong={changeCurrentSong as any}
                    hideFutureSongs={hideFutureSongs}
                    isInOverlay={true}
                    onOverlayClose={() => setShowPlaylistSelector(true)}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </>

      <Modal
        opened={showPlaylistSelector}
        onClose={() => setShowPlaylistSelector(false)}
        title="プレイリスト"
      >
        <Modal.Body>
          {playlists.length === 0 && favorites.length === 0 ? (
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
                {/* お気に入りを最上段に表示 */}
                {favorites.length > 0 &&
                  (() => {
                    const favoritesPlaylist: Playlist = {
                      id: "system-favorites",
                      name: "お気に入り",
                      songs: favorites,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    const isCurrent =
                      favoritesPlaylist.id === currentPlaylist?.id;
                    return (
                      <div
                        key="system-favorites"
                        className={`flex items-center gap-x-1 mb-1 py-2 px-1 ${
                          isCurrent
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-yellow-50 dark:bg-yellow-900/10"
                        } border-l-4 border-yellow-400`}
                      >
                        <div
                          className="flex grow items-center rounded cursor-pointer"
                          onClick={() => {
                            handlePlayPlaylist(favoritesPlaylist);
                          }}
                        >
                          {isCurrent ? (
                            <MdPlayArrow className="mr-2 inline w-5 h-5" />
                          ) : (
                            <FaStar className="mr-2 inline w-5 h-5 text-yellow-500" />
                          )}
                          <span className="font-semibold">
                            {favoritesPlaylist.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-light-gray-400">
                            ({favorites.length}曲)
                          </span>
                        </div>

                        <CopyButton
                          value={`${baseUrl}?playlist=${encodePlaylistUrlParam(
                            favoritesPlaylist,
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
                    );
                  })()}

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
                      <span className="font-semibold">{playlist.name}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-light-gray-400">
                        ({playlist.songs.length}曲)
                      </span>
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
