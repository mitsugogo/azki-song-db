"use client";

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react";
import { Song } from "../types/song";
import { Button, TabItem, Tabs, TabsRef, ToggleSwitch } from "flowbite-react";

import { FaCompactDisc, FaDatabase, FaMusic, FaYoutube } from "react-icons/fa6";
import Link from "next/link";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import Loading from "../loading";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import MilestoneBadge from "../components/MilestoneBadge";

type StatisticsItem = {
  key: string;
  count: number;
  isAlbum: boolean;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
};

const createStatistics = <T extends StatisticsItem>(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  groupByAlbum?: boolean
) => {
  const countsMap = songs.reduce((map: Map<string, T>, song: Song) => {
    const keys = Array.isArray(keyFn(song))
      ? (keyFn(song) as string[])
      : [keyFn(song) as string];
    keys.forEach((key) => {
      const isAlbum = "album" in song && song.album;
      let firstVideo: Song | undefined;
      let lastVideo: Song | undefined;
      if (groupByAlbum && isAlbum) {
        firstVideo = map.get(key)?.firstVideo ?? song;
        lastVideo = song;
      } else {
        firstVideo =
          (map.get(key)?.firstVideo.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo
            : song;
        lastVideo =
          (map.get(key)?.lastVideo.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo
            : song;
      }

      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        isAlbum: isAlbum,
        firstVideo: firstVideo,
        lastVideo: lastVideo,
      } as T & StatisticsItem);
    });
    return map;
  }, new Map<string, T & StatisticsItem>());
  console.log(songs);

  const sortedData = groupByAlbum
    ? Array.from(countsMap.values())
    : Array.from(countsMap.values()).sort((a, b) => {
        if (groupByAlbum) {
          return (
            new Date(b.firstVideo.album_release_at).getTime() -
            new Date(a.firstVideo.album_release_at).getTime()
          );
        } else {
          return (
            new Date(b.firstVideo.broadcast_at).getTime() -
            new Date(a.firstVideo.broadcast_at).getTime()
          );
        }
      });
  console.log(sortedData as Array<T & StatisticsItem>);
  return sortedData as Array<T & StatisticsItem>;
};

