"use client";

import { Button, Pagination } from "flowbite-react";
import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import { useEffect, useState } from "react";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

interface SongListProps {
  songs: Song[];
  currentSongInfo: Song | null;
  changeCurrentSong: (song: Song, isRandom: boolean) => void;
}

const SongsList = ({
  songs,
  currentSongInfo,
  changeCurrentSong,
}: SongListProps) => {
  const displayPage = 204; // 横に2か3か4で並ぶのでタイルがキリよく並ぶ数にする
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [slicedSongs, setSlicedSongs] = useState<Song[]>([]);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * displayPage;
    const endIndex = Math.min(startIndex + displayPage, songs.length + 1);
    setSlicedSongs(songs.slice(startIndex, endIndex));
  };

  // ページ数を計算
  const calculateTotalPage = () => {
    setTotalPage(Math.ceil(songs.length / displayPage));
  };

  useEffect(() => {
    calculateTotalPage();
    setSlicedSongs(
      songs.slice((currentPage - 1) * displayPage, currentPage * displayPage)
    );
    onPageChange(1);
  }, [songs]);

  useEffect(() => {
    calculateTotalPage();
    // 先頭の要素にスクロール
    const listElement = document.getElementById("song-list-scrollbar");
    if (listElement) {
      const currentSongElement = document.querySelector(
        `[data-video-id="${currentSongInfo?.video_id}"][data-start-time="${currentSongInfo?.start}"]`
      );
      if (currentSongElement) {
        currentSongElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "end",
        });
      } else {
        const firstElement = listElement.querySelector("li");
        if (firstElement) {
          firstElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    // もしページ番号が範囲外の場合は1ページ目にする
    if (currentPage > totalPage) {
      onPageChange(1);
    }
  }, [slicedSongs]);

  useEffect(() => {
    // currentSongから何ページ目か求める
    const currentPage = Math.max(
      1,
      Math.ceil(
        (songs.findIndex(
          (song) =>
            song.video_id === currentSongInfo?.video_id &&
            song.title === currentSongInfo?.title &&
            song.start === currentSongInfo?.start
        ) +
          1) /
          displayPage
      )
    );
    onPageChange(currentPage);
  }, [currentSongInfo]);

  return (
    <>
      <OverlayScrollbarsComponent
        id="song-list-scrollbar"
        options={{ scrollbars: { autoHide: "leave" } }}
        element="div"
        className=""
        defer
      >
        <ul
          id="song-list"
          className="song-list grid grid-cols-1 auto-rows-max md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 gap-2 h-dvh lg:h-full flex-grow dark:text-gray-300"
        >
          {slicedSongs.map((song, index) => (
            <SongListItem
              key={`${song.video_id}-${song.start}`}
              song={song}
              isSelected={
                currentSongInfo?.title === song.title &&
                currentSongInfo.video_id === song.video_id &&
                currentSongInfo.start === song.start
              }
              changeCurrentSong={changeCurrentSong}
            />
          ))}
        </ul>
      </OverlayScrollbarsComponent>
      {totalPage > 1 && (
        <div className="flex justify-center mt-0 md:mt-2 mb-2 lg:mb-0">
          <div className="mt-2 inline-flex items-center -space-x-px mr-1">
            <Button
              className="text-xl ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 enabled:hover:bg-gray-100 enabled:hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 enabled:dark:hover:bg-gray-700 enabled:dark:hover:text-white inline-flex"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              style={{ height: "38px" }}
            >
              <MdSkipPrevious />
            </Button>
          </div>
          <Pagination
            layout="pagination"
            className="hidden lg:block"
            currentPage={currentPage}
            totalPages={totalPage}
            onPageChange={onPageChange}
            previousLabel=""
            nextLabel=""
            showIcons
          />
          <Pagination
            layout="navigation"
            className="block lg:hidden"
            currentPage={currentPage}
            totalPages={totalPage}
            onPageChange={onPageChange}
            previousLabel=""
            nextLabel=""
            showIcons
          />
          <div className="mt-2 inline-flex items-center -space-x-px ml-1">
            <Button
              className="text-xl ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 enabled:hover:bg-gray-100 enabled:hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 enabled:dark:hover:bg-gray-700 enabled:dark:hover:text-white inline-flex"
              onClick={() => onPageChange(totalPage)}
              disabled={currentPage === totalPage}
              style={{ height: "38px" }}
            >
              <MdSkipNext />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SongsList;
