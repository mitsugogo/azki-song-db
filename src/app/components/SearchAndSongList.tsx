import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Song } from "../types/song";
import { useTranslations } from "next-intl";
import SongsList from "./SongList";
import { Button } from "@mantine/core";
import {
  LuArrowDownWideNarrow,
  LuArrowUpWideNarrow,
  LuChevronDown,
  LuX,
} from "react-icons/lu";
import { LuSparkles } from "react-icons/lu";
import {
  Button as MantineButton,
  Menu,
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
import {
  getSongMode,
  getSongModeIcon,
  getSongModeGroupLabels,
  getSongModeItemLabel,
  getSongModeTriggerButtonClassName,
  SONG_MODE_MENU_ITEMS,
  type SongMode,
  type SongModeGroup,
  type SongModeMenuItem,
} from "./songModeMenu";

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
  isTheaterMode?: boolean;
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
  isTheaterMode,
}: SearchAndSongListProps & SearchAndSongListPropsExt) {
  const t = useTranslations("Watch.searchAndSongList");
  const tSongMode = useTranslations("Watch.songMode");
  const overlayOpen = Boolean(isOverlayOpen);
  const currentSongMode = getSongMode(searchTerm);
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const currentSongModeButtonClassName =
    getSongModeTriggerButtonClassName(searchTerm);

  const songModeMenuItems = SONG_MODE_MENU_ITEMS;
  const allSongModeItem =
    songModeMenuItems.find((item) => item.mode === "") ?? songModeMenuItems[0];
  const originalSongModeItem =
    songModeMenuItems.find((item) => item.mode === "original-songs") ??
    songModeMenuItems[0];
  const karaokeSongModeItem =
    songModeMenuItems.find((item) => item.mode === "tag:歌枠") ??
    songModeMenuItems[0];
  const otherSongModeMenuItems = songModeMenuItems.filter(
    (item) =>
      item.mode !== "" &&
      item.mode !== "original-songs" &&
      item.mode !== "tag:歌枠",
  );
  const songModeGroupedItems = {
    mode: otherSongModeMenuItems.filter((item) => item.group === "mode"),
    theme: otherSongModeMenuItems.filter((item) => item.group === "theme"),
  } as const;
  const isOtherModeActive =
    currentSongMode !== "" &&
    currentSongMode !== "original-songs" &&
    currentSongMode !== "tag:歌枠";
  const currentOtherSongModeItem = isOtherModeActive
    ? otherSongModeMenuItems.find((item) => item.mode === currentSongMode)
    : undefined;

  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() =>
    currentSongMode === "original-songs" ? "asc" : "desc",
  );
  const [isSongModeMenuOpen, setIsSongModeMenuOpen] = useState(false);
  const previousSongModeRef = useRef<SongMode>(currentSongMode);

  const sortedSongs = useMemo(() => {
    const order = sortOrder === "asc" ? 1 : -1;

    return [...songs].sort((leftSong, rightSong) => {
      const leftDate = new Date(leftSong.broadcast_at || "").getTime();
      const rightDate = new Date(rightSong.broadcast_at || "").getTime();

      const normalizedLeftDate = Number.isNaN(leftDate) ? 0 : leftDate;
      const normalizedRightDate = Number.isNaN(rightDate) ? 0 : rightDate;

      if (normalizedLeftDate !== normalizedRightDate) {
        return (normalizedLeftDate - normalizedRightDate) * order;
      }

      const leftOrder = leftSong.source_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = rightSong.source_order ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return leftSong.title.localeCompare(rightSong.title) * order;
    });
  }, [songs, sortOrder]);

  const { playlists, isNowPlayingPlaylist } = usePlaylists();
  const { favorites } = useFavorites();
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);

  const { playPlaylist, disablePlaylistMode, decodePlaylistFromUrl } =
    usePlaylistActions({
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

  useEffect(() => {
    const previousSongMode = previousSongModeRef.current;
    previousSongModeRef.current = currentSongMode;

    if (previousSongMode === currentSongMode) {
      return;
    }

    if (
      previousSongMode === "original-songs" &&
      currentSongMode !== "original-songs"
    ) {
      setSortOrder("desc");
      return;
    }

    if (currentSongMode !== "original-songs") {
      return;
    }

    const originalModeSongs = searchSongs(allSongs, "original-songs");
    setSortOrder("asc");
    setSongs(originalModeSongs);

    if (originalModeSongs.length > 0) {
      changeCurrentSong(originalModeSongs[0]);
    }
  }, [allSongs, changeCurrentSong, currentSongMode, searchSongs, setSongs]);

  const renderSongModeMenuItems = useCallback(
    () =>
      songModeMenuItems.map((item) => {
        const SongModeIcon = item.icon;

        return (
          <Menu.Item
            key={item.mode || "all-songs"}
            leftSection={<SongModeIcon className="w-4 h-4" />}
            onClick={() => {
              setSearchTerm(item.mode);
              setIsSongModeMenuOpen(false);
            }}
          >
            {getSongModeItemLabel(item, tSongMode)}
          </Menu.Item>
        );
      }),
    [setSearchTerm, songModeMenuItems, tSongMode],
  );

  const renderSongModeToggleButton = useCallback(
    (item: SongModeMenuItem, sizeClassName: string) => {
      const { mode, buttonClassName } = item;
      const label = getSongModeItemLabel(item, tSongMode);
      const isActive = currentSongMode === mode;
      const SongModeIcon = getSongModeIcon(mode);
      const button = (
        <Button
          onClick={() => {
            if (isActive) {
              setIsSongModeMenuOpen((current) => !current);
              return;
            }

            setSearchTerm(mode);
          }}
          aria-haspopup={isActive ? "menu" : undefined}
          aria-expanded={isActive ? isSongModeMenuOpen : undefined}
          // モードに応じたアイコンを表示
          leftSection={
            SongModeIcon ? <SongModeIcon className="w-4 h-4" /> : null
          }
          rightSection={<span />}
          className={`px-3 py-1 h-8 w-full cursor-pointer rounded transition shadow-md ring-0 focus:ring-0 ${sizeClassName} ${
            isActive
              ? `text-white shadow-gray-400/20 dark:shadow-none ${buttonClassName}`
              : "bg-light-gray-200 hover:bg-light-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white"
          }`}
          justify="space-between"
          fullWidth
        >
          <span className={sizeClassName}>{label}</span>
        </Button>
      );

      if (!isActive) {
        return button;
      }

      return (
        <Menu
          withinPortal={false}
          opened={isSongModeMenuOpen}
          onChange={setIsSongModeMenuOpen}
          width={220}
          position="bottom-start"
          withArrow
        >
          <Menu.Target>{button}</Menu.Target>
          <Menu.Dropdown>{renderSongModeMenuItems()}</Menu.Dropdown>
        </Menu>
      );
    },
    [
      currentSongMode,
      isSongModeMenuOpen,
      renderSongModeMenuItems,
      setSearchTerm,
      tSongMode,
    ],
  );

  const renderOtherSongModeMenu = useCallback(
    (sizeClassName: string) => (
      <Menu width={180} position="bottom-start" withArrow>
        <Menu.Target>
          <Button
            className={
              isOtherModeActive
                ? currentSongModeButtonClassName
                : `px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 bg-light-gray-200 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-500 ${sizeClassName}`
            }
            leftSection={
              currentOtherSongModeItem ? (
                <currentOtherSongModeItem.icon />
              ) : (
                <span />
              )
            }
            rightSection={<LuChevronDown />}
            fullWidth
            justify="space-between"
          >
            {currentOtherSongModeItem
              ? getSongModeItemLabel(currentOtherSongModeItem, tSongMode)
              : tSongMode("other")}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {(Object.keys(songModeGroupedItems) as SongModeGroup[]).map(
            (group) => {
              const items = songModeGroupedItems[group];
              if (items.length === 0) {
                return null;
              }

              return (
                <Fragment key={group}>
                  <Menu.Label>{songModeGroupLabels[group]}</Menu.Label>
                  {items.map((item) => {
                    const ModeIcon = item.icon;
                    return (
                      <Menu.Item
                        key={item.mode}
                        leftSection={<ModeIcon className="w-4 h-4" />}
                        onClick={() => setSearchTerm(item.mode)}
                      >
                        {getSongModeItemLabel(item, tSongMode)}
                      </Menu.Item>
                    );
                  })}
                  {group === "mode" && songModeGroupedItems.theme.length > 0 ? (
                    <Menu.Divider />
                  ) : null}
                </Fragment>
              );
            },
          )}
        </Menu.Dropdown>
      </Menu>
    ),
    [
      currentOtherSongModeItem,
      currentSongModeButtonClassName,
      isOtherModeActive,
      setSearchTerm,
      songModeGroupLabels,
      songModeGroupedItems,
      tSongMode,
    ],
  );

  const renderSongModeControlRows = useCallback(
    (sizeClassName: string, randomLabel: string) => (
      <>
        <Grid grow gutter={{ base: 5 }} className="mt-2">
          <Grid.Col span={4}>
            {renderSongModeToggleButton(allSongModeItem, sizeClassName)}
          </Grid.Col>
          <Grid.Col span={4}>
            {renderSongModeToggleButton(originalSongModeItem, sizeClassName)}
          </Grid.Col>
          <Grid.Col span={4}>
            {renderSongModeToggleButton(karaokeSongModeItem, sizeClassName)}
          </Grid.Col>
        </Grid>
        <Grid grow gutter={{ base: 5 }} className="mt-2">
          <Grid.Col span={12}>
            {renderOtherSongModeMenu(sizeClassName)}
          </Grid.Col>
        </Grid>
        <Grid grow gutter={{ base: 5 }} className="mt-2">
          <Grid.Col span={6}>
            <Button
              onClick={() => playRandomSong(songs)}
              className="px-3 py-1 h-8 w-full bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition shadow-md shadow-black/20 dark:shadow-none ring-0 focus:ring-0"
            >
              <span className={sizeClassName}>
                <LuSparkles className="mr-1 inline" />
                {randomLabel}
              </span>
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button
              className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 ${sizeClassName}  ${
                isNowPlayingPlaylist()
                  ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                  : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
              onClick={() => {
                setShowPlaylistSelector(true);
              }}
            >
              {t("playlist")}
            </Button>
          </Grid.Col>
        </Grid>
      </>
    ),
    [
      allSongModeItem,
      isNowPlayingPlaylist,
      karaokeSongModeItem,
      originalSongModeItem,
      playRandomSong,
      renderOtherSongModeMenu,
      renderSongModeToggleButton,
      setShowPlaylistSelector,
      songs,
      t,
    ],
  );

  return (
    <section
      className={`flex sm:w-full flex-col min-h-0 sm:mx-0 transition-[width] duration-300 ease-in-out ${
        isTheaterMode
          ? "md:w-full lg:w-full xl:w-full md:h-auto lg:h-auto foldable:w-full foldable:h-auto"
          : "foldable:w-1/2 md:w-1/3 lg:w-1/3 xl:w-5/12 md:h-full foldable:h-full lg:h-full"
      }`}
    >
      <div
        className={`flex flex-col bg-background px-2 lg:px-0 lg:pl-2 foldable:pt-1 py-0 ${
          isTheaterMode ? "h-auto min-h-fit" : "h-full min-h-0"
        }`}
      >
        <div className="mb-2 hidden lg:block foldable:hidden md:foldable:block">
          {renderSongModeControlRows("text-sm", t("randomOtherSong"))}
        </div>

        <div className="hidden md:block lg:hidden foldable:hidden mt-2">
          {renderSongModeControlRows("text-xs", t("randomOtherSong"))}
        </div>

        <div
          className={`hidden md:flex md:flex-col ${
            isTheaterMode ? "md:min-h-fit" : "md:min-h-0 md:flex-1"
          }`}
        >
          <div className="mb-1 md:mb-4 md:mt-2 lg:mt-0 lg:hidden">
            {/* Search Bar */}
            <SearchInput
              allSongs={allSongs}
              searchValue={searchValue}
              onSearchChange={(values: string[]) => {
                setSearchValue(values);
                setSearchTerm(values.join("|"));
              }}
              placeholder={t("search")}
            />
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground dark:text-white">
              {t("songList")} ({songs.length}
              {t("songsUnit_w/o_en")}/{allSongs.length}
              {t("songsUnit_w/o_en")})
            </p>
            <button
              type="button"
              onClick={() =>
                setSortOrder((previousOrder) =>
                  previousOrder === "asc" ? "desc" : "asc",
                )
              }
              aria-label={`${sortOrder === "asc" ? t("sortAscending") : t("sortDescending")}`}
              className={`h-6 rounded-md border border-light-gray-300 dark:border-gray-600 px-2 text-[11px] text-muted-foreground dark:text-white hover:bg-light-gray-200 dark:hover:bg-gray-700 ${
                songs.length > 15 ? "mr-11" : ""
              }`}
            >
              {sortOrder === "asc" ? (
                <LuArrowUpWideNarrow className="h-4 w-4" />
              ) : (
                <LuArrowDownWideNarrow className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className={isTheaterMode ? "h-[60vh]" : "flex-1 min-h-0"}>
            <Suspense fallback={<Loading />}>
              <SongsList
                songs={sortedSongs}
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
                    placeholder={t("search")}
                  />
                </div>
                <Tooltip withArrow label={t("close")}>
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
              {renderSongModeControlRows("text-xs", t("randomOtherSong"))}
            </div>

            <div className="px-3 py-0 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground dark:text-white">
                {t("songList")} ({songs.length}
                {t("songsUnit")}/{allSongs.length}
                {t("songsUnit")})
              </p>
              <button
                type="button"
                onClick={() =>
                  setSortOrder((previousOrder) =>
                    previousOrder === "asc" ? "desc" : "asc",
                  )
                }
                aria-label={`${sortOrder === "asc" ? t("sortAscending") : t("sortDescending")}`}
                className={`h-6 rounded-md border border-light-gray-300 dark:border-gray-600 px-2 text-[11px] text-muted-foreground dark:text-white hover:bg-light-gray-200 dark:hover:bg-gray-700`}
              >
                {sortOrder === "asc" ? (
                  <LuArrowUpWideNarrow className="h-4 w-4" />
                ) : (
                  <LuArrowDownWideNarrow className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 mt-2 ml-3 mr-1">
              <div className="h-full">
                <Suspense fallback={<Loading />}>
                  <SongsList
                    songs={sortedSongs}
                    currentSong={currentSong}
                    changeCurrentSong={changeCurrentSong as any}
                    hideFutureSongs={hideFutureSongs}
                    isInOverlay={true}
                    onSelectSong={() => setIsOverlayOpen?.(false)}
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
        title={t("playlist")}
      >
        <Modal.Body>
          {playlists.length === 0 && favorites.length === 0 ? (
            <>
              <div>{t("createPlaylistLead")}</div>
              <MantineButton
                onClick={() => setOpenCreatePlaylistModal(true)}
                className="mt-2"
              >
                <MdOutlineCreateNewFolder className="mr-2 inline w-5 h-5" />
                {t("createPlaylist")}
              </MantineButton>
            </>
          ) : (
            <>
              {currentPlaylist && (
                <>
                  <div className="bg-green-100 dark:bg-gray-800 py-2 px-3 rounded text-sm">
                    {t("nowPlayingPlaylist", {
                      name: currentPlaylist?.name ?? "",
                      count: currentPlaylist?.songs.length ?? 0,
                    })}
                  </div>
                  <div className="my-3 border-b border-gray-300"></div>
                </>
              )}

              <div className="mb-2 mx-3 text-sm">{t("selectPlaylist")}</div>
              <ScrollArea h={400}>
                {/* お気に入りを最上段に表示 */}
                {favorites.length > 0 &&
                  (() => {
                    const favoritesPlaylist: Playlist = {
                      id: "system-favorites",
                      name: t("favorites"),
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
                            ({favorites.length}
                            {t("songsUnit")})
                          </span>
                        </div>

                        <CopyButton
                          value={`${baseUrl}?playlist=${encodePlaylistUrlParam(
                            favoritesPlaylist,
                          )}`}
                          timeout={2000}
                        >
                          {({ copied, copy }) => (
                            <Tooltip withArrow label={t("copyPlaylistUrl")}>
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
                        ({playlist.songs.length}
                        {t("songsUnit")})
                      </span>
                    </div>

                    <CopyButton
                      value={`${baseUrl}?playlist=${encodePlaylistUrlParam(
                        playlist,
                      )}`}
                      timeout={2000}
                    >
                      {({ copied, copy }) => (
                        <Tooltip withArrow label={t("copyPlaylistUrl")}>
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
                  {t("disablePlaylistMode")}
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
          {t("close")}
        </MantineButton>
      </Modal>

      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
      />
    </section>
  );
}
