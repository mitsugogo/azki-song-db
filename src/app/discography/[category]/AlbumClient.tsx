"use client";

import Link from "next/link";
import { Fragment } from "react";
import { Song } from "../../types/song";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { FaDatabase, FaYoutube } from "react-icons/fa6";
import { LoadingOverlay } from "@mantine/core";
import {
  isCollaborationSong,
  isPossibleOriginalSong,
} from "../../config/filters";
import useSongs from "../../hook/useSongs";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { LuFolder } from "react-icons/lu";
import DiscographyBreadcrumbs from "../components/DiscographyBreadcrumbs";

function resolveSongCategory(
  song: Song,
): "originals" | "collaborations" | "covers" {
  if (isPossibleOriginalSong(song)) return "originals";
  if (isCollaborationSong(song)) return "collaborations";
  return "covers";
}

function buildSongDetailPath(song: Song): string {
  const category = resolveSongCategory(song);
  const slug = song.slugv2 ?? song.video_id;
  return `/discography/${category}/${encodeURIComponent(slug)}`;
}

function getCategoryBreadcrumb(song: Song): { label: string; href: string } {
  const category = resolveSongCategory(song);
  if (category === "originals") {
    return { label: "オリジナル楽曲", href: "/discography/originals" };
  }
  if (category === "collaborations") {
    return { label: "ユニット・ゲスト楽曲", href: "/discography/collab" };
  }
  return { label: "カバー楽曲", href: "/discography/covers" };
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function AlbumClient({
  albumName,
  coverVideoId,
}: {
  albumName: string;
  coverVideoId?: string;
}) {
  const { allSongs, isLoading } = useSongs();
  const songs: Song[] = allSongs ?? [];
  const albumSongs = Array.from(
    new Map(
      songs
        .filter(
          (song) => song.album && song.video_id && song.album === albumName,
        )
        .map((song) => [song.video_id, song]),
    ).values(),
  ).sort((left, right) => {
    const leftOrder = left.source_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.source_order ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
  const leadSong =
    albumSongs.find((song) => song.video_id === coverVideoId) ?? albumSongs[0];
  const isCoverAlbum = albumSongs.some((song) => {
    const artist = song.artist?.trim();
    const singer = song.sing?.trim();
    if (!artist || !singer) return false;
    return artist !== singer;
  });

  if (isLoading) {
    return (
      <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  if (albumSongs.length === 0) {
    return (
      <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">アルバムが見つかりません</h1>
        <p className="text-sm text-gray-600">
          指定されたアルバムの収録曲を取得できませんでした。
        </p>
      </div>
    );
  }
  if (!leadSong) {
    return null;
  }
  const updatedAt = albumSongs
    .map((song) => new Date(song.broadcast_at).getTime())
    .filter((ts) => !Number.isNaN(ts))
    .sort((a, b) => b - a)[0];
  const playlistUrl = leadSong.album_list_uri
    ? leadSong.album_list_uri.startsWith("http")
      ? leadSong.album_list_uri
      : `https://www.youtube.com/playlist?list=${encodeURIComponent(leadSong.album_list_uri)}`
    : null;
  const categoryBreadcrumb = getCategoryBreadcrumb(leadSong);

  return (
    <div className="p-6 w-full mx-auto">
      <DiscographyBreadcrumbs
        items={[
          { label: categoryBreadcrumb.label, href: categoryBreadcrumb.href },
          {
            label: (
              <>
                <LuFolder className="inline mr-1" /> {albumName}
              </>
            ),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <aside className="rounded-xl bg-gray-50/20 dark:bg-gray-800 p-4">
          <div className="overflow-hidden rounded-lg">
            <YoutubeThumbnail
              videoId={leadSong.video_id}
              alt={albumName}
              fill={true}
            />
          </div>

          <h1 className="text-4xl font-extrabold mt-4 mb-2">{albumName}</h1>
          {!isCoverAlbum && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              アーティスト: {leadSong.artist}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            発売日: {formatDate(leadSong.album_release_at)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            収録曲数: {albumSongs.length}曲
          </p>
          {updatedAt && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              最終公開日: {new Date(updatedAt).toLocaleDateString("ja-JP")}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={
                playlistUrl ??
                `https://www.youtube.com/watch?v=${leadSong.video_id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-full flex items-center justify-center"
            >
              <FaYoutube className="mr-2" /> YouTubeで見る
            </Link>
            <Link
              href={`/?q=album:${encodeURIComponent(albumName)}&v=${leadSong.video_id}`}
              className="text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-full flex items-center justify-center"
            >
              <FaDatabase className="mr-2" /> データベースで見る
            </Link>
          </div>
        </aside>

        <section className="rounded-xl bg-gray-50/20 dark:bg-gray-800 overflow-hidden p-2 md:p-3">
          <div className="w-full overflow-x-auto rounded-lg">
            <Table
              border={3}
              className="w-full min-w-full table-auto md:table-fixed"
            >
              <TableHead className="sticky top-0">
                <TableRow>
                  <TableHeadCell className="w-12 px-2 py-2 whitespace-nowrap dark:text-light-gray-500">
                    #
                  </TableHeadCell>
                  <TableHeadCell className="px-3 py-2 whitespace-nowrap dark:text-light-gray-500">
                    曲名
                  </TableHeadCell>
                  <TableHeadCell className="px-3 py-2 whitespace-nowrap dark:text-light-gray-500">
                    アーティスト
                  </TableHeadCell>
                  <TableHeadCell className="px-3 py-2 whitespace-nowrap dark:text-light-gray-500">
                    歌った人
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {albumSongs.map((song, index) => {
                  const stripeRowClass =
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-light-gray-100 dark:bg-gray-700";

                  return (
                    <Fragment key={`${song.video_id}-${index}`}>
                      <TableRow
                        key={`${song.video_id}-${index}-main`}
                        className={stripeRowClass}
                      >
                        <TableCell className="w-12 px-2 py-2 whitespace-nowrap align-top">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-3 py-2 align-top min-w-52">
                          <div className="flex items-start gap-2 md:gap-3 min-w-0">
                            <div className="w-20 h-12 md:w-28 md:h-16 shrink-0 overflow-hidden rounded">
                              <YoutubeThumbnail
                                videoId={song.video_id}
                                alt={song.title}
                                fill={true}
                                imageClassName="object-cover"
                              />
                            </div>
                            <Link
                              href={buildSongDetailPath(song)}
                              className="min-w-0 text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 whitespace-normal wrap-break-word leading-snug"
                            >
                              {song.title}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 dark:text-light-gray-500 align-top">
                          <div className="max-w-44 whitespace-normal wrap-break-word leading-snug">
                            {song.artist}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 dark:text-light-gray-500 align-top">
                          <div className="max-w-52 whitespace-normal wrap-break-word leading-snug">
                            {song.sing || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow
                        key={`${song.video_id}-${index}-meta`}
                        className={stripeRowClass}
                      >
                        <TableCell
                          colSpan={4}
                          className="px-3 py-2 text-xs dark:text-light-gray-500"
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>作詞: {song.lyricist || "-"}</span>
                            <span>作曲: {song.composer || "-"}</span>
                            <span>編曲: {song.arranger || "-"}</span>
                            <span>
                              動画公開日: {formatDate(song.broadcast_at)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
