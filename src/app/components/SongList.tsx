"use client";

import { Button, Pagination } from "flowbite-react";
import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import { useEffect, useState, useMemo } from "react";
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
