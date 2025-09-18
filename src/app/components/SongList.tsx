"use client";

import { Button, Pagination } from "flowbite-react";
import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import { useEffect, useState, useMemo } from "react";
import {
  MdFirstPage,
  MdLastPage,
  MdSkipNext,
  MdSkipPrevious,
} from "react-icons/md";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { HiChevronLeft } from "react-icons/hi";
import { useSwipeable } from "react-swipeable"; // 追加

interface SongListProps {
  songs: Song[];
  currentSongInfo: Song | null;
  hideFutureSongs: boolean;
  changeCurrentSong: (song: Song, isRandom: boolean) => void;
}

const SongsList = ({
  songs,
  currentSongInfo,
  hideFutureSongs,
  changeCurrentSong,
}: SongListProps) => {
  const displayPage = 204;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPage = useMemo(() => {
    return Math.ceil(songs.length / displayPage);
  }, [songs, displayPage]);

  const onPageChange = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPage));
    setCurrentPage(newPage);
  };

  const slicedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * displayPage;
    const endIndex = Math.min(startIndex + displayPage, songs.length);
    return songs.slice(startIndex, endIndex);
  }, [songs, currentPage, displayPage]);

  useEffect(() => {
    if (currentSongInfo) {
      const songIndex = songs.findIndex(
        (song) =>
          song.video_id === currentSongInfo?.video_id &&
          song.title === currentSongInfo?.title &&
          song.start === currentSongInfo?.start
      );

      if (songIndex !== -1) {
        const page = Math.ceil((songIndex + 1) / displayPage);
        setCurrentPage(page);
      } else {
        setCurrentPage(1);
      }
    } else {
      setCurrentPage(1);
    }
  }, [songs, currentSongInfo, displayPage]);

  useEffect(() => {
    const listElement = document.getElementById("song-list-scrollbar");
    if (listElement) {
      const currentSongElement = document.querySelector(
        `[data-video-id="${currentSongInfo?.video_id}"][data-start-time="${currentSongInfo?.start}"]`
      );
      if (currentSongElement) {
        currentSongElement.scrollIntoView({
          behavior: "instant",
          block: "center",
          inline: "end",
        });
      } else {
        const firstElement = listElement.querySelector("li");
        if (firstElement) {
          firstElement.scrollIntoView({
            behavior: "instant",
            block: "center",
          });
        }
      }
    }
  }, [currentPage, slicedSongs, currentSongInfo]);

  // useSwipeableフックの定義
  const handlers = useSwipeable({
    onSwipedLeft: () => onPageChange(currentPage + 1),
    onSwipedRight: () => onPageChange(currentPage - 1),
    preventScrollOnSwipe: true, // スワイプ中のスクロールを防ぐ
    trackMouse: true, // デスクトップでのマウスドラッグを有効にする
  });

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
          className="song-list grid grid-cols-1 auto-rows-max md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-2 h-dvh lg:h-full flex-grow dark:text-gray-300"
          {...handlers} // handlersを適用
        >
          {slicedSongs.map((song, index) => (
            <SongListItem
              key={`${song.video_id}-${song.start}-${index}`}
              song={song}
              isSelected={
                currentSongInfo?.title === song.title &&
                currentSongInfo.video_id === song.video_id &&
                currentSongInfo.start === song.start
              }
              changeCurrentSong={changeCurrentSong}
              isHide={
                hideFutureSongs &&
                currentSongInfo?.video_id === song.video_id &&
                index >
                  slicedSongs.findIndex(
                    (song) =>
                      currentSongInfo?.title === song.title &&
                      currentSongInfo.video_id === song.video_id &&
                      currentSongInfo.start === song.start
                  )
              }
            />
          ))}
        </ul>
      </OverlayScrollbarsComponent>

      {totalPage > 1 && (
        <div className="flex items-center justify-center col-span-2 py-2">
          <div className="flex items-center justify-between w-full text-gray-600 dark:text-gray-200 bg-gray-50/30 rounded-lg dark:bg-gray-600 max-w-[180px] mx-2">
            {/* First Page Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-1 w-20 rounded-s-lg dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-0 cursor-pointer"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <MdFirstPage className="w-5 h-5 rtl:rotate-180" />
              <span className="sr-only">First page</span>
            </button>
            {/* Previous Page Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-3 w-20 dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-0 cursor-pointer"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg
                className="w-2 h-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 1 1 5l4 4"
                />
              </svg>
              <span className="sr-only">Previous page</span>
            </button>
            <span className="shrink-0 mx-1 text-sm font-medium space-x-0.5 rtl:space-x-reverse">
              {currentPage} of {totalPage}
            </span>
            {/* Next Page Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-3 w-20 dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-0 cursor-pointer"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPage}
            >
              <svg
                className="w-2 h-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span className="sr-only">Next page</span>
            </button>
            {/* Last Page Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-1 w-10 rounded-e-lg dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-0 cursor-pointer"
              onClick={() => onPageChange(totalPage)}
              disabled={currentPage === totalPage}
            >
              <MdLastPage className="w-5 h-5 rtl:rotate-180" />
              <span className="sr-only">Last page</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SongsList;
