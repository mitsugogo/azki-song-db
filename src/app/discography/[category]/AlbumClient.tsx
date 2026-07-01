"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Song } from "../../types/song";
import { FaDatabase, FaPlay, FaYoutube } from "react-icons/fa6";
import { LoadingOverlay } from "@mantine/core";
import {
  isCollaborationSong,
  isPossibleOriginalSong,
} from "../../config/filters";
import useSongs from "../../hook/useSongs";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { LuFolder } from "react-icons/lu";
import DiscographyBreadcrumbs from "../components/DiscographyBreadcrumbs";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../lib/formatDate";
import { siteConfig } from "@/app/config/siteConfig";
import { pageClasses } from "@/app/theme";
import { getAlbumPlaylistUrl } from "../utils/albumLinks";
import ReleaseVariantSwitcher from "../components/ReleaseVariantSwitcher";
import {
  findReleaseVariantByInstanceKey,
  getSongInstanceKey,
  groupReleaseVariants,
  matchesReleaseVariantGroupKey,
  type ReleaseVariantGroup,
} from "../utils/releaseVariants";

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

function getCategoryBreadcrumb(song: Song): { labelKey: string; href: string } {
  const category = resolveSongCategory(song);
  if (category === "originals") {
    return { labelKey: "originalsLabel", href: "/discography/originals" };
  }
  if (category === "collaborations") {
    return { labelKey: "unitLabel", href: "/discography/collab" };
  }
  return { labelKey: "coversLabel", href: "/discography/covers" };
}

