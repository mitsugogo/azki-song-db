"use client";

import { Link } from "@/i18n/navigation";
import { Song } from "../../../types/song";
import { LuFolder } from "react-icons/lu";
import slugify from "../../../lib/slugify";
import { findRouteForRelease } from "../../../config/timelineRoutes";
import { findVisualForRelease } from "../../../config/timelineVisuals";
import { FaPlay, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Badge, LoadingOverlay, Modal } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../../lib/formatDate";
import { renderLinkedText } from "../../../lib/textLinkify";
import { isCoverSong } from "../../../config/filters";
import useSongs from "../../../hook/useSongs";
import ViewStat from "./viewStat";
import { getCollabUnitName } from "@/app/config/collabUnits";
import DiscographyBreadcrumbs from "../../components/DiscographyBreadcrumbs";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { pageClasses } from "@/app/theme";
import ReleaseVariantSwitcher from "../../components/ReleaseVariantSwitcher";
import {
  chooseReleaseRepresentative,
  findReleaseVariantByInstanceKey,
  getReleaseVariantGroupKey,
  getSongInstanceKey,
  groupReleaseVariants,
  type ReleaseVariantGroup,
} from "../../utils/releaseVariants";

function RelatedVideoCard({
  group,
  category,
  locale,
  showPublishedDate = false,
}: {
  group: ReleaseVariantGroup;
  category: string;
  locale: string;
  showPublishedDate?: boolean;
}) {
  const t = useTranslations("Discography");
  const defaultInstanceKey = getSongInstanceKey(group.representative);
  const [selectedInstanceKey, setSelectedInstanceKey] =
    useState(defaultInstanceKey);
  const selectedSong =
    findReleaseVariantByInstanceKey(group.variants, selectedInstanceKey) ??
    group.representative;
  const resolvedInstanceKey = getSongInstanceKey(selectedSong);
  const internalHref = selectedSong.slugv2
    ? `/discography/${category}/${encodeURIComponent(selectedSong.slugv2)}`
    : selectedSong.title
      ? `/discography/${category}/${encodeURIComponent(slugify(selectedSong.title))}`
      : "#";

  useEffect(() => {
    if (!findReleaseVariantByInstanceKey(group.variants, selectedInstanceKey)) {
      setSelectedInstanceKey(defaultInstanceKey);
    }
  }, [defaultInstanceKey, group.variants, selectedInstanceKey]);

  return (
    <div className="flex items-center gap-3 rounded-md overflow-hidden bg-gray-50/20 dark:bg-gray-800 p-2">
      <div className="w-28 h-16 overflow-hidden rounded">
        <YoutubeThumbnail
          videoId={selectedSong.video_id}
          alt={selectedSong.video_title}
          className="w-full h-full"
          imageClassName="object-cover"
        />
      </div>
      <div className="text-sm flex-1 min-w-0">
        <div className="font-medium wrap-break-word">
          {showPublishedDate ? (
            selectedSong.video_title
          ) : (
            <Link href={internalHref}>{selectedSong.title}</Link>
          )}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {showPublishedDate
            ? `${t("labels.publishedDate")} ${formatDate(
                selectedSong.broadcast_at,
                locale,
              )}`
            : `${selectedSong.artist} - ${selectedSong.sing}`}
        </div>
        <ReleaseVariantSwitcher
          variants={group.variants}
          value={resolvedInstanceKey}
          onChange={setSelectedInstanceKey}
          className="mt-2"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={`https://www.youtube.com/watch?v=${selectedSong.video_id}${
              showPublishedDate && Number(selectedSong.start) > 0
                ? `&t=${selectedSong.start}s`
                : ""
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-red-600 text-white py-1 px-3 rounded-md text-xs"
          >
            <FaYoutube className="inline mr-1 -mt-1" />{" "}
            {t("buttons.watchOnYouTube")}
          </a>
          <Link
            href={`/watch?q=video_id:${selectedSong.video_id}&v=${selectedSong.video_id}${
              Number(selectedSong.start) > 0 ? `&t=${selectedSong.start}` : ""
            }`}
            className="inline-block bg-primary-600 text-white py-1 px-3 rounded-md text-xs"
          >
            <FaPlay className="inline mr-1 -mt-1" /> {t("buttons.play")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClientPage({
  category,
  slug,
}: {
  category: string;
  slug: string;
}) {
  const t = useTranslations("Discography");
  const locale = useLocale();
  const { allSongs, isLoading } = useSongs();
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    null,
  );

  const songs: Song[] = allSongs ?? [];
  const matched = useMemo(
    () =>
      songs.filter(
        (s) =>
          s.slug === slug ||
          s.slugv2 === slug ||
          (s.album && slugify(s.album) === slug),
      ),
    [slug, songs],
  );
  const preferredMatchedSong = useMemo(
    () => chooseReleaseRepresentative(matched) ?? null,
    [matched],
  );
  const currentVariantGroup = useMemo(() => {
    if (!preferredMatchedSong) return null;
    const instanceKey = getSongInstanceKey(preferredMatchedSong);
    return (
      groupReleaseVariants(songs).find((group) =>
        group.variants.some(
          (variant) => getSongInstanceKey(variant) === instanceKey,
        ),
      ) ?? null
    );
  }, [preferredMatchedSong, songs]);
  const song =
    currentVariantGroup &&
    findReleaseVariantByInstanceKey(
      currentVariantGroup.variants,
      selectedVariantKey,
    )
      ? findReleaseVariantByInstanceKey(
          currentVariantGroup.variants,
          selectedVariantKey,
        )
      : (currentVariantGroup?.representative ?? preferredMatchedSong);

  useEffect(() => {
    if (!currentVariantGroup) return;
    const resolvedSelected = findReleaseVariantByInstanceKey(
      currentVariantGroup.variants,
      selectedVariantKey,
    );
    if (!resolvedSelected) {
      setSelectedVariantKey(
        getSongInstanceKey(currentVariantGroup.representative),
      );
    }
  }, [currentVariantGroup, selectedVariantKey]);

  if (isLoading) {
    return (
      <div className={pageClasses.shell}>
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  if (!matched || matched.length === 0) {
    return (
      <div className={pageClasses.shell}>
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="text-sm text-gray-600">{t("notFoundDescription")}</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className={pageClasses.shell}>
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
      </div>
    );
  }

  const matchedRoute = findRouteForRelease(
    song.album_release_at || song.broadcast_at,
  );
  const matchedVisual = findVisualForRelease(
    song.album_release_at || song.broadcast_at,
  );

  const relatedAlbum = songs.filter(
    (s: Song) =>
      s.album &&
      song.album &&
      s.album === song.album &&
      s.video_id &&
      getReleaseVariantGroupKey(s) !== getReleaseVariantGroupKey(song),
  );
  const relatedAlbumGroups = groupReleaseVariants(relatedAlbum);

  const relatedSameTitle = songs.filter(
    (s: Song) =>
      s.title &&
      song.title &&
      s.title === song.title &&
      s.video_id &&
      s.video_id !== song.video_id &&
      s.tags?.some((t) => t.includes("歌枠")),
  );
  const relatedSameTitleGroups = groupReleaseVariants(relatedSameTitle);

  const unitName = getCollabUnitName(song.sing.split("、"));

  const isCover = isCoverSong(song);
  const singerSeparator = locale.startsWith("ja") ? "、" : ", ";
  const breadcrumbAlbumTitle =
    currentVariantGroup && currentVariantGroup.variants.length > 1
      ? currentVariantGroup.representative.title?.trim()
      : song.album?.trim();

  // 現在のページのURL
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className={`${pageClasses.shell} h-full w-full mx-auto`}>
      <DiscographyBreadcrumbs
        items={[
          {
            label:
              category === "originals"
                ? t("originalsLabel")
                : category === "covers"
                  ? t("coversLabel")
                  : t("unitLabel"),
            href: `/discography/${encodeURIComponent(category)}`,
          },
          ...(breadcrumbAlbumTitle
            ? [
                {
                  label: (
                    <>
                      <LuFolder className="inline mr-1" />{" "}
                      {breadcrumbAlbumTitle}
                    </>
                  ),
                  href: `/discography/album/${encodeURIComponent(slugify(breadcrumbAlbumTitle))}`,
                },
              ]
            : []),
          {
            label: song.title
              ? isCover
                ? `${song.title} - ${song.artist}`
                : song.title
              : song.album,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="col-span-1">
          <div
            className="overflow-hidden shadow-lg cursor-zoom-in"
            onClick={() => setThumbnailModalOpen(true)}
            title={t("thumbnailClickTitle")}
          >
            <YoutubeThumbnail
              videoId={song.video_id}
              className="w-full h-auto object-cover"
              alt={song.video_title}
            />
          </div>
          <Modal
            opened={thumbnailModalOpen}
            onClose={() => setThumbnailModalOpen(false)}
            title={song.video_title}
            fullScreen
            centered
          >
            <YoutubeThumbnail
              videoId={song.video_id}
              className="w-full h-auto"
              alt={song.video_title}
            />
          </Modal>
        </div>

        <div className="col-span-2">
          {song.album && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <LuFolder className="inline mr-1" />{" "}
              <Link
                href={`/discography/album/${encodeURIComponent(slugify(song.album))}`}
              >
                {song.album}
              </Link>
            </p>
          )}
          <h1 className="text-3xl font-extrabold mb-2">{song.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {song.artist}
          </p>
          {currentVariantGroup && (
            <ReleaseVariantSwitcher
              variants={currentVariantGroup.variants}
              value={getSongInstanceKey(song)}
              onChange={setSelectedVariantKey}
              className="mb-4"
            />
          )}

          {song.lyricist && (
            <p className="text-sm">
              {t("table.lyricist")}:{" "}
              <Link
                href={`/search?q=lyricist:${encodeURIComponent(song.lyricist)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.lyricist}
              </Link>
            </p>
          )}
          {song.composer && (
            <p className="text-sm">
              {t("table.composer")}:{" "}
              <Link
                href={`/search?q=composer:${encodeURIComponent(song.composer)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.composer}
              </Link>
            </p>
          )}
          {song.arranger && (
            <p className="text-sm">
              {t("table.arranger")}:{" "}
              <Link
                href={`/search?q=arranger:${encodeURIComponent(song.arranger)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.arranger}
              </Link>
            </p>
          )}
          {song.sing && song.sing.length > 1 && (
            <p className="text-sm">
              {t("labels.sing")}:{" "}
              {song.sing.split("、").map((s, idx) => (
                <span key={idx}>
                  <Link
                    href={`/search?q=sing:${encodeURIComponent(s)}`}
                    className="hover:underline text-primary dark:text-primary-300"
                  >
                    {s}
                  </Link>
                  {idx < song.sing.split("、").length - 1 && singerSeparator}
                </span>
              ))}
              {unitName && (
                <>
                  {" "}
                  -{" "}
                  <Badge
                    color="indigo"
                    radius="sm"
                    component="a"
                    href={`/search?q=unit:${encodeURIComponent(unitName)}`}
                    className="cursor-pointer"
                  >
                    {unitName}
                  </Badge>
                </>
              )}
            </p>
          )}
          {song.album_release_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              {t("labels.releaseDate")}{" "}
              {formatDate(song.album_release_at, locale)}
            </p>
          )}
          {!song.album_release_at && song.broadcast_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              {t("labels.publishedDate")}{" "}
              {formatDate(song.broadcast_at, locale)}
            </p>
          )}

          <div className="mt-4">
            <a
              href={`https://www.youtube.com/watch?v=${song.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 text-white py-2 px-4 rounded-md"
            >
              <FaYoutube className="inline mr-1 -mt-1" />{" "}
              {t("buttons.watchOnYouTube")}
            </a>
            <Link
              href={
                song.album
                  ? `/watch?q=album:${song.album}&v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}` : ""}`
                  : `/watch?v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}` : ""}`
              }
              className="inline-block ml-3 bg-primary-600 text-white py-2 px-4 rounded-md"
            >
              <FaPlay className="inline mr-1 -mt-1" /> {t("buttons.play")}
            </Link>

            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(`${song.title} - ${song.artist} \n${currentUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block ml-3 bg-sky-600 text-white py-2 px-4 rounded-md"
            >
              <FaXTwitter className="inline mr-1 -mt-1" /> {t("buttons.share")}
            </a>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 space-y-3">
          <div className="mt-2">
            {matchedRoute && (
              <Badge color="gray" radius="sm">
                {matchedRoute.label}
              </Badge>
            )}
            {matchedVisual && (
              <Badge className="ml-2" color="gray" radius="sm">
                {matchedVisual.label}
              </Badge>
            )}
            {song.extra && (
              <div className="mt-1 whitespace-pre-wrap">
                {renderLinkedText(song.extra)}
              </div>
            )}
          </div>

          <div>
            <div className="aspect-w-16 aspect-h-9 mt-3">
              <iframe
                src={`https://www.youtube.com/embed/${song.video_id}`}
                title={song.video_title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full max-w-3xl aspect-video"
              ></iframe>
            </div>
          </div>

          <div>
            {relatedAlbumGroups.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2">
                  {t("relatedVideos")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedAlbumGroups.map((group) => (
                    <RelatedVideoCard
                      key={group.key}
                      group={group}
                      category={category}
                      locale={locale}
                    />
                  ))}
                </div>
              </>
            )}

            {relatedSameTitleGroups.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2 mt-4">
                  {t("relatedStreamsTitle", {
                    count: relatedSameTitleGroups.length,
                  })}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {relatedSameTitleGroups.map((group) => (
                    <RelatedVideoCard
                      key={group.key}
                      group={group}
                      category={category}
                      locale={locale}
                      showPublishedDate
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="pt-6">
            <ViewStat videoId={song.video_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