const SongItem = ({
  song,
  isVisible,
  groupByAlbum,
}: {
  song: StatisticsItem;
  isVisible: boolean;
  groupByAlbum?: boolean;
}) => {
  return (
    <div
      className={`group relative cursor-pointer shadow-lg transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      title={
        song.isAlbum && groupByAlbum
          ? `${song.firstVideo.album}${
              song.song.album_is_compilation
                ? ""
                : " / " + song.firstVideo.artist
            } (${new Date(
              song.firstVideo.album_release_at
            ).toLocaleDateString()})`
          : `${song.firstVideo.title} - ${song.firstVideo.artist} (${new Date(
              song.firstVideo.broadcast_at
            ).toLocaleDateString()})`
      }
    >
      <div className="group-hover:blur-[2px] transition-all duration-300">
        <YoutubeThumbnail
          videoId={song.firstVideo.video_id}
          alt={song.firstVideo.video_title}
          fill={true}
        />
      </div>
      <div
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 opacity-0 group-hover:opacity-80 transition-opacity duration-300"
        onClick={() => {
          // YouTubeを開く
          window.open(
            song.isAlbum && groupByAlbum
              ? song.firstVideo.album_list_uri
              : `https://www.youtube.com/watch?v=${song.firstVideo.video_id}`,
            "_blank",
            "noopener noreferrer"
          );
        }}
      >
        <div className="flex items-center justify-center h-full text-white text-center">
          <div className="flex-row text-sm">
            <div>
              <MilestoneBadge song={song.song} />
            </div>
            <div>
              {song.isAlbum && groupByAlbum ? (
                <FaCompactDisc className="inline mr-2" />
              ) : (
                <FaMusic className="inline mr-2" />
              )}
              {song.isAlbum && groupByAlbum
                ? `${song.firstVideo.album}${
                    song.song.album_is_compilation
                      ? ""
                      : " / " + song.firstVideo.artist
                  }`
                : `${song.firstVideo.title} / ${song.firstVideo.artist}`}
              <br />
              {new Date(song.lastVideo.broadcast_at).toLocaleDateString()}
              {song.isAlbum && groupByAlbum ? `(${song.count}曲)` : ""}
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 right-1 flex gap-x-2">
          <Link
            href={
              song.isAlbum && song.firstVideo.album_list_uri && groupByAlbum
                ? song.firstVideo.album_list_uri
                : `https://www.youtube.com/watch?v=${song.firstVideo.video_id}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
            title={
              song.isAlbum && groupByAlbum
                ? `「${song.firstVideo.album}」をYouTubeで見る`
                : `「${song.firstVideo.title}」をYouTubeで見る`
            }
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FaYoutube className="w-4 h-4 mr-1" />
          </Link>
          <Link
            href={
              song.isAlbum
                ? `/?q=album:${song.firstVideo.album}`
                : `/?q=title:${song.firstVideo.title}+tag:オリ曲`
            }
            className="text-white"
            title={
              song.isAlbum
                ? `「${song.firstVideo.album}」を再生`
                : `「${song.firstVideo.title}」を再生`
            }
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FaDatabase className="w-4 h-4 mr-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function DosographyPage() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [groupByAlbum, setGroupByAlbum] = useState(false);

  // 各タブのアイテムの表示状態を管理するstate
  const [visibleItems, setVisibleItems] = useState<boolean[][]>([[], [], []]);
  const deferredActiveTab = useDeferredValue(activeTab);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  // AZKiさんとしての楽曲
  const originalSongCountsByReleaseDate = useMemo(() => {
    const originals = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        (s.artist.includes("AZKi") ||
          s.artist.includes("瀬名航") ||
          s.artist.includes("Star Flower") ||
          s.artist.includes("SorAZ"))
    );
    return createStatistics(
      originals,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
      groupByAlbum
    );
  }, [songs, groupByAlbum]);

  const coverSongCountsByReleaseDate = useMemo(() => {
    const covers = songs.filter((s) => s.tags.includes("カバー曲"));
    return createStatistics(
      covers,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
      groupByAlbum
    );
  }, [songs, groupByAlbum]);

  // スタッガードアニメーション
  useEffect(() => {
    // 最初にすべてのアイテムを非表示にする
    const newVisibleItems: boolean[][] = [[], [], []];
    newVisibleItems[activeTab] = new Array(
      [originalSongCountsByReleaseDate, coverSongCountsByReleaseDate][
        activeTab
      ].length
    ).fill(false);
    setVisibleItems(newVisibleItems);

    // 遅延をいれつつアニメーション
    setTimeout(() => {
      const itemsToAnimate = [
        originalSongCountsByReleaseDate,
        coverSongCountsByReleaseDate,
      ][activeTab];
      itemsToAnimate.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            next[activeTab] = [...next[activeTab]];
            next[activeTab][index] = true;
            return next;
          });
        }, index * 50);
      });
    }, 100);
  }, [
    activeTab,
    originalSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ]);

  const renderContent = (
    data: StatisticsItem[],
    tabIndex: number,
    groupByAlbum: boolean
  ) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1 lg:gap-4">
        {data.map((song, index) => (
          <SongItem
            key={song.key}
            song={song}
            isVisible={visibleItems[tabIndex]?.[index] || false}
            groupByAlbum={groupByAlbum}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center w-full justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <h1 className="font-extrabold text-2xl p-3 mb-2 dark:text-gray-200">
        Discography
      </h1>

      <div className="flex items-center justify-end mb-4">
        <ToggleSwitch
          label="アルバムごとに表示"
          checked={groupByAlbum}
          onChange={setGroupByAlbum}
        ></ToggleSwitch>
      </div>

      <Tabs variant="fullWidth" ref={tabsRef} onActiveTabChange={setActiveTab}>
        <TabItem
          title={`オリジナル楽曲 (AZKi) (${originalSongCountsByReleaseDate.length})`}
        >
          {renderContent(originalSongCountsByReleaseDate, 0, groupByAlbum)}
        </TabItem>
        <TabItem title={`カバー楽曲 (${coverSongCountsByReleaseDate.length})`}>
          {renderContent(coverSongCountsByReleaseDate, 1, groupByAlbum)}
        </TabItem>
      </Tabs>
    </OverlayScrollbarsComponent>
  );
}
