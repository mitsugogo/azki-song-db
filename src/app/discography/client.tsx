"use client";

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react";
import { Song } from "../types/song";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  ToggleSwitch,
} from "flowbite-react";

import { FaCompactDisc, FaDatabase, FaMusic, FaYoutube } from "react-icons/fa6";
import { BsPlayCircle } from "react-icons/bs";
import Link from "next/link";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import Loading from "../loading";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import MilestoneBadge from "../components/MilestoneBadge";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

type StatisticsItem = {
  key: string;
  count: number;
  isAlbum: boolean;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
  videos: Song[];
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
      let videos: Song[] = [];
      if (groupByAlbum && isAlbum) {
        firstVideo = map.get(key)?.firstVideo ?? song;
        lastVideo = song;

        const v = map.get(key)?.videos;
        v?.push(song);
        videos = v ?? [song];
      } else {
        firstVideo =
          (map.get(key)?.firstVideo.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo
            : song;
        lastVideo =
          (map.get(key)?.lastVideo.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo
            : song;
        videos.push(song);
      }

      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        isAlbum: isAlbum,
        firstVideo: firstVideo,
        lastVideo: lastVideo,
        videos: videos,
      } as T & StatisticsItem);
    });
    return map;
  }, new Map<string, T & StatisticsItem>());

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
  return sortedData as Array<T & StatisticsItem>;
};

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
          {song.isAlbum && (
            <>
              <p className="text-sm">
                発売日:{" "}
                {new Date(
                  song.firstVideo.album_release_at
                ).toLocaleDateString()}
              </p>
              <p className="text-sm">収録曲数: {song.count}曲</p>

              <div className="mt-4 overflow-y-auto max-h-[250px]">
                <Table striped hoverable border={3}>
                  <TableHead className="sticky top-0">
                    <TableRow>
                      <TableHeadCell className="px-2 py-1"></TableHeadCell>
                      <TableHeadCell className="px-2 py-1">曲名</TableHeadCell>
                      <TableHeadCell className="px-2 py-1">
                        アーティスト
                      </TableHeadCell>
                      <TableHeadCell className="px-2 py-1">
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
                        <TableCell className="px-2 py-1">
                          <Link
                            href={`/?q=tag:オリ曲|album:${s.album}&pvid=${s.video_id}`}
                            className=" hover:text-primary-600 dark:hover:text-white"
                          >
                            <BsPlayCircle size={24} />
                          </Link>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <Link
                            href={`/?q=title:${s.title}|tag:オリ曲|album:${s.album}`}
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
                          {new Date(s.broadcast_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
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
                  ? `/?q=album:${song.firstVideo.album}&pvid=${song.firstVideo.video_id}`
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

const SongItem = ({
  song,
  isVisible,
  groupByAlbum,
  onClick,
}: {
  song: StatisticsItem;
  isVisible: boolean;
  groupByAlbum?: boolean;
  onClick: (key: string) => void;
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
      onClick={() => onClick(song.key)}
      style={{
        userSelect: "none",
      }}
    >
      <div className="group-hover:blur-[2px] transition-all duration-300">
        <YoutubeThumbnail
          videoId={song.firstVideo.video_id}
          alt={song.firstVideo.video_title}
          fill={true}
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 opacity-0 group-hover:opacity-80 transition-opacity duration-300 dark:bg-opacity-50">
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
              {song.isAlbum && groupByAlbum
                ? `${new Date(
                    song.firstVideo.album_release_at
                  ).toLocaleDateString()}`
                : `${new Date(
                    song.firstVideo.broadcast_at
                  ).toLocaleDateString()}`}
              {song.isAlbum && groupByAlbum ? ` (${song.count}曲)` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DiscographyPage() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  const [activeTab, setActiveTab] = useState(0);

  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // 各タブのアイテムの表示状態を管理するstate
  const [visibleItems, setVisibleItems] = useState<boolean[][]>([[], []]);
  const deferredActiveTab = useDeferredValue(activeTab);

  // グリッドの列数を動的に取得
  const getGridCols = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1280) return 4; // xl:grid-cols-4
    if (window.innerWidth >= 768) return 3; // md:grid-cols-3
    return 2; // grid-cols-2
  };
  const [gridCols, setGridCols] = useState(getGridCols());

  useEffect(() => {
    const handleResize = () => {
      setGridCols(getGridCols());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  const originalSongCountsByReleaseDate = useMemo(() => {
    const originals = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        (s.artist.includes("AZKi") ||
          s.title.includes("feat. AZKi") ||
          s.title.includes("feat.AZKi")) &&
        !s.tags.includes("ユニット曲")
    );
    return createStatistics(
      originals,
      (s) => (groupByAlbum ? s.album || s.title : s.title),
      groupByAlbum
    );
  }, [songs, groupByAlbum]);

  const unitSongCountsByReleaseDate = useMemo(() => {
    const units = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        s.tags.includes("ユニット曲")
    );
    return createStatistics(
      units,
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

  useEffect(() => {
    const itemsToAnimate = [
      originalSongCountsByReleaseDate,
      unitSongCountsByReleaseDate,
      coverSongCountsByReleaseDate,
    ][activeTab];

    setVisibleItems((prev) => {
      const next = [...prev];
      next[activeTab] = new Array(itemsToAnimate.length).fill(false);
      return next;
    });

    setTimeout(() => {
      itemsToAnimate.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            if (Array.isArray(next[activeTab])) {
              const nextInner = [...next[activeTab]];
              nextInner[index] = true;
              next[activeTab] = nextInner;
            }
            return next;
          });
        }, index * 50);
      });
    }, 100);
  }, [
    activeTab,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ]);

  const renderContent = (
    data: StatisticsItem[],
    tabIndex: number,
    groupByAlbum: boolean
  ) => {
    // 展開するアイテムがない場合、通常のグリッドを表示
    if (expandedItem === null) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
          {data.map((song, index) => (
            <SongItem
              key={song.key}
              song={song}
              isVisible={visibleItems[tabIndex]?.[index] || false}
              groupByAlbum={groupByAlbum}
              onClick={() => {
                setExpandedItem(song.key === expandedItem ? null : song.key);
              }}
            />
          ))}
        </div>
      );
    }

    const expandedIndex = data.findIndex((song) => song.key === expandedItem);

    if (expandedIndex === -1) {
      return null;
    }

    const colCount = getGridCols();
    let detailsInsertionIndex =
      Math.floor(expandedIndex / colCount) * colCount + colCount;

    const itemsToRender = [...data];
    itemsToRender.splice(detailsInsertionIndex, 0, data[expandedIndex]);

    // indexがあるか確認してなかったら最終indexにする
    if (detailsInsertionIndex >= itemsToRender.length) {
      detailsInsertionIndex = itemsToRender.length - 1;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
        {itemsToRender.map((song, index) => {
          // SongDetailsの挿入位置
          if (index === detailsInsertionIndex) {
            return (
              <div
                key={`${song.key}-details`}
                className="col-span-2 md:col-span-3 xl:col-span-4"
              >
                <SongDetails song={song} />
              </div>
            );
          }
          // 元のアイテム
          const originalIndex =
            index > detailsInsertionIndex ? index - 1 : index;
          return (
            <SongItem
              key={song.key}
              song={song}
              isVisible={visibleItems[tabIndex]?.[originalIndex] || false}
              groupByAlbum={groupByAlbum}
              onClick={() => {
                setExpandedItem(song.key === expandedItem ? null : song.key);
              }}
            />
          );
        })}
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
      <h1 className="font-extrabold text-2xl p-3 mb-2">Discography</h1>

      <div className="flex items-center justify-end mb-4">
        <ToggleSwitch
          label="アルバムごとに表示"
          checked={groupByAlbum}
          onChange={() => {
            setGroupByAlbum(!groupByAlbum);
            setExpandedItem(null);
          }}
        ></ToggleSwitch>
      </div>

      <TabGroup
        selectedIndex={activeTab}
        onChange={() => {
          setExpandedItem(null);
        }}
      >
        <TabList className="flex space-x-1 rounded-xl bg-gray-50/20 dark:bg-gray-800 p-1 mb-4">
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(0);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/[0.12] hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            オリジナル楽曲 ({originalSongCountsByReleaseDate.length})
          </Tab>
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(1);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/[0.12] hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            ユニット楽曲 ({unitSongCountsByReleaseDate.length})
          </Tab>
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(2);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/[0.12] hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            カバー楽曲 ({coverSongCountsByReleaseDate.length})
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {renderContent(originalSongCountsByReleaseDate, 0, groupByAlbum)}
          </TabPanel>
          <TabPanel>
            {renderContent(unitSongCountsByReleaseDate, 1, groupByAlbum)}
          </TabPanel>
          <TabPanel>
            {renderContent(coverSongCountsByReleaseDate, 2, groupByAlbum)}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </OverlayScrollbarsComponent>
  );
}
