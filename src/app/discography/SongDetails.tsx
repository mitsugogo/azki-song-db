"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { Badge } from "@mantine/core";
import { BsPlayCircle } from "react-icons/bs";
import { FaYoutube, FaDatabase } from "react-icons/fa6";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { StatisticsItem } from "./createStatistics";
import { isCollaborationSong, isPossibleOriginalSong } from "../config/filters";
import { getCollabMembers, getCollabUnitName } from "../config/collabUnits";
import slugify from "../lib/slugify";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../lib/formatDate";
import { normalizeSongTitle } from "./utils/normalizeSongTitle";

const SongDetails = ({ song }: { song: StatisticsItem }) => {
  const t = useTranslations("Discography");
  const locale = useLocale();
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const displayTitle = normalizeSongTitle(
    song.firstVideo.title,
    song.firstVideo.artist,
  );

  const rawVideos = song.videos || [];
  const videos = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of rawVideos) {
      const key = v.slugv2 || `${v.video_id}__${Number(v.start ?? 0)}`;
      if (!map.has(key)) {
        map.set(key, v);
      } else {
        const existing = map.get(key);
        const existingIsMV = (existing.tags || []).some((t: string) =>
          t.includes("MV"),
        );
        const vIsMV = (v.tags || []).some((t: string) => t.includes("MV"));
        if (vIsMV && !existingIsMV) {
          map.set(key, v);
        }
      }
    }
    return Array.from(map.values());
  }, [rawVideos]);
  const initialIndex = Math.max(
    0,
    videos.findIndex((v) => v.video_id === song.firstVideo.video_id),
  );
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [displayedVideoId, setDisplayedVideoId] = useState<string>(
    song.firstVideo.video_id,
  );
  const displayedVideoIdRef = useRef<string>(song.firstVideo.video_id);

  useEffect(() => {
    displayedVideoIdRef.current = displayedVideoId;
  }, [displayedVideoId]);

  const coverArtists = useMemo(() => {
    // videos の sing を "、" で分割して個別のアーティスト名を順序を保ってユニーク化
    const names: string[] = [];
    const seen = new Set<string>();
    for (const v of videos) {
      const parts = ((v.sing || "") as string)
        .split("、")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of parts) {
        if (!seen.has(p)) {
          seen.add(p);
          names.push(p);
        }
      }
    }
    return names;
  }, [videos]);

  // スライドショー間隔（ミリ秒）
  const SLIDE_INTERVAL = 5000;

  // 自動スライド（ホバー中は表示を変えない）
  useEffect(() => {
    if (!videos || videos.length <= 1) return;
    const id = setInterval(() => {
      if (hoveredVideo) return; // ホバー時は自動切替を行わない
      setCurrentIndex((i) => {
        const next = (i + 1) % videos.length;
        const nextId = videos[next].video_id;
        setDisplayedVideoId(nextId);
        displayedVideoIdRef.current = nextId;

        return next;
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [videos, hoveredVideo]);

  // hoveredVideo が変わったら即時表示（フェードなし）
  useEffect(() => {
    if (hoveredVideo) {
      // ホバー中はホバービデオを即時表示。
      setDisplayedVideoId(hoveredVideo);
      displayedVideoIdRef.current = hoveredVideo;
    } else {
      // ホバー解除時は currentIndex の位置に戻す
      const nextId = videos[currentIndex]?.video_id ?? song.firstVideo.video_id;
      setDisplayedVideoId(nextId);
      displayedVideoIdRef.current = nextId;
    }
  }, [hoveredVideo, currentIndex, videos, song.firstVideo.video_id]);

  // この組み合わせにユニット名があるか
  const unitName = getCollabUnitName(song.firstVideo.sing.split("、"));
  const albumPath = song.firstVideo.album
    ? `/discography/album/${encodeURIComponent(slugify(song.firstVideo.album))}`
    : null;

  return (
    <div className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 col-span-2 md:col-span-3 xl:col-span-4 p-4 bg-gray-50/20 dark:bg-gray-800 rounded-lg shadow-inner shadow-gray-100 dark:shadow-gray-900 my-2">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3 relative aspect-video">
          {song.isAlbum ? (
            <YoutubeThumbnail
              videoId={song.firstVideo.video_id}
              alt={song.firstVideo.video_title}
            />
          ) : (
            <>
              <YoutubeThumbnail
                key={displayedVideoId}
                videoId={displayedVideoId}
                alt={song.firstVideo.video_title}
              />
            </>
          )}
        </div>
        <div className="flex-1 text-gray-900 dark:text-gray-200">
          <h2 className="text-2xl font-bold mb-1">
            {song.isAlbum && song.firstVideo.album && albumPath ? (
              <Link
                href={albumPath}
                className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
              >
                {song.firstVideo.album}
              </Link>
            ) : (
              displayTitle
            )}
          </h2>
          <p className="text-sm">
            {t("table.artist")}{" "}
            <Link
              href={`/search?q=artist:${encodeURIComponent(song.firstVideo.artist)}`}
              className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
            >
              {song.firstVideo.artist}
            </Link>
          </p>
          {!song.isAlbum && (
            <>
              {song.firstVideo.lyricist && (
                <p className="text-sm">
                  {t("table.lyricist")}{" "}
                  {song.firstVideo.lyricist.split("、").map((n, i) => (
                    <Link
                      key={i + "_lyricist"}
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
                  {t("table.composer")}{" "}
                  {song.firstVideo.composer.split("、").map((n, i) => (
                    <Link
                      key={i + "_composer"}
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
                  {t("table.arranger")}{" "}
                  {song.firstVideo.arranger.split("、").map((n, i) => (
                    <Link
                      key={i + "_arranger"}
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
            <p className="text-sm">
              {t("labels.cover")}{" "}
              {coverArtists.map((n, i) => (
                <span key={`${n}_${i}_coverArtist`}>
                  <Link
                    href={`/search?q=sing:${encodeURIComponent(n)}`}
                    className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                  >
                    {n}
                  </Link>
                  {i < coverArtists.length - 1 ? "、" : ""}
                </span>
              ))}
              {unitName && (
                <span key={`${unitName}_unitName`}>
                  {" "}
                  -{" "}
                  <Badge
                    key={unitName}
                    color={`indigo`}
                    radius="sm"
                    style={{ cursor: "pointer" }}
                    component="a"
                    href={`/search?q=unit:${encodeURIComponent(unitName)}`}
                  >
                    {unitName}
                  </Badge>
                </span>
              )}
              {!unitName && coverArtists.length > 1 && (
                <span key={`coverArtists_${coverArtists.join("_")}`}>
                  {" "}
                  -{" "}
                  <Badge
                    variant="gradient"
                    gradient={{ from: "pink", to: "red", deg: 276 }}
                    radius="sm"
                    style={{ cursor: "pointer" }}
                    component="a"
                    href={`/search?q=${coverArtists
                      .map((m) => `sing:${encodeURIComponent(m)}`)
                      .join("|")}`}
                  >
                    {t("badge.thisCombination")}
                  </Badge>
                </span>
              )}
            </p>
          )}
          {!song.isAlbum && (
            <span>
              <p className="text-sm">
                {t("labels.publishedDate")}{" "}
                {formatDate(song.lastVideo.broadcast_at, locale)}
              </p>
            </span>
          )}

          {song.firstVideo.album_release_at && (
            <p className="text-sm">
              {t("labels.releaseDate")}{" "}
              {formatDate(
                song.firstVideo.album_release_at ??
                  song.firstVideo.broadcast_at ??
                  song.lastVideo.broadcast_at,
                locale,
              )}
            </p>
          )}
          <p className="text-sm">
            {t("tracksCount", { count: videos.length })}
          </p>

          <div className="mt-4 overflow-y-auto max-h-62.5">
            <Table striped hoverable border={3}>
              <TableHead className="sticky top-0">
                <TableRow>
                  <TableHeadCell className="px-2 py-1"></TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.songName")}
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.artist")}
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.lyricist")}
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.composer")}
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.arranger")}
                  </TableHeadCell>
                  <TableHeadCell className="px-2 py-1 dark:text-light-gray-500">
                    {t("table.videoDate")}
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videos.map((s, index) => (
                  <TableRow
                    key={index}
                    onMouseEnter={() => {
                      if (!song.isAlbum) {
                        setHoveredVideo(s.video_id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!song.isAlbum) {
                        setHoveredVideo(null);
                      }
                    }}
                  >
                    <TableCell className="px-2 py-1 dark:text-light-gray-500">
                      <Link
                        href={`${s.tags.includes("カバー曲") ? `/watch?q=tag:カバー曲&v=${s.video_id}${Number(s.start ?? 0) > 0 ? `&t=${s.start}` : ""}` : `/watch?q=tag:オリ曲|album:${s.album}&v=${s.video_id}`}`}
                        className=" hover:text-primary-600 dark:hover:text-white"
                      >
                        <BsPlayCircle size={24} />
                      </Link>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <Link
                        href={`/discography/${isPossibleOriginalSong(s) ? "originals" : isCollaborationSong(s) ? "collaborations" : "covers"}/${
                          s.slugv2 ?? encodeURIComponent(s.video_id)
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
                        s.lyricist
                          .split("、")
                          .map((n: string, i: number, arr: string[]) => (
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
                        s.composer
                          .split("、")
                          .map((n: string, i: number, arr: string[]) => (
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
                        s.arranger
                          .split("、")
                          .map((n: string, i: number, arr: string[]) => (
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
                      {formatDate(s.broadcast_at, locale)}
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
              <FaYoutube className="mr-2" /> {t("buttons.watchOnYouTube")}
            </Link>
            <Link
              href={
                song.isAlbum
                  ? `/watch?q=album:${encodeURIComponent(song.firstVideo.album)}&v=${song.firstVideo.video_id}`
                  : `/watch?v=${song.firstVideo.video_id}${Number(song?.firstVideo?.start ?? 0) > 0 ? `&t=${song.firstVideo.start}` : ""}`
              }
              className="text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-full flex items-center justify-center sm:justify-start"
            >
              <FaDatabase className="mr-2" /> {t("buttons.viewInDatabase")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
