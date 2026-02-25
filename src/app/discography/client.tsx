"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import useSongs from "../hook/useSongs";
import { Song } from "../types/song";
import Loading from "../loading";
import { Breadcrumbs } from "@mantine/core";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../theme";

const SongPreview = ({ song }: { song: Song }) => {
  const videoId = song.video_id || null;

  const release = song.album_release_at || song.broadcast_at || null;
  const releaseLabel = release ? new Date(release).toLocaleDateString() : null;

  return (
    <div className="group hover:text-primary dark:hover:text-white">
      <div className="w-full aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        {videoId ? (
          <YoutubeThumbnail videoId={videoId} alt={song.title || ""} fill />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
        )}
      </div>
      <div className="mt-2">
        <div className="font-extrabold text-sm line-clamp-2">{song.title}</div>
        <div className="text-xs text-muted-foreground">{song.artist}</div>
        {releaseLabel ? (
          <div className="text-xs text-muted-foreground mt-1">
            {releaseLabel}
          </div>
        ) : null}
        {song.view_count ? (
          <div className="text-xs text-muted-foreground mt-1">
            {Number(song.view_count).toLocaleString()} 回再生
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default function DiscographyClient() {
  const { allSongs: songs, isLoading } = useSongs();

  const searchParams = useSearchParams();

  if (isLoading) {
    return <Loading />;
  }

  const originals = songs.filter((s: any) => isPossibleOriginalSong(s));
  const collabs = songs.filter((s: any) => isCollaborationSong(s));
  const covers = songs.filter((s: any) => isCoverSong(s));

  const sortByRelease = (a: any, b: any) =>
    new Date(b.album_release_at || b.broadcast_at).getTime() -
    new Date(a.album_release_at || a.broadcast_at).getTime();

  const recentOriginals = originals.sort(sortByRelease).slice(0, 5);
  const recentCollabs = collabs.sort(sortByRelease).slice(0, 5);
  const recentCovers = covers.sort(sortByRelease).slice(0, 5);

  return (
    <div className="p-6">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </Link>
        <Link href="/discography" className={breadcrumbClasses.link}>
          楽曲一覧
        </Link>
      </Breadcrumbs>
      <h1 className="font-extrabold text-2xl mb-4">Discography</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        これまでに配信された楽曲の一覧です。オリ曲、コラボ楽曲、カバー楽曲などをまとめています。
      </p>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">
            <Link
              href="/discography/originals"
              className="hover:text-primary dark:hover:text-white"
            >
              オリジナル楽曲
            </Link>{" "}
            ({originals.length})
          </h2>
          <Link href="/discography/originals" className="text-primary text-sm">
            » もっと見る
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentOriginals.map((s: Song, i: number) => (
            <li
              key={
                s.video_id
                  ? `${s.slug ?? "noslug"}-${s.video_id}`
                  : `${s.slug ?? "noslug"}-${i}`
              }
            >
              <Link
                href={`/discography/originals/${s.slugv2}`}
                className="block"
              >
                <SongPreview song={s} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">
            <Link
              href="/discography/collab"
              className="hover:text-primary dark:hover:text-white"
            >
              ユニット・ゲスト楽曲
            </Link>{" "}
            ({collabs.length})
          </h2>
          <Link href="/discography/collab" className="text-primary text-sm">
            » もっと見る
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentCollabs.map((s: any, i: number) => (
            <li
              key={
                s.video_id
                  ? `${s.slug ?? "noslug"}-${s.video_id}`
                  : `${s.slug ?? "noslug"}-${i}`
              }
            >
              <Link href={`/discography/collab/${s.slugv2}`} className="block">
                <SongPreview song={s} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">
            <Link
              href="/discography/covers"
              className="hover:text-primary dark:hover:text-white"
            >
              カバー楽曲
            </Link>{" "}
            ({covers.length})
          </h2>
          <Link href="/discography/covers" className="text-primary text-sm">
            » もっと見る
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentCovers.map((s: any, i: number) => (
            <li
              key={
                s.video_id
                  ? `${s.slug ?? "noslug"}-${s.video_id}`
                  : `${s.slug ?? "noslug"}-${i}`
              }
            >
              <Link href={`/discography/covers/${s.slugv2}`} className="block">
                <SongPreview song={s} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
