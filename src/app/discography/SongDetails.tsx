"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { BsPlayCircle } from "react-icons/bs";
import { FaYoutube, FaDatabase } from "react-icons/fa6";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import MilestoneBadge from "../components/MilestoneBadge";
import { StatisticsItem } from "./createStatistics";

const SongDetails = ({ song }: { song: StatisticsItem }) => {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const coverArtists = useMemo(() => {
    return Array.from(new Set(song.videos.map((v) => v.sing)));
  }, [song.song.tags]);

  return (
    <div className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 col-span-2 md:col-span-3 xl:col-span-4 p-4 bg-gray-50/20 dark:bg-gray-800 rounded-lg shadow-inner shadow-gray-100 dark:shadow-gray-900 my-2">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3 lg:w-1/2">
          <YoutubeThumbnail
            videoId={hoveredVideo ?? song.firstVideo.video_id}
            alt={song.firstVideo.video_title}
            fill={true}
          />
        </div>
        <div className="flex-1 text-gray-900 dark:text-gray-200">
          <h2 className="text-2xl font-bold mb-1">
            {song.isAlbum && song.firstVideo.album
              ? song.firstVideo.album
              : song.firstVideo.title}
          </h2>
          <p className="text-sm">アーティスト: {song.firstVideo.artist}</p>
          {!song.isAlbum && (
            <>
              {song.firstVideo.lyricist && (
                <p className="text-sm">
                  作詞:{" "}
                  {song.firstVideo.lyricist.split("、").map((n, i) => (
                    <Link
                      key={i}
                      href={`/?q=lyricist:${n}`}
                      className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                    >
                      {n}
                    </Link>
                  ))}
                </p>
              )}
              {song.firstVideo.composer && (
                <p className="text-sm">
                  作曲:{" "}
                  {song.firstVideo.composer.split("、").map((n, i) => (
                    <Link
                      key={i}
                      href={`/?q=composer:${n}`}
                      className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                    >
                      {n}
                    </Link>
                  ))}
                </p>
              )}
              {song.firstVideo.arranger && (
                <p className="text-sm">
                  編曲:{" "}
                  {song.firstVideo.arranger.split("、").map((n, i) => (
                    <Link
                      key={i}
                      href={`/?q=arranger:${n}`}
                      className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                    >
                      {n}
                    </Link>
                  ))}
                </p>
              )}
            </>
          )}
          {song.song.tags.includes("カバー曲") && (
            <p className="text-sm">カバー: {coverArtists.join("、")}</p>
          )}
          {!song.isAlbum && (
            <>
              <p className="text-sm">
                公開日:{" "}
                {new Date(song.lastVideo.broadcast_at).toLocaleDateString()}
              </p>
            </>
          )}

          <p className="text-sm">
            発売日:{" "}
            {new Date(song.firstVideo.album_release_at).toLocaleDateString()}
          </p>
          <p className="text-sm">収録曲数: {song.count}曲</p>

          <div className="mt-4 overflow-y-auto max-h-62.5">
            <Table striped hoverable border={3}>
              <TableHead className="sticky top-0">
                <TableRow>
                  <TableHeadCell className="px-2 py-1"></TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    曲名
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    アーティスト
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    作詞
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    作曲
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    編曲
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    動画公開日
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {song.videos.map((s, index) => (
                  <TableRow
                    key={index}
                    onMouseEnter={() => setHoveredVideo(s.video_id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <TableCell className="px-2 py-1 dark:text-light-gray-500">
                      <Link
                        href={`${s.tags.includes("カバー曲") ? `/?q=tag:カバー曲&v=${s.video_id}&t=${s.start ?? 0}s` : `/?q=tag:オリ曲|album:${s.album}&v=${s.video_id}`}`}
                        className=" hover:text-primary-600 dark:hover:text-white"
                      >
                        <BsPlayCircle size={24} />
                      </Link>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <Link
                        href={`${
                          s.tags.includes("カバー曲")
                            ? `/?q=tag:カバー曲&v=${s.video_id}&t=${s.start ?? 0}s`
                            : `/discography/${
                                s.slug ?? encodeURIComponent(s.title)
                              }`
                        }`}
                        className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
                      >
                        {s.title}
                      </Link>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <Link
                        href={`/?q=artist:${s.artist}`}
                        className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
                      >
                        {s.artist}
                      </Link>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      {s.lyricist &&
                        s.lyricist.split("、").map((n, i, arr) => (
                          <span key={i}>
                            <Link
                              href={`/?q=lyricist:${n}`}
                              className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                            >
                              {n}
                            </Link>
                            {i < arr.length - 1 ? "、" : ""}
                          </span>
                        ))}
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      {s.composer &&
                        s.composer.split("、").map((n, i, arr) => (
                          <span key={i}>
                            <Link
                              href={`/?q=composer:${n}`}
                              className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                            >
                              {n}
                            </Link>
                            {i < arr.length - 1 ? "、" : ""}
                          </span>
                        ))}
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      {s.arranger &&
                        s.arranger.split("、").map((n, i, arr) => (
                          <span key={i}>
                            <Link
                              href={`/?q=arranger:${n}`}
                              className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                            >
                              {n}
                            </Link>
                            {i < arr.length - 1 ? "、" : ""}
                          </span>
                        ))}
                    </TableCell>
                    <TableCell className="px-2 py-1 dark:text-light-gray-500">
                      {new Date(s.broadcast_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Link
              href={
                song.isAlbum && song.firstVideo.album_list_uri
                  ? song.firstVideo.album_list_uri
                  : `https://www.youtube.com/watch?v=${song.firstVideo.video_id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-full flex items-center justify-center sm:justify-start"
            >
              <FaYoutube className="mr-2" /> YouTubeで見る
            </Link>
            <Link
              href={
                song.isAlbum
                  ? `/?q=album:${song.firstVideo.album}&v=${song.firstVideo.video_id}`
                  : song.song.tags.includes("カバー曲")
                    ? `/?q=title:${song.firstVideo.title}|tag:カバー曲`
                    : `/?q=title:${song.firstVideo.title}|tag:オリ曲`
              }
              className="text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-full flex items-center justify-center sm:justify-start"
            >
              <FaDatabase className="mr-2" /> データベースで見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
