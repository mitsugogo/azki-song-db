"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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

const SongDetails = ({ song }: { song: StatisticsItem }) => {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const rawVideos = song.videos || [];
  const videos = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of rawVideos) {
      const title = (v.title || "").trim();
      const artist = (v.artist || "").trim();
      const singers = ((v.sing || "") as string)
        .split("、")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .sort()
        .join("、");
      const key = `${title}__${artist}__${singers}`;
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
  const [prevVideoId, setPrevVideoId] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(false);
  const [currVisible, setCurrVisible] = useState(true);

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
  const TRANSITION_DURATION = 500; // ms, Tailwind の duration-500 と合わせる

  // 自動スライド（ホバー中は表示を変えない）
  useEffect(() => {
    if (!videos || videos.length <= 1) return;
    const id = setInterval(() => {
      if (hoveredVideo) return; // ホバー時は自動切替を行わない
      setCurrentIndex((i) => {
        const next = (i + 1) % videos.length;
        const nextId = videos[next].video_id;
        const oldId = displayedVideoId;

        // 準備: prev をセットし、curr を非表示にしてから次のフレームで入れ替える
        setPrevVideoId(oldId);
        setPrevVisible(true);
        setCurrVisible(false);
        setDisplayedVideoId(nextId);

        requestAnimationFrame(() => {
          // フェード開始: prev をフェードアウト、curr をフェードイン
          setPrevVisible(false);
          setCurrVisible(true);
        });

        // TRANSITION_DURATION 後に prev を削除
        setTimeout(() => {
          setPrevVideoId(null);
          setPrevVisible(false);
        }, TRANSITION_DURATION + 50);

        return next;
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [videos, hoveredVideo, displayedVideoId]);

  // hoveredVideo が変わったら即時表示（フェードなし）
  useEffect(() => {
    if (hoveredVideo) {
      // ホバー中はホバービデオを即時表示。prev をクリアしてフェードなしで切替。
      setPrevVideoId(null);
      setPrevVisible(false);
      setDisplayedVideoId(hoveredVideo);
      setCurrVisible(true);
    } else {
      // ホバー解除時は currentIndex の位置に戻す
      setDisplayedVideoId(
        videos[currentIndex]?.video_id ?? song.firstVideo.video_id,
      );
      setCurrVisible(true);
    }
  }, [hoveredVideo, currentIndex, videos, song.firstVideo.video_id]);

  // この組み合わせにユニット名があるか
  const unitName = getCollabUnitName(song.firstVideo.sing.split("、"));

  return (
    <div className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 col-span-2 md:col-span-3 xl:col-span-4 p-4 bg-gray-50/20 dark:bg-gray-800 rounded-lg shadow-inner shadow-gray-100 dark:shadow-gray-900 my-2">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3 relative aspect-video">
          {/* 前の画像（フェードアウト） */}
          {prevVideoId && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                prevVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <YoutubeThumbnail
                videoId={prevVideoId}
                alt={song.firstVideo.video_title}
                fill={true}
              />
            </div>
          )}

          {/* 現在表示中の画像（フェードイン） */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              currVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <YoutubeThumbnail
              videoId={displayedVideoId}
              alt={song.firstVideo.video_title}
              fill={true}
            />
          </div>
        </div>
        <div className="flex-1 text-gray-900 dark:text-gray-200">
          <h2 className="text-2xl font-bold mb-1">
            {song.isAlbum && song.firstVideo.album
              ? song.firstVideo.album
              : song.firstVideo.title}
          </h2>
          <p className="text-sm">
            アーティスト:{" "}
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
                  作詞:{" "}
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
                  作曲:{" "}
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
                  編曲:{" "}
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
              カバー:{" "}
              {coverArtists.map((n, i) => (
                <>
                  <Link
                    key={i + "_cover"}
                    href={`/search?q=sing:${encodeURIComponent(n)}`}
                    className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500 mr-1"
                  >
                    {n}
                  </Link>
                  {i < coverArtists.length - 1 ? "、" : ""}
                </>
              ))}
              {unitName && (
                <>
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
                </>
              )}
              {!unitName && (
                <>
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
                    この組み合わせ
                  </Badge>
                </>
              )}
            </p>
          )}
          {!song.isAlbum && (
            <>
              <p className="text-sm">
                公開日:{" "}
                {new Date(song.lastVideo.broadcast_at).toLocaleDateString()}
              </p>
            </>
          )}

          {song.firstVideo.album_release_at && (
            <p className="text-sm">
              発売日:{" "}
              {new Date(
                song.firstVideo.album_release_at ??
                  song.firstVideo.broadcast_at ??
                  song.lastVideo.broadcast_at,
              ).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm">収録曲数: {videos.length}曲</p>

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
                {videos.map((s, index) => (
                  <TableRow
                    key={index}
                    onMouseEnter={() => setHoveredVideo(s.video_id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <TableCell className="px-2 py-1 dark:text-light-gray-500">
                      <Link
                        href={`${s.tags.includes("カバー曲") ? `/?q=tag:カバー曲&v=${s.video_id}${Number(s.start ?? 0) > 0 ? `&t=${s.start}s` : ""}` : `/?q=tag:オリ曲|album:${s.album}&v=${s.video_id}`}`}
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
