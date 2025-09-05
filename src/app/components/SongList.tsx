"use client";

import { Button, Pagination } from "flowbite-react";
import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import { useEffect, useState, useMemo } from "react";
import { MdFirstPage, MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { HiChevronLeft } from "react-icons/hi";

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
  const displayPage = 204;
  const [currentPage, setCurrentPage] = useState(1);

  // songsの変更時にtotalPageを計算
  const totalPage = useMemo(() => {
    return Math.ceil(songs.length / displayPage);
  }, [songs, displayPage]);

  // ページネーションと曲リストの同期
  const onPageChange = (page: number) => {
    // ページ番号が範囲外にならないように調整
    const newPage = Math.max(1, Math.min(page, totalPage));
    setCurrentPage(newPage);
  };

  // 表示する曲リストをcurrentPageに基づいて動的に生成
  const slicedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * displayPage;
    const endIndex = Math.min(startIndex + displayPage, songs.length);
    return songs.slice(startIndex, endIndex);
  }, [songs, currentPage, displayPage]);

  // songsまたはcurrentSongInfoが変更されたときにページを調整
  useEffect(() => {
    if (currentSongInfo) {
      // 現在再生中の曲が何ページ目にあるか計算
      const songIndex = songs.findIndex(
        (song) =>
          song.video_id === currentSongInfo?.video_id &&
          song.title === currentSongInfo?.title &&
          song.start === currentSongInfo?.start
      );

      if (songIndex !== -1) {
        const page = Math.ceil((songIndex + 1) / displayPage);
        // ページを自動で切り替える
        setCurrentPage(page);
      } else {
        // 現在再生中の曲が見つからない場合は1ページ目に戻す
        setCurrentPage(1);
      }
    } else {
      // currentSongInfoがnullの場合は1ページ目に戻す
      setCurrentPage(1);
    }
  }, [songs, currentSongInfo, displayPage]);

  // currentPageまたはslicedSongsが変更されたときにスクロール位置を調整
  useEffect(() => {
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
        // 再生中の曲が現在のページにない場合、ページの先頭にスクロール
        const firstElement = listElement.querySelector("li");
        if (firstElement) {
          firstElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [currentPage, slicedSongs, currentSongInfo]);

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
              key={`${song.video_id}-${song.start}-${index}`}
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
        <div className="flex items-center justify-center col-span-2 py-2">
          <div className="flex items-center justify-between w-full text-gray-600 dark:text-gray-400 bg-gray-100 rounded-lg dark:bg-gray-600 max-w-[128px] mx-2">
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-1 w-10 rounded-s-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
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
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-1 w-10 bg-gray-100 rounded-e-lg dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
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
          </div>
        </div>
      )}
    </>
  );
};

export default SongsList;
