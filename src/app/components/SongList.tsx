"use client";

import { Pagination } from "flowbite-react";
import { Song } from "../types/song";
import SongListItem from "./SongListItem";
import { useEffect, useState } from "react";

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
  const displayPage = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [slicedSongs, setSlicedSongs] = useState<Song[]>([]);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    setSlicedSongs(songs.slice((page - 1) * displayPage, page * displayPage));
  };

  // ページ数を計算
  const calculateTotalPage = () => {
    setTotalPage(Math.ceil(songs.length / displayPage));
  };

  useEffect(() => {
    calculateTotalPage();
    setSlicedSongs(songs.slice(currentPage, displayPage));
    // もしページ番号が範囲外の場合は1ページ目にする
    if (currentPage > totalPage) {
      onPageChange(1);
    }
  }, [songs]);

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

  useEffect(() => {}, [slicedSongs]);

  return (
    <>
      <ul className="song-list grid grid-cols-3 auto-rows-max md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 gap-2 overflow-y-auto h-dvh lg:h-full flex-grow dark:text-gray-300">
        {slicedSongs.map((song, index) => (
          <SongListItem
            key={`${song.video_id}-${song.start}`} // 安定したユニークなキーを使用
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
      {totalPage > 1 && (
        <div className="flex justify-center mb-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPage}
            onPageChange={onPageChange}
            previousLabel=""
            nextLabel=""
            showIcons
          />
        </div>
      )}
    </>
  );
};

export default SongsList;
