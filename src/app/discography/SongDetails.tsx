"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Badge, Table } from "@mantine/core";
import { BsPlayCircle } from "react-icons/bs";
import { FaYoutube, FaDatabase } from "react-icons/fa6";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { StatisticsItem } from "./createStatistics";
import type { Song } from "../types/song";
import {
  isCollaborationSong,
  isOverallSong,
  isPossibleOriginalSong,
} from "../config/filters";
import { getCollabMembers, getCollabUnitName } from "../config/collabUnits";
import slugify from "../lib/slugify";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../lib/formatDate";
import { normalizeSongTitle } from "./utils/normalizeSongTitle";
import { getAlbumPlaylistUrl } from "./utils/albumLinks";
import ReleaseVariantSwitcher from "./components/ReleaseVariantSwitcher";
import {
  findReleaseVariantByInstanceKey,
  getSongInstanceKey,
  groupReleaseVariants,
  type ReleaseVariantGroup,
} from "./utils/releaseVariants";

function SongDetailsVariantRow({
  group,
  isAlbumView,
  locale,
  onPreview,
}: {
  group: ReleaseVariantGroup;
  isAlbumView: boolean;
  locale: string;
  onPreview: (song: Song | null) => void;
}) {
  const defaultInstanceKey = getSongInstanceKey(group.representative);
  const [selectedInstanceKey, setSelectedInstanceKey] =
    useState(defaultInstanceKey);
  const selectedSong =
    findReleaseVariantByInstanceKey(group.variants, selectedInstanceKey) ??
    group.representative;
  const resolvedInstanceKey = getSongInstanceKey(selectedSong);

  useEffect(() => {
    if (!findReleaseVariantByInstanceKey(group.variants, selectedInstanceKey)) {
      setSelectedInstanceKey(defaultInstanceKey);
    }
  }, [defaultInstanceKey, group.variants, selectedInstanceKey]);

  const detailCategory = isPossibleOriginalSong(selectedSong)
    ? "originals"
    : isCollaborationSong(selectedSong)
      ? "collaborations"
      : isOverallSong(selectedSong)
        ? "overall"
        : "covers";
  const detailSlug = selectedSong.slugv2 ?? selectedSong.video_id;
  const watchHref = selectedSong.tags.includes("カバー曲")
    ? `/watch?q=tag:カバー曲&v=${selectedSong.video_id}${Number(selectedSong.start ?? 0) > 0 ? `&t=${selectedSong.start}` : ""}`
    : isOverallSong(selectedSong)
      ? `/watch?q=tag:${selectedSong.tags.includes("公式ソング") ? "公式ソング" : selectedSong.tags.includes("全体曲") ? "全体曲" : "fes全体曲"}&v=${selectedSong.video_id}`
      : `/watch?q=tag:オリ曲|album:${selectedSong.album}&v=${selectedSong.video_id}`;
  const handleVariantChange = (value: string) => {
    setSelectedInstanceKey(value);
    const nextSong =
      findReleaseVariantByInstanceKey(group.variants, value) ??
      group.representative;
    if (!isAlbumView) {
      onPreview(nextSong);
    }
  };

  return (
    <Table.Tr
      className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
      onMouseEnter={() => {
        if (!isAlbumView) {
          onPreview(selectedSong);
        }
      }}
      onMouseLeave={() => {
        if (!isAlbumView) {
          onPreview(null);
        }
      }}
    >
      <Table.Td className="dark:text-light-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={watchHref}
            className=" hover:text-primary-600 dark:hover:text-white"
          >
            <BsPlayCircle size={24} />
          </Link>
          <ReleaseVariantSwitcher
            variants={group.variants}
            value={resolvedInstanceKey}
            onChange={handleVariantChange}
          />
        </div>
      </Table.Td>
      <Table.Td>
        <Link
          href={
            isAlbumView && selectedSong.album
              ? `/discography/album/${encodeURIComponent(slugify(selectedSong.album))}`
              : `/discography/${detailCategory}/${encodeURIComponent(detailSlug)}`
          }
          className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
        >
          {selectedSong.title}
        </Link>
      </Table.Td>
      <Table.Td>
        <Link
          href={`/?q=artist:${selectedSong.artist}`}
          className="text-primary hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-500"
        >
          {selectedSong.artist}
        </Link>
      </Table.Td>
      <Table.Td>
        {selectedSong.lyricist &&
          selectedSong.lyricist
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
      </Table.Td>
      <Table.Td>
        {selectedSong.composer &&
          selectedSong.composer
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
      </Table.Td>
      <Table.Td>
        {selectedSong.arranger &&
          selectedSong.arranger
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
      </Table.Td>
      <Table.Td className="dark:text-light-gray-500">
        {formatDate(selectedSong.broadcast_at, locale)}
      </Table.Td>
    </Table.Tr>
  );
}

const SongDetails = ({
  song,
  groupByAlbum = true,
}: {
  song: StatisticsItem;
  groupByAlbum?: boolean;
}) => {
  const t = useTranslations("Discography");
  const locale = useLocale();
  const isAlbumView = song.isAlbum && groupByAlbum;
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
  const videoGroups = useMemo(() => groupReleaseVariants(videos), [videos]);
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
  const albumPlaylistUrl = getAlbumPlaylistUrl(song.firstVideo);

  return (
    <div className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 col-span-2 md:col-span-3 xl:col-span-4 p-4 bg-gray-50/20 dark:bg-gray-800 rounded-lg shadow-inner shadow-gray-100 dark:shadow-gray-900 my-2">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3 relative aspect-video">
          {isAlbumView ? (
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
            {isAlbumView && song.firstVideo.album && albumPath ? (
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
          {!isAlbumView && (
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
          {!isAlbumView && (
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
            {t("tracksCount", { count: videoGroups.length })}
          </p>

          <div className="mt-4 max-h-62.5 overflow-y-auto">
            <Table
              stickyHeader
              highlightOnHover
              withRowBorders
              className="w-full text-left text-sm text-gray-500 dark:text-gray-400"
              classNames={{
                thead: "text-xs uppercase text-gray-700 dark:text-gray-400",
                th: "bg-gray-50/50 px-2 py-1 dark:bg-gray-700 dark:text-light-gray-500",
                td: "px-2 py-1",
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>{t("table.songName")}</Table.Th>
                  <Table.Th>{t("table.artist")}</Table.Th>
                  <Table.Th>{t("table.lyricist")}</Table.Th>
                  <Table.Th>{t("table.composer")}</Table.Th>
                  <Table.Th>{t("table.arranger")}</Table.Th>
                  <Table.Th>{t("table.videoDate")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {videoGroups.map((group) => (
                  <SongDetailsVariantRow
                    key={group.key}
                    group={group}
                    isAlbumView={isAlbumView}
                    locale={locale}
                    onPreview={(previewSong) =>
                      setHoveredVideo(previewSong?.video_id ?? null)
                    }
                  />
                ))}
              </Table.Tbody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Link
              href={
                isAlbumView && albumPlaylistUrl
                  ? albumPlaylistUrl
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
                isAlbumView
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
