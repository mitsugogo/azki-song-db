import { Menu, MenuItem, ScrollArea, Switch, Tooltip } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { Button } from "flowbite-react";
import { useState } from "react";
import { FaRegStar, FaShare, FaStar } from "react-icons/fa6";
import usePlaylists, { Playlist } from "../hook/usePlaylists";
import { Song } from "../types/song";
import {
  MdOutlineCreateNewFolder,
  MdPlaylistAdd,
  MdPlaylistAddCheck,
} from "react-icons/md";
import CreatePlaylistModal from "./CreatePlaylistModal";

interface PlayerSettingPropps {
  currentSongInfo: Song | null;
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
  setOpenShereModal: (value: boolean) => void;
}

export default function PlayerSettings({
  currentSongInfo,
  hideFutureSongs,
  setHideFutureSongs,
  setOpenShereModal,
}: PlayerSettingPropps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useClickOutside(() => {
    setIsSettingsOpen(false);
  });

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const opendPlaylistRef = useClickOutside(() => {
    setShowPlaylistMenu(false);
  });

  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);

  // プレイリスト
  const {
    playlists,
    addToPlaylist,
    isInPlaylist,
    removeFromPlaylist,
    isInAnyPlaylist,
  } = usePlaylists();

  const addOrRemovePlaylist = (playlist: Playlist) => {
    if (isInPlaylist(playlist, currentSongInfo!)) {
      removeFromPlaylist(playlist, currentSongInfo!);
    } else {
      addToPlaylist(playlist, currentSongInfo!);
    }
  };

  return (
    <div
      className="inline-grid relative text-right grid-cols-1 md:grid-cols-3 gap-1"
      ref={settingsRef}
    >
      <div className="hidden md:block">
        <Menu width={300} withArrow opened={showPlaylistMenu}>
          <Menu.Target>
            <div className="flex items-center justify-center h-full">
              <Tooltip
                label={`${
                  isInAnyPlaylist(currentSongInfo!)
                    ? "プレイリスト追加済み"
                    : "プレイリストに追加"
                }`}
              >
                <Button
                  className="inline-flex w-10 h-10 items-center justify-center p-2 text-sm font-medium text-center cursor-pointer text-gray-900 bg-white rounded-full hover:bg-light-gray-100 ring-0 focus:ring-0 focus:outline-none dark:text-white dark:bg-gray-900 hover:dark:bg-gray-800"
                  onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                >
                  {isInAnyPlaylist(currentSongInfo!) ? (
                    <FaStar />
                  ) : (
                    <FaRegStar />
                  )}
                </Button>
              </Tooltip>
            </div>
          </Menu.Target>

          <Menu.Dropdown ref={opendPlaylistRef}>
            <Menu.Label>プレイリスト</Menu.Label>

            {playlists.length === 0 && (
              <div className="ml-3 mb-3">
                <span className="text-sm text-light-gray-300 dark:text-gray-300">
                  プレイリストはありません
                </span>
              </div>
            )}

            <ScrollArea mah={200}>
              {playlists.map((playlist, index) => (
                <MenuItem
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    addOrRemovePlaylist(playlist);

                    if (playlists.length === 1) {
                      setShowPlaylistMenu(false);
                      setIsSettingsOpen(false);
                    }
                  }}
                  leftSection={
                    isInPlaylist(playlist, currentSongInfo!) ? (
                      <MdPlaylistAddCheck className="mr-2 inline w-5 h-5" />
                    ) : (
                      <MdPlaylistAdd className="mr-2 inline w-5 h-5" />
                    )
                  }
                  component="div"
                  bg={isInPlaylist(playlist, currentSongInfo!) ? "blue" : ""}
                  color={
                    isInPlaylist(playlist, currentSongInfo!) ? "white" : ""
                  }
                  className="mb-0.5"
                >
                  {playlist.name}
                </MenuItem>
              ))}
            </ScrollArea>

            <Menu.Divider />
            <MenuItem
              onClick={() => {
                setIsSettingsOpen(false);
                setShowPlaylistMenu(false);
                setOpenCreatePlaylistModal(true);
              }}
            >
              <MdOutlineCreateNewFolder className="mr-2 inline w-5 h-5" />
              新しいプレイリストを作成
            </MenuItem>
          </Menu.Dropdown>
        </Menu>
      </div>
      <Button
        onClick={() => setOpenShereModal(true)}
        className="hidden md:inline-flex w-10 h-10 items-center justify-center p-2 text-sm font-medium text-center cursor-pointer text-gray-900 bg-white rounded-full hover:bg-light-gray-100 ring-0 focus:ring-0 focus:outline-none dark:text-white dark:bg-gray-900 hover:dark:bg-gray-800"
      >
        <div className="inline-block w-5 h-5">
          <FaShare className="relative top-1 left-1" />
        </div>
      </Button>
      <Button
        className="text-baseline inline-flex w-10 h-10 items-center p-2 text-sm font-medium text-center cursor-pointer rounded-full text-gray-900 bg-white hover:bg-light-gray-100 focus:ring-0 focus:outline-none dark:text-white dark:bg-gray-900 hover:dark:bg-gray-800"
        type="button"
        onClick={(event) => {
          setIsSettingsOpen(!isSettingsOpen);
        }}
      >
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 3"
        >
          <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      </Button>
      {isSettingsOpen && (
        <div className="absolute bottom-10 right-0 z-50 bg-white divide-y rounded-lg shadow-md w-80 divide-light-gray-300 dark:bg-gray-700 dark:divide-gray-600 text-left">
          <ul className="p-3 space-y-1 text-sm text-light-gray-700 dark:text-light-gray-100">
            <li>
              <div className="flex p-2 rounded-sm  hover:bg-light-gray-100 dark:hover:bg-gray-600 dark:text-gray-400">
                <Switch
                  checked={hideFutureSongs}
                  onChange={(event) => setHideFutureSongs(event.target.checked)}
                  color="pink"
                  label="セトリネタバレ防止モード"
                  className="text-light-gray-700 dark:text-light-gray-300 cursor-pointer"
                />
              </div>
            </li>
          </ul>
          <div className="py-2">
            <a
              href="#"
              className="block px-4 py-2 text-sm text-light-gray-700 hover:bg-light-gray-100 dark:hover:bg-gray-600 dark:text-gray-100 dark:hover:text-white"
              onClick={() => setOpenShereModal(true)}
            >
              <FaShare className="inline mr-2" />
              現在の楽曲をシェア
            </a>
          </div>
        </div>
      )}

      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
      />
    </div>
  );
}