function AlbumSongRow({
  group,
  index,
  t,
  tWatchDetail,
  locale,
}: {
  group: ReleaseVariantGroup;
  index: number;
  t: ReturnType<typeof useTranslations>;
  tWatchDetail: ReturnType<typeof useTranslations>;
  locale: string;
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

  return (
    <article className="rounded-xl bg-light-gray-100 dark:bg-gray-700 p-3 md:p-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 text-sm font-semibold text-gray-600 dark:text-light-gray-500 w-10">
          #{index + 1}
        </span>

        <div className="w-32 shrink-0 overflow-hidden rounded aspect-video">
          <YoutubeThumbnail
            videoId={selectedSong.video_id}
            alt={selectedSong.title}
            imageClassName="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Link
                href={buildSongDetailPath(selectedSong)}
                className="block text-base font-semibold text-gray-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 wrap-break-word leading-snug"
              >
                {selectedSong.title}
              </Link>
              <p className="text-sm text-gray-700 dark:text-light-gray-500 wrap-break-word leading-snug">
                {selectedSong.artist}
              </p>
            </div>
            <ReleaseVariantSwitcher
              variants={group.variants}
              value={resolvedInstanceKey}
              onChange={setSelectedInstanceKey}
              testId={`album-release-variant-${index}`}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link
              href={`https://www.youtube.com/watch?v=${selectedSong.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 leading-none"
            >
              <FaYoutube className="text-xs" /> {t("buttons.watchOnYouTube")}
            </Link>
            <Link
              href={`/watch?v=${selectedSong.video_id}&q=album:${encodeURIComponent(selectedSong.album ?? "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-2.5 py-1.5 leading-none"
            >
              <FaPlay className="text-xs" /> {t("buttons.play")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-1 text-xs text-gray-600 dark:text-light-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 pl-13 md:pl-14">
        <span>
          {tWatchDetail("singers") || "歌:"} {selectedSong.sing || "-"}
        </span>
        <span>
          {tWatchDetail("lyricist") || "作詞"}: {selectedSong.lyricist || "-"}
        </span>
        <span>
          {tWatchDetail("composer") || "作曲"}: {selectedSong.composer || "-"}
        </span>
        <span>
          {tWatchDetail("arranger") || "編曲"}: {selectedSong.arranger || "-"}
        </span>
        <span>
          {tWatchDetail("broadcastDate") || "動画公開日:"}{" "}
          {formatDate(selectedSong.broadcast_at, locale)}
        </span>
      </div>
    </article>
  );
}

export default function AlbumClient({
  albumName,
  coverVideoId,
  releaseGroupKey,
}: {
  albumName: string;
  coverVideoId?: string;
  releaseGroupKey?: string;
}) {
  const { allSongs, isLoading } = useSongs();
  const t = useTranslations("Discography");
  const locale = useLocale();
  const tAlbum = useTranslations("DiscographyAlbum");
  const tData = useTranslations("Data");
  const tWatchDetail = useTranslations("Watch.nowPlayingSongInfoDetail");
  const tWatch = useTranslations("Watch.nowPlayingSongInfo");
  const songs: Song[] = allSongs ?? [];
  const rawAlbumSongs = songs
    .filter((song) =>
      releaseGroupKey
        ? song.video_id && matchesReleaseVariantGroupKey(song, releaseGroupKey)
        : song.album && song.video_id && song.album === albumName,
    )
    .sort((left, right) => {
      const leftOrder = left.source_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.source_order ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
  const albumSongGroups = groupReleaseVariants(rawAlbumSongs);
  const leadSong =
    albumSongGroups.find((group) =>
      group.variants.some((song) => song.video_id === coverVideoId),
    )?.representative ?? albumSongGroups[0]?.representative;
  const albumArtists = albumSongGroups
    .map((group) => group.representative.artist?.trim())
    .filter((artist): artist is string => Boolean(artist));
  const hasSingleAlbumArtist =
    albumArtists.length > 0 && new Set(albumArtists).size === 1;
  const isCoverAlbum = hasSingleAlbumArtist
    ? false
    : albumSongGroups.some((group) => {
        const song = group.representative;
        const artist = song.artist?.trim();
        const singer = song.sing?.trim();
        if (!artist || !singer) return false;
        return artist !== singer;
      });

  if (isLoading) {
    return (
      <div className={pageClasses.shell}>
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  if (albumSongGroups.length === 0) {
    return (
      <div className={pageClasses.shell}>
        <h1 className="text-2xl font-bold">
          {tAlbum("notFoundTitle", { site: siteConfig.siteName })}
        </h1>
        <p className="text-sm text-gray-600">{tAlbum("notFoundDescription")}</p>
      </div>
    );
  }
  if (!leadSong) {
    return null;
  }
  const updatedAt = rawAlbumSongs
    .map((song) => new Date(song.broadcast_at).getTime())
    .filter((ts) => !Number.isNaN(ts))
    .sort((a, b) => b - a)[0];
  const playlistUrl = getAlbumPlaylistUrl(leadSong);
  const categoryBreadcrumb = getCategoryBreadcrumb(leadSong);

  return (
    <div className={`${pageClasses.shell} min-h-0 w-full mx-auto`}>
      <DiscographyBreadcrumbs
        items={[
          {
            label: t(categoryBreadcrumb.labelKey),
            href: categoryBreadcrumb.href,
          },
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
            <YoutubeThumbnail videoId={leadSong.video_id} alt={albumName} />
          </div>

          <h1 className="text-2xl font-extrabold mt-4 mb-2">{albumName}</h1>
          {!isCoverAlbum && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {tWatchDetail("artist")} {leadSong.artist}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {tData("table.album_release_at")} :{" "}
            {formatDate(leadSong.album_release_at, locale)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {t("tracksCount", { count: albumSongGroups.length })}
          </p>
          {updatedAt && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {tWatch("lastUpdated", {
                date: formatDate(updatedAt, "ja"),
              })}
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
              <FaYoutube className="mr-2" /> {t("buttons.watchOnYouTube")}
            </Link>
            <Link
              href={`/watch?q=album:${encodeURIComponent(albumName)}&v=${leadSong.video_id}`}
              className="text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-full flex items-center justify-center"
            >
              <FaDatabase className="mr-2" /> {t("buttons.viewInDatabase")}
            </Link>
          </div>
        </aside>

        <section className="rounded-sm bg-gray-50/20 dark:bg-gray-800 p-2 md:p-0">
          <div className="space-y-3">
            {albumSongGroups.map((group, index) => (
              <AlbumSongRow
                key={group.key}
                group={group}
                index={index}
                t={t}
                tWatchDetail={tWatchDetail}
                locale={locale}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
